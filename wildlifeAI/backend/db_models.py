from collections import Counter
from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy import (DateTime, ForeignKey, LargeBinary, String, Text,
                        UniqueConstraint)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    __abstract__ = True
    use_batch_get = True

class User(Base):
    __tablename__ = 'users'
    id : Mapped[int] = mapped_column(primary_key = True)
    username : Mapped[str] = mapped_column(String(50), unique = True, nullable = False)
    email : Mapped[str] = mapped_column(String(100), unique = True, nullable = False)
    #password_hash : Mapped[str] = mapped_column(String(100), nullable = False)
    is_maintainer : Mapped[bool] = mapped_column(default = False)
    raw_images : Mapped[List['RawImage']] = relationship("RawImage", back_populates = "user")
    saved_images : Mapped[List['SavedImage']] = relationship("SavedImage", back_populates = "user")
    annotations: Mapped[List['Annotation']] = relationship("Annotation", back_populates = "maintainer")
    
class RawImage(Base):
    __tablename__ = 'raw_images'
    id : Mapped[int] = mapped_column(primary_key = True)
    user_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    filename : Mapped[str] = mapped_column(String(255), nullable = False)
    image_data: Mapped[bytes] = mapped_column(LargeBinary, nullable = False)
    upload_date : Mapped[datetime] = mapped_column(DateTime, nullable = False)
    user : Mapped["User"] = relationship(back_populates = "raw_images")
    processed_images : Mapped[List["ProcessedImage"]] = relationship(back_populates = "original_image")

class ProcessedImage(Base):
    __tablename__ = 'processed_images'
    id : Mapped[int] = mapped_column(primary_key = True)
    original_image_id : Mapped[int] = mapped_column(ForeignKey('raw_images.id'))
    filename : Mapped[str] = mapped_column(String(255), nullable = False)
    metadata_ : Mapped[Optional[Dict]] = mapped_column(JSONB)
    original_image : Mapped["RawImage"] = relationship(back_populates = "processed_images")
    saved_images : Mapped[List["SavedImage"]] = relationship(back_populates = "processed_image")
    annotations: Mapped[List["Annotation"]] = relationship(back_populates = "processed_image")
    
    @property
    def detection_count(self) -> Optional[int]: \
        #len(model(str(file_path)).pandas.xywh[0]) 
        return len(self.metadata_.get("detections", []))
    
    @property
    def class_counts(self) -> Dict[str, Optional[int]]: \
        #model(str(file_path)).pandas.xywh[0]['name'].value_counts().to_dict()
        return dict(Counter(d["name"] for d in self.metadata_.get("detections", [])))

class SavedImage(Base):
    __tablename__ = 'saved_images'
    id : Mapped[int] = mapped_column(primary_key = True)
    user_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    processed_image_id : Mapped[int] = mapped_column(ForeignKey('processed_images.id'))
    saved_date : Mapped[datetime] = mapped_column(DateTime, nullable = False)
    user : Mapped["User"] = relationship(back_populates = "saved_images")
    processed_image : Mapped["ProcessedImage"] = relationship(back_populates = "saved_images")

class Annotation(Base):
    __tablename__ = 'annotations'
    id: Mapped[int] = mapped_column(primary_key = True)
    processed_image_id: Mapped[int] = mapped_column(ForeignKey('processed_images.id'))
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    detection_index: Mapped[int] = mapped_column(nullable = False)   
    original_detection: Mapped[Dict] = mapped_column(JSONB, nullable = False)   
    corrected_detection: Mapped[Dict] = mapped_column(JSONB, nullable = False)   
    annotation_date: Mapped[datetime] = mapped_column(DateTime, nullable = False)
    processed_image: Mapped["ProcessedImage"] = relationship(back_populates = "annotations")
    maintainer: Mapped["User"] = relationship(back_populates = "annotations") 

    __table_args__ = (
        UniqueConstraint('processed_image_id', 'detection_index', \
            name = 'unique_annotation_per_detection'),
    )

class Annotation(Base):
    __tablename__ = 'annotations'
    id: Mapped[int] = mapped_column(primary_key = True)
    raw_image_id: Mapped[int] = mapped_column(ForeignKey('processed_images.id'))
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    detection_index: Mapped[int] = mapped_column(nullable = False)   
    original_detection: Mapped[Dict] = mapped_column(JSONB, nullable = False)   
    corrected_detection: Mapped[Dict] = mapped_column(JSONB, nullable = False)   
    annotation_date: Mapped[datetime] = mapped_column(DateTime, nullable = False)
    processed_image: Mapped["ProcessedImage"] = relationship(back_populates = "annotations")
    maintainer: Mapped["User"] = relationship(back_populates = "annotations") 

    __table_args__ = (
        UniqueConstraint('processed_image_id', 'detection_index', \
            name = 'unique_annotation_per_detection'),
    )



#    allows multiple annotations for a single processed_image_id, and  
#    each detection (detection_index) is annotated at most once