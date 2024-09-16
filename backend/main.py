from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import os
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],  # change for production.
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)


IMAGE_DIR = r'C:\Users\ameyd\Desktop\IIITD\SEM 7\btp\my_project\wildlife_images'

class ImageResponse(BaseModel):
    images: List[str]

@app.get('/images', response_model=ImageResponse)
async def list_images():
    try:
        files = [f for f in os.listdir(IMAGE_DIR) if os.path.isfile(os.path.join(IMAGE_DIR, f))]
        return ImageResponse(images=files)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/image/{filename}')
async def get_image(filename: str):
    file_path = os.path.join(IMAGE_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5000, log_level='debug')