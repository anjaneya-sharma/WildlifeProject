from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from datetime import datetime, timedelta
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Annotated, Dict, List, Optional
from zipfile import ZipFile

import db_models
import jwt
import numpy as np
import pandas
import torch as T
from database import SessionLocal, engine
from db_models import Annotation, ProcessedImage, RawImage, User
from dotenv import load_dotenv
from fastapi import (Depends, FastAPI, File, Form, HTTPException, Response,
                     UploadFile, status)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
secret_key = os.environ["SECRET_KEY"]
encrypt_algo = os.environ["ALGORITHM"]
access_token_exp_time = os.environ["ACCESS_TOKEN_EXPIRY"]
UPLOAD_DIRECTORY = Path("uploads/")
PROCESSED_DIRECTORY = Path("processed/")
WEIGHTS_PATH = Path("runs/train/wii_28_072/weights/best.pt")  
UPLOAD_DIRECTORY.mkdir(exist_ok = True)
PROCESSED_DIRECTORY.mkdir(exist_ok = True)

#USER PASSWORD HASHING
pwd_context = CryptContext(schemes = ["bcrypt"], deprecated = "auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "token")

app = FastAPI()
db_models.Base.metadata.create_all(bind = engine)

def load_model():
    if not WEIGHTS_PATH.exists():
        raise FileNotFoundError(f"Weights file not found at {str(WEIGHTS_PATH)}")
    try:    
        model = T.hub.load('ultralytics/yolov5', 'custom', path = str(WEIGHTS_PATH))
        model.to('cuda' if T.cuda.is_available() else 'cpu')
        #device : str(next(model.parameters()).device)
        model.eval() 
        return model
    except Exception as e_: raise RuntimeError(f"Failed to load YOLOv5 model: {str(e_)}")
    
try:
    model = load_model() 
    print(f"Model loaded successfully. Device: {next(model.parameters()).device}")
except Exception as e:
    print(f"Error loading model: {str(e)}")
    raise

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_maintainer: bool

    class Config:
        from_attributes = True

class RawImageResponse(BaseModel):
    id: int
    filename: str
    upload_date: datetime
    file_path: str

    class Config:
        from_attributes = True

class DetectionResult(BaseModel):
    x: float
    y: float
    width: float
    height: float
    confidence: float
    class_id: int
    name: str

    class Config:
        from_attributes = True

class ProcessedImageMetadata(BaseModel):
    image_size: Dict[str, int]
    confidence_threshold: float
    # controls sensivity and precision of detections
    iou_threshold: float
    # accuracy in localization of detected objects
    detections: List[DetectionResult]
    class Config:
        from_attributes = True
        
class ProcessedImageResponse(BaseModel):
    id: int
    filename: str
    metadata: DetectionResult
    file_path: str
    class Config:
        from_attributes = True
class ProcessedImageListResponse(BaseModel):
    id: int
    filename: str
    metadata: DetectionResult
    class Config:
        from_attributes = True

class BoundingBoxUpdate(BaseModel):
    detection_id: int | None
    x: float
    y: float
    width: float
    height: float 
    label: str
class AnnotationResponse(BaseModel):
    id: int
    processed_image_id: int
    maintainer_id: int
    detection_index: int
    original_detection: DetectionResult
    corrected_detection: DetectionResult
    annotation_date: datetime

    class Config:
        from_attributes = True
    
class Token(BaseModel):
    access_token: str 
    token_type: str

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()  

db_dependency = Annotated[Session, Depends(get_db)]

def verify_password(plain_password : str, hashed_password : str) -> bool: 
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes = int(access_token_exp_time))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm = encrypt_algo)
    return encoded_jwt

# ENDPOINTS

