from datetime import datetime, timedelta

import jwt
from passlib.context import CryptContext

from config import Settings


def verify_password(plain_password : str, hashed_password : str) -> bool:
    pwd_context = CryptContext(schemes = ["bcrypt"], deprecated = "auto") 
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    pwd_context = CryptContext(schemes = ["bcrypt"], deprecated = "auto")
    return pwd_context.hash(password)

def create_access_token(data: dict, settings: Settings) -> str:
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes = int(settings.ACCESS_TOKEN_EXPIRY))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm = settings.ALGORITHM)
    return encoded_jwt

def get_user_proxy():
    from db_models import User
    return User(id = 1, username = "guest", \
        email = "guest@example.com", is_maintainer = False)
