# NOT MY CODE, SO DO NOT ASK ME HOW IT WORKS 
# NOT MY CODE, SO DO NOT ASK ME HOW IT WORKS
# NOT MY CODE, SO DO NOT ASK ME HOW IT WORKS
# NOT MY CODE, SO DO NOT ASK ME HOW IT WORKS
# NOT MY CODE, SO DO NOT ASK ME HOW IT WORKS
# NOT MY CODE, SO DO NOT ASK ME HOW IT WORKS
# NOT MY CODE, SO DO NOT ASK ME HOW IT WORKS
# NOT MY CODE, SO DO NOT ASK ME HOW IT WORKS
# NOT MY CODE, SO DO NOT ASK ME HOW IT WORKS


from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import os
import uuid
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

current_dir = os.getcwd()
IMAGE_DIR = current_dir[:-8] + '\\frontend\\src\\assets\\wildlife_images'
UPLOAD_DIR = os.path.join(current_dir, "uploads")

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ImageResponse(BaseModel):
    images: List[str]

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

@app.post("/task/{task_type}")
async def process_task(task_type: str, image_ids: List[str]):
    try:
        # Initialize task in database/queue
        task_id = str(uuid.uuid4())
        
        # Placeholder for task processing
        # In a real application, you would:
        # 1. Queue the task for processing
        # 2. Return a task ID that can be used to check status
        # 3. Process the images asynchronously
        
        return TaskResponse(
            taskId=task_id,
            status="queued",
            results={}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    # Placeholder for checking task status
    # In a real application, you would:
    # 1. Check the status of the task in your database/queue
    # 2. Return the current status and any available results
    
    return TaskResponse(
        taskId=task_id,
        status="completed",
        results={"placeholder": "result"}
    )

# Keep existing endpoints
@app.get('/')
async def read_root():
    return {"message": "Welcome to the FastAPI server!"}

@app.get('/images/', response_model=ImageResponse)
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