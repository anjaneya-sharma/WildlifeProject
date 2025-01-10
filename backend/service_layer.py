import base64
import io
import os
import shutil
from datetime import datetime
from io import BytesIO
from typing import List
from zipfile import ZipFile

import numpy as np
import torch as T
from fastapi import Form, HTTPException, Response, UploadFile, status
from PIL import Image
from sqlalchemy import cast, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session, selectinload

from config import settings
from db_models import ProcessedImage, RawImage, User
from schemas import BoundingBoxUpdate


def save_upload_file(upload_file: UploadFile, destination: str) -> str:
    try:
        os.makedirs(os.path.dirname(destination), exist_ok = True)
        with open(destination, "wb") as buffer: shutil.copyfileobj(upload_file.file, buffer)
        return destination.replace("/", "\\")
    finally: upload_file.file.close()

def load_model():
    if not settings.WEIGHTS_PATH.exists():
        raise FileNotFoundError(f"Weights file not found at {str(settings.WEIGHTS_PATH)}")
    try:    
        model = T.hub.load('ultralytics/yolov5', 'custom', path = str(settings.WEIGHTS_PATH))
        model.to('cuda' if T.cuda.is_available() else 'cpu')
        #device : str(next(model.parameters()).device)
        model.eval() 
        return model
    except Exception as e: raise RuntimeError(f"Failed to load YOLOv5 model: {str(e)}")
    
try:
    model = load_model() 
    print(f"Model loaded successfully. Device: {next(model.parameters()).device}")
except Exception as e:
    print(f"Error loading model: {str(e)}")
    raise


def upload_raw_image (db: Session, file: UploadFile, current_user: User, \
    SAVE_TO_DB: bool = Form(True)):
    try:
        image_data = file.file.read()
        if not image_data: raise HTTPException(status_code = 400, \
            detail = "file data is empty")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{current_user.id}_{timestamp}_{file.filename}"
        #file_path = UPLOAD_DIRECTORY / "raw" / unique_filename
        #file_path.parent.mkdir(parents = True, exist_ok = True)
        #with file_path.open("wb") as buffer: shutil.copyfileobj(file.file, buffer)
        db_image = RawImage (
            user_id = current_user.id,
            filename = unique_filename,
            image_data = image_data,
            upload_date = datetime.now()
        )
        db.add(db_image)
        db.commit() 
        db.refresh(db_image)
        pil_image = Image.open(io.BytesIO(image_data))
        with T.no_grad():  results = model(pil_image) 
        processed_filename = f"processed_{unique_filename}"
        #processed_path = PROCESSED_DIRECTORY / "processed" / processed_filename
        #processed_path.parent.mkdir(parents = True, exist_ok = True)
        #results.save(str(PROCESSED_DIRECTORY))
        results_df = results.pandas().xywh[0]
        processed_width, processed_height = results.ims[0].shape[1], \
            results.ims[0].shape[0]

        print("Results DataFrame columns:", results_df.columns)
        processed_image = ProcessedImage (
            original_image_id = db_image.id,
            filename = processed_filename,
            metadata_ = {
                "image_size": { 
                    "width": int(pil_image.width),
                    "height": int(pil_image.height)
                },
                "confidence_threshold": float(model.conf),
                "iou_threshold": float(model.iou),
                "detections": [
                    {
                        "x": float(row['xcenter'] * pil_image.width / processed_width),
                        "y": float(row['ycenter'] * pil_image.height / processed_height),
                        "width": float(row['width'] * pil_image.width / processed_width),
                        "height": float(row['height'] * pil_image.height / processed_height),
                        "confidence": row['confidence'],
                        "class_id": int(row['class']),
                        "name": str(row['name']),
                    }
                    for _, row in results_df.iterrows()
                ],
            },
        )   
        db.add(processed_image)
        db.commit()

        return {
            "message": "Image uploaded and processed successfully",
            "raw_image_id": db_image.id, 
            "processed_image_id": processed_image.id,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code = 500, detail = str(e))

