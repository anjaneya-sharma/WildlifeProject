import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

class Settings:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    ALGORITHM = os.environ.get("ALGORITHM")
    ACCESS_TOKEN_EXPIRY = int(os.environ.get("ACCESS_TOKEN_EXPIRY", 30))
    UPLOAD_DIRECTORY = Path("uploads/")
    PROCESSED_DIRECTORY = Path("processed/")
    WEIGHTS_PATH = Path("runs/train/wii_28_072/weights/best.pt")

settings = Settings()