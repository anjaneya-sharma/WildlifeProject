from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

current_dir = os.getcwd()
IMAGE_DIR = current_dir[:-8] + '\\frontend\\src\\assets\\images'
UPLOAD_DIR = os.path.join(current_dir, "uploads")

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ImageInfo(BaseModel):
    path: str
    class_name: str

class ImageResponse(BaseModel):
    images: List[ImageInfo]

class UploadResponse(BaseModel):
    imageIds: List[str]

class TaskResponse(BaseModel):
    taskId: str
    status: str
    results: dict

@app.post("/upload/", response_model=UploadResponse)
async def upload_files(files: List[UploadFile] = File(...)):
    image_ids = []
    try:
        for file in files:
            # Generate unique ID for the image
            file_id = str(uuid.uuid4())
            extension = os.path.splitext(file.filename)[1]
            new_filename = f"{file_id}{extension}"
            
            # Save the file
            file_path = os.path.join(UPLOAD_DIR, new_filename)
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            image_ids.append(file_id)
            
        return UploadResponse(imageIds=image_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/')
async def read_root():
    return {"message": "Welcome to the FastAPI server!"}

@app.get('/images/', response_model=ImageResponse)
async def list_images(class_name: Optional[str] = None):
    try:
        images = []
        image_dir = Path(IMAGE_DIR)
        
        # Function to check if file is an image
        def is_image(filename):
            return filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
        
        # Walk through the directory structure
        for folder_path, _, files in os.walk(image_dir):
            folder = Path(folder_path)
            # Get class name from folder name
            current_class = folder.relative_to(image_dir).parts[0] if folder != image_dir else "uncategorized"
            
            # Skip if a class filter is specified and doesn't match
            if class_name and class_name != "All" and current_class != class_name:
                continue
                
            for file in files:
                if is_image(file):
                    # Create relative path from IMAGE_DIR
                    relative_path = str(Path(folder_path) / file).replace(str(image_dir), '').lstrip('\\/')
                    images.append(ImageInfo(
                        path=relative_path,
                        class_name=current_class
                    ))
        
        return ImageResponse(images=images)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/image/{filename:path}')
async def get_image(filename: str):
    file_path = os.path.join(IMAGE_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")

@app.get('/classes')
async def list_classes():
    try:
        image_dir = Path(IMAGE_DIR)
        if not image_dir.exists():
            raise HTTPException(status_code=404, detail="Image directory not found")
        
        # Get immediate subdirectories of the image root
        classes = ["All"]  # Always include "All" option
        classes.extend([
            d.name for d in image_dir.iterdir() 
            if d.is_dir() and not d.name.startswith('.')
        ])
        
        return {"classes": classes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-folders/", response_model=UploadResponse)
async def upload_folders(files: List[UploadFile] = File(...)):
    image_ids = []
    try:
        for file in files:
            # Generate unique ID for the image
            file_id = str(uuid.uuid4())
            
            # Get relative path from the folder structure
            folder_path = file.filename.split('/')
            class_name = folder_path[0] if len(folder_path) > 1 else "uncategorized"
            
            # Create class directory if it doesn't exist
            class_dir = os.path.join(IMAGE_DIR, class_name)
            os.makedirs(class_dir, exist_ok=True)
            
            # Save the file with its original name in the class directory
            extension = os.path.splitext(file.filename)[1]
            new_filename = f"{file_id}{extension}"
            file_path = os.path.join(class_dir, new_filename)
            
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            image_ids.append(file_id)
            
        return UploadResponse(imageIds=image_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update the get_image endpoint to check both directories
@app.get('/image/{filename:path}')
async def get_image(filename: str):
    # Check in UPLOAD_DIR first
    upload_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(upload_path):
        return FileResponse(upload_path)
    
    # Then check in IMAGE_DIR
    image_path = os.path.join(IMAGE_DIR, filename)
    if os.path.exists(image_path):
        return FileResponse(image_path)
        
    raise HTTPException(status_code=404, detail="File not found")

# Modify the list_images endpoint
@app.get('/images/', response_model=ImageResponse)
async def list_images(class_name: Optional[str] = None):
    try:
        images = []
        
        def is_image(filename):
            return filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
        
        # Get images from IMAGE_DIR
        image_dir = Path(IMAGE_DIR)
        for folder_path, _, files in os.walk(image_dir):
            folder = Path(folder_path)
            current_class = folder.relative_to(image_dir).parts[0] if folder != image_dir else "uncategorized"
            
            if not class_name or class_name == "All" or current_class == class_name:
                for file in files:
                    if is_image(file):
                        relative_path = str(Path(folder_path) / file).replace(str(image_dir), '').lstrip('\\/')
                        images.append(ImageInfo(
                            path=relative_path,
                            class_name=current_class
                        ))
        
        # Get images from UPLOAD_DIR
        upload_dir = Path(UPLOAD_DIR)
        if upload_dir.exists():
            for file in upload_dir.iterdir():
                if is_image(file.name):
                    images.append(ImageInfo(
                        path=file.name,
                        class_name="uploaded"
                    ))
        
        return ImageResponse(images=images)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class Box(BaseModel):
    id: int
    x: float
    y: float
    width: float
    height: float
    category: str

class BoxData(BaseModel):
    filename: str
    boxes: List[Box]

# Update the save_boxes endpoint in main.py

@app.post("/save_boxes/")
async def save_boxes(data: BoxData):
    try:
        # Create base annotations directory
        annotations_dir = Path("annotations")
        annotations_dir.mkdir(exist_ok=True)
        
        # Handle nested paths (e.g., "Elephants/wildlife_13.jpg")
        filename_parts = Path(data.filename).parts
        if len(filename_parts) > 1:
            # Create subdirectory if image is in a category folder
            category_dir = annotations_dir / filename_parts[0]
            category_dir.mkdir(exist_ok=True)
            base_filename = filename_parts[-1]
        else:
            # If no nested path, use filename directly
            base_filename = data.filename

        # Create annotation filename by replacing image extension with .json
        annotation_filename = Path(base_filename).stem + ".json"
        
        # Construct full path for annotation file
        if len(filename_parts) > 1:
            annotation_path = annotations_dir / filename_parts[0] / annotation_filename
        else:
            annotation_path = annotations_dir / annotation_filename

        # Save the box data
        with open(annotation_path, "w") as f:
            json.dump(data.dict(), f, indent=2)
            
        return {"message": "Boxes saved successfully", "file": str(annotation_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get_boxes/{filename:path}")
async def get_boxes(filename: str):
    try:
        # Create annotation filename from image filename
        annotation_filename = Path(filename).stem + ".json"
        
        # Check both root annotations dir and category subdirs
        possible_paths = [
            Path("annotations") / annotation_filename,  # Root dir
            Path("annotations") / Path(filename).parent / annotation_filename  # Category subdir
        ]
        
        for annotation_path in possible_paths:
            if annotation_path.exists():
                with open(annotation_path, "r") as f:
                    return json.load(f)
                    
        # If no annotation file found, return empty boxes
        return {"filename": filename, "boxes": []}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000, log_level='debug')