def upload_raw_images_folder(db: Session, folder: UploadFile, current_user: User, \
    SAVE_TO_DB: bool = Form(True)):
    
    if not folder.filename.endswith(".zip"):
        raise HTTPException(status_code = 400, detail = "Please upload a zip file")
    try:    
        zip_file = ZipFile(BytesIO(folder.file.read()))
        processed_images = []
        for file_name in zip_file.namelist():
            if file_name.endswith("/") or not \
                file_name.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_filename = f"{current_user.id}_{timestamp}_{file_name}"
            processed_filename = f"processed_{unique_filename}"

            file_data = zip_file.read(file_name)
            pil_image = Image.open(BytesIO(file_data))
            db_raw_image = RawImage (
                user_id = current_user.id,
                filename = unique_filename,
                image_data = file_data,
                upload_date = datetime.now(),   
            )
            db.add(db_raw_image)
            db.commit()
            db.refresh(db_raw_image)
            with T.no_grad(): results = model(np.array(pil_image))
            processed_width, processed_height = results.ims[0].shape[1], \
                results.ims[0].shape[0]
            results_df = results.pandas().xywh[0]
            db_processed_image = ProcessedImage (
                original_image_id = db_raw_image.id,
                filename = processed_filename,
                metadata_ = {
                    "image_size": {
                        "width": int(pil_image.width),
                        "height": int(pil_image.height)
                    },
                    "confidence_threshold": float(model.conf),
                    "iou_threshold": float(model.iou),
                    "detections": [
                        {
                            "x": float(row['xcenter'] * pil_image.width / processed_width),
                            "y": float(row['ycenter'] * pil_image.height / processed_height),
                            "width": float(row['width'] * pil_image.width / processed_width),
                            "height": float(row['height'] * pil_image.height / processed_height),
                            "confidence": float(row['confidence']),
                            "class_id": int(row['class']),
                            "name": str(row['name']),
                        }
                        for _, row in results_df.iterrows()
                    ],
                },
            )
            db.add(db_processed_image)
            db.commit()
            db.refresh(db_processed_image)
            processed_images.append(db_processed_image)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code = 500, detail = str(e))

def get_raw_image(db: Session, image_id: int, current_user: User):
    query = select(RawImage).where (
        RawImage.id == image_id,
        RawImage.user_id == current_user.id
    )
    result = db.execute(query)
    raw_image = result.scalar_one_or_none()
    if not raw_image:
        raise HTTPException (
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "Image not found"
        )
    return raw_image

def get_all_raw_images(db: Session, current_user: User):
    query = select(RawImage).where(RawImage.user_id == current_user.id)
    result = db.execute(query)
    raw_images = result.scalars().all()
    if not raw_images: return []
    images_data = [
        {
            "id": img.id,
            "filename": img.filename,
            "upload_date": img.upload_date,
            "data": base64.b64encode(img.image_data).decode('utf-8'),  
        }
        for img in raw_images
    ]

    return images_data


def get_images_by_class(db: Session, class_name: str, current_user: User):
    if class_name.lower() == "all":
        query = (db.query(ProcessedImage)\
            .join(RawImage, ProcessedImage.original_image_id == RawImage.id)\
                .where(RawImage.user_id == current_user.id)
        )
    else:   
        query = (
            db.query(ProcessedImage)
            .join(RawImage, \
                ProcessedImage.original_image_id == RawImage.id)
            .filter(\
                RawImage.user_id == current_user.id, \
                    cast(ProcessedImage.metadata_["detections"], \
                        JSONB).contains([{"name": class_name}])
            #    ProcessedImage.metadata_["detections"].any_(\
            #        lambda d: d["name"] == class_name
            #    )
            )
        )
    results = query.all()
    if not results:
        raise HTTPException(status_code = 404, \
            detail = f"No images found with detections matching '{class_name}'."
        )
    response_data: List[str] = []
    for processed_image in results:
        raw_image = db.query(RawImage).filter(
            RawImage.id == processed_image.original_image_id
        ).first()
        if not raw_image:
            print(f"Raw image with ID {processed_image.original_image_id} not found")
            continue
        #encoded_image = base64.b64encode(raw_image.image_data).decode("utf-8")
        #response_data.append(encoded_image)
        response_data.append(raw_image.id)
    return response_data

