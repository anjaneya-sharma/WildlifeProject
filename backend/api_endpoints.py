import base64
import io
import os
import shutil
from datetime import datetime, timedelta
from io import BytesIO
from pathlib import Path
from typing import Annotated, Dict, List, Optional
from zipfile import ZipFile

import jwt
import numpy as np
import pandas
import torch as T
import torchvision.transforms.functional as TF
import uvicorn
from dotenv import load_dotenv
from fastapi import (Depends, FastAPI, File, Form, HTTPException, Response,
                     UploadFile, status)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from PIL import Image
from pydantic import BaseModel, EmailStr
from sqlalchemy import JSON, cast, or_, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session, selectinload
from torchvision import transforms

import db_models
from auth_layer import authenticate_user, register_maintainer, register_user
from config import settings
from database import SessionLocal, engine
from db_models import Annotation, ProcessedImage, RawImage, User
from schemas import (BoundingBoxUpdate, ProcessedImageListResponse,
                     ProcessedImageResponse, Token, UserCreate, UserResponse)
from service_layer import (create_annotation, get_all_processed_images,
                           get_all_raw_images, get_images_by_class,
                           get_processed_image, get_raw_image,
                           update_annotation, upload_raw_image,
                           upload_raw_images_folder)
from utils import get_user_proxy

# from surveillance import (MonitoringMiddleware, attach_SQA_listeners,
#                           init_prometheus)

db_models.Base.metadata.create_all(bind = engine)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()  

db_dependency = Annotated[Session, Depends(get_db)]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

#attach_SQA_listeners(engine)
#init_prometheus(port = 8001)

@app.post("/register-user", response_model = UserResponse)
def register_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, user)

@app.post("/register-maintainer", response_model = UserResponse)
def register_maintainer_endpoint(maintainer: UserCreate, db: Session = Depends(get_db)):
    return register_maintainer(db, maintainer)

@app.post("/token", response_model = Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    access_token = authenticate_user(db, form_data)
    return Token(access_token = access_token, token_type = "bearer")

@app.post("/upload/raw-image")
def upload_raw_image_endpoint (file: UploadFile = File(...), \
    current_user: User = Depends(get_user_proxy), db: Session = Depends(get_db)):
    return upload_raw_image(db, file, current_user)

@app.post("/upload/raw-images-folder")
def upload_raw_images_folder_endpoint(folder: UploadFile = File(...), \
    current_user: User = Depends(get_user_proxy), db: Session = Depends(get_db)):
    return upload_raw_images_folder(db, folder, current_user)
    
@app.get("/raw-images/{image_id}")
def get_raw_image_endpoint(image_id: int, \
    current_user: User = Depends(get_user_proxy), db: Session = Depends(get_db)):
    raw_image = get_raw_image(db, image_id, current_user)
    return Response(
        content = raw_image.image_data,
        media_type = "image/jpeg",
    )

@app.get("/raw-images")
def get_all_raw_images_endpoint(current_user: User = Depends(get_user_proxy), \
    db: Session = Depends(get_db)):
    return get_all_raw_images(db, current_user)

@app.get("/detection-images/{class_name}")
def get_images_by_class_endpoint(class_name: str, \
    current_user: User = Depends(get_user_proxy), db: Session = Depends(get_db)):
    return get_images_by_class(db, class_name, current_user)

@app.get("/processed-images/{raw_image_id}", response_model = ProcessedImageResponse)
def get_processed_image_endpoint(raw_image_id: int, \
    current_user: User = Depends(get_user_proxy), db: Session = Depends(get_db)):
    processed_image = get_processed_image(db, raw_image_id, current_user)
    return ProcessedImageResponse(
        id = processed_image.id,
        filename = processed_image.filename,
        metadata = processed_image.metadata_["detections"],
    )

@app.get("/processed-images", response_model = List[ProcessedImageListResponse])
def get_all_processed_images_endpoint(current_user: User = Depends(get_user_proxy), \
    db: Session = Depends(get_db)):
    processed_images = get_all_processed_images(db, current_user)
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



@app.post("/annotations/{raw_image_id}", status_code = 204)
def create_annotation_endpoint(raw_image_id: int, \
    corrections: List[BoundingBoxUpdate], \
        current_user: User = Depends(get_user_proxy), db: Session = Depends(get_db)):
    create_annotation(db, raw_image_id, corrections, current_user)
    return Response(status_code = 204)

@app.put("/annotations/{raw_image_id}/{detection_id}", status_code = 204)
def update_annotation_endpoint(raw_image_id: int, \
    detection_id: int, update_data: BoundingBoxUpdate, \
        current_user: User = Depends(get_user_proxy), db: Session = Depends(get_db)):
    update_annotation(db, raw_image_id, detection_id, update_data, current_user)
    return Response(status_code = 204)

@app.get("/annotated-images/{filename}")
def get_annotated_image(filename: str):
    path = settings.PROCESSED_DIRECTORY / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Annotated image not found")
    return FileResponse(str(path))

if __name__ == "__main__":
    uvicorn.run("api_endpoints:app", host = "0.0.0.0", \
        port = 8000, reload = True)