def get_current_user(token: str = Depends(oauth2_scheme), \
    db: Session = Depends(get_db)) -> Optional[User]:
    credentials_exception = HTTPException (status_code = status.HTTP_401_UNAUTHORIZED, \
        detail = "Oops! Could not validate credentials", \
            headers = {"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, secret_key, algorithms = [encrypt_algo])
        username: str = payload.get("sub")
        is_maintainer: bool = payload.get("is_maintainer", False)
        if username is None: raise credentials_exception
    except jwt.JWTError: raise credentials_exception
    query = select(User).where(User.username == username)
    result = db.execute(query)
    user = result.scalar_one_or_none()
    if user is None: raise credentials_exception
    user.is_maintainer = is_maintainer
    return user

def save_upload_file(upload_file: UploadFile, destination: str) -> str:
    try:
        os.makedirs(os.path.dirname(destination), exist_ok = True)
        with open(destination, "wb") as buffer: shutil.copyfileobj(upload_file.file, buffer)
        return destination.replace("/", "\\")
    finally: upload_file.file.close()

@app.post("/register-user", response_model = UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        or_(User.username == user.username, User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException (status_code = 400, detail = "User already registered")

    hashed_password = get_password_hash(user.password)
    db_user = User (
        username = user.username,
        email = user.email,
        password_hash = hashed_password,
        is_maintainer = False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/register-maintainer", response_model = UserResponse)
def register_maintainer(maintainer: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        or_(User.username == maintainer.username, User.email == maintainer.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code = 400, detail = "Maintainer already registered")

    hashed_password = get_password_hash(maintainer.password)
    db_maintainer = User(
        username = maintainer.username,
        email = maintainer.email,
        password_hash = hashed_password,
        is_maintainer = True,
    )
    db.add(db_maintainer)
    db.commit()
    db.refresh(db_maintainer)
    return db_maintainer

@app.post("/token", response_model = Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    query = select(User).where(User.username == form_data.username)
    result = db.execute(query)
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException (
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Incorrect username or password",
            headers = {"WWW-Authenticate": "Bearer"},
        ) 
    access_token = create_access_token(data = {"sub": user.username, \
        "is_maintainer": user.is_maintainer})    
    return Token(access_token = access_token, token_type = "bearer")

# All classes given by model.names 
@app.post("/upload/raw-image")
def upload_raw_image (file: UploadFile = File(...), \
    current_user: User = Depends(get_current_user), \
        db: Session = Depends(get_db)):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{current_user.id}_{timestamp}_{file.filename}"
    file_path = UPLOAD_DIRECTORY / "raw" / unique_filename
    file_path.parent.mkdir(parents = True, exist_ok = True)
    with file_path.open("wb") as buffer: shutil.copyfileobj(file.file, buffer)
    db_image = RawImage (
        user_id = current_user.id,
        filename = unique_filename,
        file_path = str(file_path),
        upload_date = datetime.now()
    )
    db.add(db_image)
    db.commit() 
    db.refresh(db_image)
    #dict = {"message": "Image uploaded successfully", "image_id": db_image.id}
    #print(json.dumps(dict, index = 2))
    with T.no_grad():  results = model(str(file_path)) 
    processed_filename = f"processed_{unique_filename}"
    processed_path = PROCESSED_DIRECTORY / "processed" / processed_filename
    processed_path.parent.mkdir(parents = True, exist_ok = True)
    results.save(str(PROCESSED_DIRECTORY))
    
    results_df = results.pandas().xywh[0]
    processed_image = ProcessedImage (
        original_image_id = db_image.id,
        filename = processed_filename,
        file_path = str(processed_path),
        metadata_ = {
            "image_size": { 
                "width": int(results.ims[0].shape[1]),
                "height": int(results.ims[0].shape[0])
            },
            "confidence_threshold": float(model.conf),
            "iou_threshold": float(model.iou),
            "detections": [
                {
                    "x": row['x'],
                    "y": row['y'],
                    "width": float(row['w']),
                    "height": float(row['h']),
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
#    except Exception as e:
#        db.rollback()
#        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/raw-images-folder")
def upload_raw_images_folder(folder: UploadFile = File(...), \
    current_user: User = Depends(get_current_user), \
        db: Session = Depends(get_db)):
    try:
        if not folder.filename.endswith(".zip"):
            raise HTTPException(status_code = 400, detail = "Please upload a zip file")
        zip_file = ZipFile(BytesIO(folder.file.read()))
        processed_images = []
        for file_name in zip_file.namelist():
            if not file_name.endswith("/"):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                unique_filename = f"{current_user.id}_{timestamp}_{file_name.split('/')[-1]}"
                file_destination = UPLOAD_DIRECTORY / "raw" / unique_filename
                with zip_file.open(file_name) as extracted_file:
                    save_upload_file(UploadFile(extracted_file), str(file_destination))
                with T.no_grad(): results = model(str(file_destination))
                processed_filename = f"processed_{unique_filename}"
                processed_path = PROCESSED_DIRECTORY / "processed" / processed_filename
                results.save(str(PROCESSED_DIRECTORY))

                results_df = results.pandas().xywh[0]

                db_image = RawImage (
                    user_id = current_user.id,
                    filename = unique_filename,
                    file_path = str(file_destination),
                    upload_date = datetime.now()
                )
                db.add(db_image)
                db.commit()
                db.refresh(db_image)
                
                db_processed_image = ProcessedImage (
                    original_image_id = db_image.id,
                    filename = processed_filename,
                    file_path = str(processed_path),
                    metadata_ = {
                        "image_size": {
                            "width": int(results.ims[0].shape[1]),
                            "height": int(results.ims[0].shape[0])
                        },
                        "confidence_threshold": float(model.conf),
                        "iou_threshold": float(model.iou),
                        "detections": [
                            {
                                "x": float(row['x']),
                                "y": float(row['y']),
                                "width": float(row['w']),
                                "height": float(row['h']),
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
        return {
            "message": "Images uploaded and processed successfully",
            "processed_image_ids": [img.id for img in processed_images],
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code = 500, detail = str(e))
    
@app.get("/raw-images/{image_id}", response_model = RawImageResponse)
def get_raw_image(image_id: int, \
    current_user: User = Depends(get_current_user), \
        db: Session = Depends(get_db)):
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

@app.get("/raw-images", response_model = List[RawImageResponse])
def get_all_raw_images(current_user: User = Depends(get_current_user), \
    db: Session = Depends(get_db)):
    query = select(RawImage).where(RawImage.user_id == current_user.id)
    result = db.execute(query)
    raw_images = result.scalars().all()
    if not raw_images: return []
    return raw_images

@app.delete("/raw-images/{image_id}")
async def delete_raw_image(image_id: int, \
    current_user: User = Depends(get_current_user), \
        db: Session = Depends(get_db)):
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
    try:
        if os.path.exists(raw_image.file_path): os.remove(raw_image.file_path)
    except OSError as e:
        raise HTTPException (
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = f"Error deleting file: {str(e)}"
        )    
    db.delete(raw_image)
    db.commit()
    return {"message": "Image deleted successfully"}

@app.get("/processed-images/filter")
def get_processed_images_by_class(class_name: str, \
    current_user: User = Depends(get_current_user), \
        db: Session = Depends(get_db)):
    query = (
        db.query(ProcessedImage)
        .join(RawImage, ProcessedImage.original_image_id == RawImage.id)
        .where(RawImage.user_id == current_user.id,
            ProcessedImage.metadata_["class_counts"].contains({class_name: 1})
        )
    )
    processed_images = query.all()
    return [
        ProcessedImageListResponse (
            id = img.id,
            filename = img.filename,
            metadata = img.metadata_,
        )
        for img in processed_images
    ]

@app.get("/processed-images/{processed_image_id}", response_model = ProcessedImageResponse)
def get_processed_image(processed_image_id: int, \
    current_user: User = Depends(get_current_user), \
        db: Session = Depends(get_db)):
    query = select(ProcessedImage).join(RawImage).where(
        ProcessedImage.id == processed_image_id,
        RawImage.user_id == current_user.id
    #   .options(selectinload(ProcessedImage.original_image))
    )
    result = db.execute(query)
    processed_image = result.scalar_one_or_none()
    
    if not processed_image:
        raise HTTPException (status_code = 404, detail = "Processed image not found")

    return ProcessedImageResponse (
        id = processed_image.id,
        filename = processed_image.filename,
        metadata = processed_image.metadata_["detections"],
        file_path = processed_image.file_path,
    )

@app.get("/processed-images", response_model = List[ProcessedImageListResponse])
def get_all_processed_images(current_user: User = Depends(get_current_user), \
    db: Session = Depends(get_db)):
    query = (
        db.query(ProcessedImage)
        .join(RawImage, ProcessedImage.original_image_id == RawImage.id)
        .where(RawImage.user_id == current_user.id)
        .options(selectinload(ProcessedImage.original_image))
    )
    processed_images = query.all()
    response_images : List = []
    for img in processed_images:
        response_images.append(
            ProcessedImageListResponse (
                id = img.id,
                filename = img.filename,
                metadata = img.metadata_["detections"],
            )
        )
    return response_images

@app.get("/processed-images/{processed_image_id}/detections")
def get_detection_details(processed_image_id: int, \
    confidence_threshold: float = 0.5, \
        current_user: User = Depends(get_current_user), \
            db: Session = Depends(get_db)):
    query = (
        select(ProcessedImage)
        .join(RawImage)
        .where(
            ProcessedImage.id == processed_image_id,
            RawImage.user_id == current_user.id
        )
    )
    result = db.execute(query)
    processed_image = result.scalar_one_or_none()
    if not processed_image: 
        raise HTTPException(status_code = 404, detail = "Processed image not found")
    
    filtered_detections = [
        detection for detection in processed_image.metadata_["detections"]
        if detection["confidence"] >= confidence_threshold
    ]
    
    return {
        "image_id": processed_image_id,
        "filename": processed_image.filename,
        "total_detections": len(filtered_detections),
        "confidence_threshold": confidence_threshold,
        "detections": filtered_detections,
        "image_size": processed_image.metadata_["image_size"],
        "class_distribution": processed_image.metadata_["class_counts"]
    }


@app.post("/annotations", status_code = 204)
def create_annotation(processed_image_id: int, \
    corrections: List[BoundingBoxUpdate], \
        current_user: User = Depends(get_current_user), \
            db: Session = Depends(get_db)):
    
    query = select(ProcessedImage).join(RawImage).where(\
        ProcessedImage.id == processed_image_id, \
            RawImage.user_id == current_user.id
    #   .options(selectinload(ProcessedImage.original_image))
    )
    result = db.execute(query)
    processed_image = result.scalar_one_or_none()    
    if not processed_image:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, \
            detail = "Processed image not found")
        
    original_detections = processed_image.metadata_["detections"]
    for correction in corrections:
        if correction.detection_id is not None:
            if (correction.detection_id < 0 or correction.detection_id >= \
                len(original_detections)): 
                raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, \
                    detail = f"Invalid detection ID: {correction.detection_id}")
                
            original_detection = original_detections[correction.detection_id]
        else: original_detection = {}
        classes_dict = model.names
        try: 
            #class_id = classes_dict.index(annotation.corrected_detection.label)
            class_id = next((id_ for id_, name in classes_dict.items() \
                if name == correction.label), None)
        except ValueError:
            raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, \
                detail = f"Invalid class name: {correction.label}"
        )

        corrected_detection: Dict[str, Optional[float | int | str]] = {
            "x": correction.x,
            "y": correction.y,
            "width": correction.width,
            "height": correction.height,
            "confidence": 1.0,
            "class_id": class_id,
            "name": correction.label,
        } 
        
        new_annotation = Annotation(
            processed_image_id = processed_image_id,
            user_id = current_user.id,
            detection_index = correction.detection_id,
            original_metadata = original_detection,
            corrected_metadata = corrected_detection,
            annotation_date = datetime.now(),
        )
        db.add(new_annotation)
    db.commit()
    return Response(status_code = 204)


@app.put("/annotations/{processed_image_id}/{detection_id}", status_code = 204)
def update_annotation(processed_image_id: int, \
    detection_id: int, update_data: BoundingBoxUpdate, \
        current_user: User = Depends(get_current_user), \
            db: Session = Depends(get_db)):
    annotation = db.query(Annotation).filter(
        Annotation.processed_image_id == processed_image_id,
        Annotation.detection_index == detection_id, \
            Annotation.user_id == current_user.id
    ).first()
    if not annotation:
        raise HTTPException(status_code = 404, \
            detail = "Annotation not found")

    classes_dict = model.names
    class_id = next((id_ for id_, name in classes_dict.items() \
        if name == update_data.label), None)
    if class_id is None:
        raise HTTPException(status_code = 400, \
            detail = f"Invalid class label: {update_data.label}")

    annotation.corrected_detection = {
        "x": update_data.x,
        "y": update_data.y,
        "width": update_data.width,
        "height": update_data.height,
        "confidence": 1.0,
        "class_id": class_id,
        "name": update_data.label,
    }
    db.commit()
    return Response(status_code = 204)

@app.get("/annotations/{processed_image_id}")
def get_annotations(processed_image_id: int, \
    current_user: User = Depends(get_current_user), \
        db: Session = Depends(get_db)):
    annotations = db.query(Annotation).filter(
        Annotation.processed_image_id == processed_image_id, \
            Annotation.user_id == current_user.id
    ).all()
    if not annotations: raise HTTPException(status_code = 404, \
        detail = "No annotations found for this image")
    corrected_detections = [annotation.corrected_detection for annotation in annotations]
    return {"processed_image_id": processed_image_id, "corrected_detections": corrected_detections}
