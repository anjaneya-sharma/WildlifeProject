
from typing import Optional

import jwt
from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from config import settings
from db_models import User
from schemas import UserCreate
from utils import create_access_token, get_password_hash, verify_password


def register_user(db: Session, user: UserCreate) -> User:
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


def register_maintainer(db: Session, maintainer: UserCreate):
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

def get_current_user(token: str, db: Session) -> Optional[User]:
    credentials_exception = HTTPException (status_code = status.HTTP_401_UNAUTHORIZED, \
        detail = "Oops! Could not validate credentials", \
            headers = {"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms = [settings.ALGORITHM])
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

def authenticate_user(db: Session, form_data):
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
    return access_token
