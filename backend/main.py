from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import os
import uuid
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Annotated, Dict, List, Optional

import db_models
import jwt
import pandas
import torch as T
from database import SessionLocal, engine
from db_models import ProcessedImage, RawImage, User
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
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

class ProcessedImageMetadata(BaseModel):
    model: str
    weights_file: str
    confidence_threshold: float
    iou_threshold: float
    device: str
    input_size: int

    class Config:
        from_attributes = True

class DetectionResult(BaseModel):
    xmin: float
    ymin: float
    xmax: float
    ymax: float
    confidence: float
    class_id: int
    name: str

    class Config:
        from_attributes = True

class ProcessedImageResults(BaseModel):
    detections: List[DetectionResult]
    classes: Dict[int, str]
    detection_count: int
    class_counts: Dict[str, int]

    class Config:
        from_attributes = True

class ProcessedImageResponse(BaseModel):
    id: int
    filename: str
    processing_type: str
    metadata: ProcessedImageMetadata
    results: ProcessedImageResults
    processed_date: datetime
    file_path: str

    class Config:
        from_attributes = True

class ProcessedImageListResponse(BaseModel):
    id: int
    filename: str
    processing_type: str
    processed_date: datetime
    metadata: ProcessedImageMetadata
    results: ProcessedImageResults

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

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    credentials_exception = HTTPException (
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail = "Oops! Could not validate credentials",
        headers = {"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, secret_key, algorithms = [encrypt_algo])
        username: str = payload.get("sub")
        if username is None: raise credentials_exception
    except jwt.JWTError: raise credentials_exception
    query = select(User).where(User.username == username)
    result = db.execute(query)
    user = result.scalar_one_or_none()
    if user is None: raise credentials_exception
    return user

def save_upload_file(upload_file: UploadFile, destination: str) -> str:
    try:
        os.makedirs(os.path.dirname(destination), exist_ok = True)
        with open(destination, "wb") as buffer: shutil.copyfileobj(upload_file.file, buffer)
        return destination
    finally: upload_file.file.close()

@app.post("/register", response_model = UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        or_(User.username == user.username, User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException (
            status_code = 400,
            detail = "Username or email already registered"
        )

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

@app.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    query = select(User).where(User.username == form_data.username)
    result = db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException (
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Incorrect username or password",
            headers = {"WWW-Authenticate": "Bearer"},
        )
     
    access_token = create_access_token(data = {"sub": user.username})
    return Token(access_token = access_token, token_type = "bearer")

@app.post("/upload/raw-image")
def upload_raw_image (
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    results.save(str(PROCESSED_DIRECTORY))
    
    results_df = results.pandas().xyxy[0]
    detection_results = {
             "detections": [
                {
                    "xmin": row['xmin'],
                    "ymin": row['ymin'],
                    "xmax": row['xmax'],
                    "ymax": row['ymax'],
                    "confidence": row['confidence'],
                    "class_id": row['class'],
                    "name": row['name']
                }
                for _, row in results_df.iterrows()
            ],
            "classes": model.names,
            "detection_count": len(results_df),
            "class_counts": results_df['name'].value_counts().to_dict()
    }

    processed_image = ProcessedImage (
        original_image_id = db_image.id,
        filename = processed_filename,
        file_path = str(processed_path),
        processing_type = "yolov5_custom",
        metadata_ = {
            "model": "custom_yolov5",
            "weights_file": WEIGHTS_PATH.name,
            "confidence_threshold": float(model.conf),
            "iou_threshold": float(model.iou),
            "device": str(next(model.parameters()).device),
            "input_size": int(model.stride) 
        },
        results = detection_results,
        processed_date = datetime.now()
    )   
    db.add(processed_image)
    db.commit()

    return {
        "message": "Image uploaded and processed successfully",
        "raw_image_id": db_image.id,
        "processed_image_id": processed_image.id,
        "detection_count": detection_results["detection_count"],
        "class_counts": detection_results["class_counts"]
    }
#    except Exception as e:
#        db.rollback()
#        raise HTTPException(status_code=500, detail=str(e))

@app.get("/raw-images/{image_id}", response_model = RawImageResponse)
def get_raw_image(
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
def get_all_raw_images(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = select(RawImage).where(RawImage.user_id == current_user.id)
    result = db.execute(query)
    raw_images = result.scalars().all()
    if not raw_images: return []
    return raw_images

@app.delete("/raw-images/{image_id}")
async def delete_raw_image(
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

'''
@app.get("/raw-images/stats")
def get_image_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = select(RawImage).where(RawImage.user_id == current_user.id)
    result = db.execute(query)
    raw_images = result.scalars().all()    
    total_images = len(raw_images)
    if total_images == 0:
        return {
            "total_images": 0,
            "latest_upload": None,
            "storage_used_kb": 0
        }
    latest_upload = max(img.upload_date for img in raw_images)    
    storage_used = sum(
        os.path.getsize(img.file_path) 
        for img in raw_images 
        if os.path.exists(img.file_path)
    )
    return {
        "total_images": total_images,
        "latest_upload": latest_upload,
        "storage_used_kb": storage_used / 1024
    }
'''

@app.get("/processed-images/{processed_image_id}", response_model = ProcessedImageResponse)
def get_processed_image(
    processed_image_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = select(ProcessedImage).join(RawImage).where(
        ProcessedImage.id == processed_image_id,
        RawImage.user_id == current_user.id
    #   .options(selectinload(ProcessedImage.original_image))
    )
    result = db.execute(query)
    processed_image = result.scalar_one_or_none()
    
    if not processed_image:
        raise HTTPException (
            status_code = 404,
            detail = "Processed image not found or access denied"
        )
    return ProcessedImageResponse(
        id = processed_image.id,
        filename = processed_image.filename,
        processing_type = processed_image.processing_type,
        metadata = processed_image.metadata_,
        results = processed_image.results,
        processed_date = processed_image.processed_date,
        file_path = processed_image.file_path
    )


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5000, log_level='debug')
