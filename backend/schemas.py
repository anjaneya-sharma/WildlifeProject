from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, EmailStr


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
    metadata: List[DetectionResult]
    class Config:
        from_attributes = True
class ProcessedImageListResponse(BaseModel):
    id: int
    filename: str
    metadata: List[DetectionResult]
    class Config:
        from_attributes = True

class BoundingBoxUpdate(BaseModel):
    detection_id: Optional[int] = None
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
