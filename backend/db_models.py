from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase): pass 

class User(Base):
    __tablename__ = 'users'
    id : Mapped[int] = mapped_column(primary_key = True)
    username : Mapped[str] = mapped_column(String(50), unique = True, nullable = False)
    email : Mapped[str] = mapped_column(String(100), unique = True, nullable = False)
    password_hash : Mapped[str] = mapped_column(String(100), nullable = False)
    is_maintainer : Mapped[bool] = mapped_column(default = False)
    raw_images : Mapped[List['RawImage']] = relationship("RawImage", back_populates = "user")
    saved_images : Mapped[List['SavedImage']] = relationship("SavedImage", back_populates = "user")
    community_notes : Mapped[List['CommunityNote']] = relationship("CommunityNote", back_populates = "author")

class RawImage(Base):
    __tablename__ = 'raw_images'
    id : Mapped[int] = mapped_column(primary_key = True)
    user_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    filename : Mapped[str] = mapped_column(String(255), nullable = False)
    file_path : Mapped[str] = mapped_column(String(255), nullable = False)
    upload_date : Mapped[datetime] = mapped_column(DateTime, nullable = False)
    user : Mapped["User"] = relationship(back_populates = "raw_images")
    processed_images : Mapped[List["ProcessedImage"]] = relationship(back_populates = "original_image")

class ProcessedImage(Base):
    __tablename__ = 'processed_images'
    id : Mapped[int] = mapped_column(primary_key = True)
    original_image_id : Mapped[int] = mapped_column(ForeignKey('raw_images.id'))
    filename : Mapped[str] = mapped_column(String(255), nullable = False)
    file_path : Mapped[str] = mapped_column(String(255), nullable = False)
    processing_type : Mapped[str] = mapped_column(String(50), nullable = False)
    metadata_ : Mapped[Optional[Dict]] = mapped_column(JSONB)
    results : Mapped[Optional[Dict]] = mapped_column(JSONB)
    processed_date : Mapped[datetime] = mapped_column(DateTime, nullable = False)
    original_image : Mapped["RawImage"] = relationship(back_populates = "processed_images")
    saved_images : Mapped[List["SavedImage"]] = relationship(back_populates = "processed_image")
    community_notes : Mapped[List["CommunityNote"]] = relationship(back_populates = "processed_image")

class SavedImage(Base):
    __tablename__ = 'saved_images'
    id : Mapped[int] = mapped_column(primary_key = True)
    user_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    processed_image_id : Mapped[int] = mapped_column(ForeignKey('processed_images.id'))
    saved_date : Mapped[datetime] = mapped_column(DateTime, nullable = False)
    user : Mapped["User"] = relationship(back_populates = "saved_images")
    processed_image : Mapped["ProcessedImage"] = relationship(back_populates = "saved_images")

class CommunityNote(Base):
    __tablename__ = 'community_notes'
    id : Mapped[int] = mapped_column(primary_key = True)
    processed_image_id : Mapped[int] = mapped_column(ForeignKey('processed_images.id'))
    author_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    content : Mapped[str] = mapped_column(Text, nullable = False)
    created_at : Mapped[datetime] = mapped_column(DateTime, nullable = False)
    processed_image : Mapped["ProcessedImage"] = relationship(back_populates = "community_notes")
    author : Mapped["User"] = relationship(back_populates = "community_notes")