def get_processed_image(raw_image_id: int, current_user: User, db: Session):
    query = select(ProcessedImage).join(RawImage).where(
        ProcessedImage.original_image_id == raw_image_id,
        RawImage.user_id == current_user.id
    #   .options(selectinload(ProcessedImage.original_image))
    )
    result = db.execute(query)
    processed_image = result.scalar_one_or_none()
    
    if not processed_image:
        raise HTTPException (status_code = 404, detail = "Processed image not found")

    return processed_image

def get_all_processed_images(current_user: User, db: Session):
    query = (
        db.query(ProcessedImage)
        .join(RawImage, ProcessedImage.original_image_id == RawImage.id)
        .where(RawImage.user_id == current_user.id)
        .options(selectinload(ProcessedImage.original_image))
    )
    processed_images = query.all()
    return processed_images

from sqlalchemy.orm.attributes import flag_modified


def create_annotation(raw_image_id: int, corrections: List[BoundingBoxUpdate], \
    db: Session, current_user: User, ):
    if not corrections:
        raise HTTPException(status_code = 400, detail = "Corrections list is empty")
    print("Incoming corrections data:")
    for correction in corrections:
        print(correction.model_dump_json())

    query = select(ProcessedImage).join(RawImage).where(
        ProcessedImage.original_image_id == raw_image_id,
        RawImage.user_id == current_user.id
    )
    result = db.execute(query)
    processed_image = result.scalar_one_or_none()
    if not processed_image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Processed image not found")
    metadata = processed_image.metadata_
    if "detections" not in metadata:
        raise HTTPException(status_code=400, detail="No detections found in metadata")
    original_detections = metadata["detections"]
    for correction in corrections:
        if correction.detection_id is not None:
            if (correction.detection_id < 0 or correction.detection_id >=
                    len(original_detections)):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                    detail=f"Invalid detection ID: {correction.detection_id}")
            classes_dict = model.names
            class_id = next((id_ for id_, name in classes_dict.items()
                             if name == correction.label), None)
            if class_id is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                    detail=f"Invalid class name: {correction.label}")
            original_detections[correction.detection_id].update({
                "x": correction.x,
                "y": correction.y,
                "width": correction.width,
                "height": correction.height,
                "confidence": 1.0,
                "class_id": class_id,
                "name": correction.label,
            })
        else:
            original_detections.append({
                "x": correction.x,
                "y": correction.y,
                "width": correction.width,
                "height": correction.height,
                "confidence": 1.0,
                "class_id": class_id,
                "name": correction.label,
            })
    processed_image.metadata_["detections"] = original_detections
    flag_modified(processed_image, "metadata_")
    db.commit()
    return

def update_annotation(raw_image_id: int, detection_id: int, \
    update_data: BoundingBoxUpdate, current_user: User, db: Session):
    #annotation = db.query(Annotation).filter(
    #    Annotation.processed_image_id == processed_image_id,
    #    Annotation.detection_index == detection_id, \
    #        Annotation.user_id == current_user.id
    #).first()
    #if not annotation:
    #    raise HTTPException(status_code = 404, \
    #        detail = "Annotation not found")
    query = select(ProcessedImage).join(RawImage).where(\
        ProcessedImage.original_image_id == raw_image_id, \
            RawImage.user_id == current_user.id)
    result = db.execute(query)
    processed_image = result.scalar_one_or_none()
    if not processed_image:
        raise HTTPException(status_code = 404, detail = "Processed image not found")
    metadata = processed_image.metadata_
    if "detections" not in metadata:
        raise HTTPException(status_code = 400, detail = "No detections found in metadata")
    detections = metadata["detections"]
    if detection_id < 0 or detection_id >= len(detections):
        raise HTTPException(status_code = 400, detail = f"Invalid detection ID: {detection_id}")
    classes_dict = model.names
    class_id = next((id_ for id_, name in classes_dict.items() \
        if name == update_data.label), None)
    if class_id is None:
        raise HTTPException(status_code = 400, \
            detail = f"Invalid class label: {update_data.label}")
    detections[detection_id].update({
        "x": update_data.x,
        "y": update_data.y,
        "width": update_data.width,
        "height": update_data.height,
        "confidence": 1.0,
        "class_id": class_id,
        "name": update_data.label,
    })
    processed_image.metadata_["detections"] = detections
    db.commit()
    return Response(status_code = 204)
