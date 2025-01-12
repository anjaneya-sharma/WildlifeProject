import io
import json
import logging
import os
import secrets
import time
import uuid
from typing import List, Optional
from zipfile import ZipFile
import zipfile

import cv2
import psycopg2
from psycopg2.extras import DictCursor
from PIL import Image
import torchvision.transforms.functional as TF
from torchvision import transforms

from fastapi import FastAPI, File, HTTPException, Request, UploadFile, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import FileResponse, JSONResponse

from ObjectDetection.scripts.initialize_database import initialize_database
from ObjectDetection.scripts.inference import load_model, run_inference
import BirdCount.model_files.demomodified as demo


from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

DB_CONFIG = {
    "dbname": os.getenv('DB_NAME'),
    "user": os.getenv('DB_USER'),
    "password": os.getenv('DB_PASSWORD'), 
    "host": os.getenv('DB_HOST'),
    "port": os.getenv('DB_PORT')
}

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    SessionMiddleware,
    secret_key=secrets.token_urlsafe(32),
    session_cookie="wildlife_session",
    max_age=7200,
    https_only=False
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


async def get_user_id(request: Request):
    if "user_id" not in request.session:
        try:
            with psycopg2.connect(**DB_CONFIG) as conn:
                with conn.cursor() as cur:
                    cur.execute("INSERT INTO users (created_at) VALUES (NOW()) RETURNING id")
                    user_id = cur.fetchone()[0]
                    conn.commit()
                    request.session["user_id"] = user_id
                    logger.debug(f"Created new user_id: {user_id}")
        except Exception as e:
            logger.error(f"Database error creating user: {e}")
            raise HTTPException(status_code=500, detail="Error creating user session")
    return request.session["user_id"]


@app.on_event("startup")
async def startup_event():
    logger.info("Checking database configuration...")
    try:
        if not initialize_database():
            raise Exception("Failed to initialize database")
        logger.info("Database configuration verified successfully")
        
        app.state.model = load_model()
        logger.info("YOLO model loaded successfully")
    except Exception as e:
        logger.error(f"Initialization error: {e}")
        raise RuntimeError("Could not initialize application")


@app.get("/images/ObjectDetection/")
async def get_images(request: Request, class_id: Optional[int] = None, image_id: Optional[int] = None):
    user_id = await get_user_id(request)
    try:
        with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
            with conn.cursor() as cur:
                if image_id:
                    cur.execute(
                        "SELECT filepath FROM images WHERE id = %s AND user_id = %s AND model_type =1",
                        (image_id, user_id)
                    )
                    result = cur.fetchone()
                    if not result:
                        raise HTTPException(status_code=404, detail="Image not found")
                    
                    file_path = result['filepath']
                    if not os.path.exists(file_path):
                        raise HTTPException(status_code=404, detail="Image file not found")
                    return FileResponse(file_path)
                
                if class_id is not None:
                    cur.execute("""
                        SELECT DISTINCT i.id 
                        FROM images i
                        INNER JOIN boxes b ON i.id = b.image_id 
                        WHERE b.class_id = %s AND i.user_id = %s
                    """, (class_id, user_id))
                else:
                    cur.execute(
                        "SELECT id FROM images WHERE user_id = %s AND model_type = 1",
                        (user_id,)
                    )
                return {"image_ids": [row[0] for row in cur.fetchall()]}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Database error: {e}")
        return {"error": str(e)}


@app.get("/images/ObjectDetection/{image_id}/bounding-boxes")
async def get_boxes(request: Request, image_id: int):
    user_id = await get_user_id(request)
    try:
        with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT b.* FROM boxes b
                    JOIN images i ON b.image_id = i.id
                    WHERE i.id = %s AND i.user_id = %s
                """, (image_id, user_id))
                return {"boxes": cur.fetchall()}
    except Exception as e:
        logger.error(f"Database error: {e}")
        return {"error": str(e)}


@app.post("/images/ObjectDetection/")
async def upload_images(
    request: Request,
    files: List[UploadFile] = File(...)
):
    user_id = await get_user_id(request)
    try:
        with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
            with conn.cursor() as cur:
                uploaded_ids = []
                for file in files:
                    unique_filename = f"{uuid.uuid4()}_{file.filename}"
                    file_path = os.path.join(UPLOAD_DIR, unique_filename)
                    
                    with open(file_path, "wb") as buffer:
                        content = await file.read()
                        buffer.write(content)
                    
                    cur.execute(
                        """
                        INSERT INTO images (filename, filepath, user_id, model_type) 
                        VALUES (%s, %s, %s, 1) 
                        RETURNING id
                        """,
                        (unique_filename, file_path, user_id)
                    )
                    image_id = cur.fetchone()[0]
                    uploaded_ids.append(image_id)
                    
                    try:
                        detections = run_inference(image_path=file_path, model=app.state.model)
                        for box in detections:
                            cur.execute(
                                """
                                INSERT INTO boxes (image_id, class_id, x, y, width, height, confidence) 
                                VALUES (%s, %s, %s, %s, %s, %s, %s)
                                """,
                                (
                                    image_id,
                                    box['class_id'],
                                    box['x'],
                                    box['y'],
                                    box['width'],
                                    box['height'],
                                    box['confidence']
                                )
                            )
                    except Exception as infer_err:
                        logger.error(f"Inference error for image {image_id}: {infer_err}")
                
                conn.commit()
                return {"uploaded_image_ids": uploaded_ids}
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return {"error": str(e)}


@app.post("/folders/ObjectDetection/")
async def upload_folder(request: Request, folder: UploadFile = File(...)):
    if not folder.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only ZIP files are allowed")
        
    user_id = await get_user_id(request)
    
    try:
        temp_zip = os.path.join(UPLOAD_DIR, f"temp_{int(time.time())}.zip")
        with open(temp_zip, "wb") as buffer:
            content = await folder.read()
            buffer.write(content)
            
        uploaded_ids = []
        with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
            with conn.cursor() as cur:
                with ZipFile(temp_zip) as zip_ref:
                    for file_info in zip_ref.filelist:
                        if file_info.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                            original_filename = os.path.basename(file_info.filename)
                            unique_filename = f"{uuid.uuid4()}_{original_filename}"
                            file_path = os.path.join(UPLOAD_DIR, unique_filename)
                            
                            with zip_ref.open(file_info) as zip_file:
                                with open(file_path, 'wb') as target:
                                    target.write(zip_file.read())
                            
                            cur.execute(
                                """
                                INSERT INTO images (filename, filepath, user_id, model_type) 
                                VALUES (%s, %s, %s, 1) 
                                RETURNING id
                                """,
                                (unique_filename, file_path, user_id)
                            )
                            image_id = cur.fetchone()[0]
                            uploaded_ids.append(image_id)
                            logger.error(f"ddd{user_id}")
                            try:
                                detections = run_inference(image_path=file_path, model=app.state.model)
                                for box in detections:
                                    cur.execute(
                                        """
                                        INSERT INTO boxes (image_id, class_id, x, y, width, height, confidence) 
                                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                                        """,
                                        (
                                            image_id,
                                            box['class_id'],
                                            box['x'],
                                            box['y'],
                                            box['width'],
                                            box['height'],
                                            box['confidence']
                                        )
                                    )
                            except Exception as infer_err:
                                logger.error(f"Inference error for image {image_id}: {infer_err}")
                
                conn.commit()
        
        os.remove(temp_zip)
        
        return {
            "message": "Folder uploaded successfully",
            "uploaded_image_ids": uploaded_ids
        }
        
    except Exception as e:
        logger.error(f"Folder upload error: {e}")
        if os.path.exists(temp_zip):
            os.remove(temp_zip)
        return {"error": str(e)}


@app.post("/images/ObjectDetection/{image_id}/bounding-boxes")
async def upload_boxes(request: Request, image_id: int, boxes: List[dict]):
    user_id = await get_user_id(request)
    try:
        with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM images WHERE id = %s AND user_id = %s AND model_type = 1", 
                          (image_id, user_id))
                if not cur.fetchone():
                    raise HTTPException(status_code=403, detail="Not authorized to modify this image")
                
                cur.execute("DELETE FROM boxes WHERE image_id = %s", (image_id,))
                
                for box in boxes:
                    cur.execute("""
                        INSERT INTO boxes (image_id, class_id, x, y, width, height, confidence)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (image_id, box["class_id"], box["x"], box["y"], 
                          box["width"], box["height"], box.get("confidence", 0.0)))
                
                conn.commit()
                return {"message": "Boxes uploaded successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Box upload error: {e}")
        return {"error": str(e)}


@app.get("/images/ObjectDetection/download-all")
async def download_all_images(request: Request):
    user_id = await get_user_id(request)
    
    try:
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT id, name FROM classes")
                    species_map = {row[0]: row[1] for row in cur.fetchall()}

                    cur.execute("""
                        SELECT i.id, i.filepath, i.filename 
                        FROM images i 
                        WHERE i.user_id = %s AND i.model_type = 1
                    """, (user_id,))
                    images = cur.fetchall()

                    for img_id, filepath, filename in images:
                        cur.execute("""
                            SELECT class_id, x, y, width, height 
                            FROM boxes 
                            WHERE image_id = %s
                        """, (img_id,))
                        boxes = cur.fetchall()

                        img = cv2.imread(filepath)
                        if img is None:
                            logger.error(f"Could not read image: {filepath}")
                            continue
                            
                        h, w = img.shape[:2]

                        for box in boxes:
                            class_id, x_center, y_center, width, height = box
                            
                            species_name = species_map.get(class_id, f'Unknown ({class_id})')
                            
                            x1 = int(x_center - width/2)
                            y1 = int(y_center - height/2)
                            x2 = int(x_center + width/2)
                            y2 = int(y_center + height/2)
                            
                            x1 = max(0, min(x1, w))
                            y1 = max(0, min(y1, h))
                            x2 = max(0, min(x2, w))
                            y2 = max(0, min(y2, h))
                            
                            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 3)
                            
                            font = cv2.FONT_HERSHEY_SIMPLEX
                            font_scale = 0.8
                            thickness = 2
                            padding = 5
                            
                            (text_width, text_height), _ = cv2.getTextSize(species_name, font, font_scale, thickness)
                            
                            cv2.rectangle(
                                img, (x1 + padding, y1 + padding), 
                                (x1 + text_width + padding * 2, y1 + text_height + padding * 2),
                                (0, 255, 0), -1
                            )
                            
                            cv2.putText(
                                img, species_name,
                                (x1 + padding, y1 + text_height + padding), 
                                font, font_scale, (255, 255, 255),
                                thickness, cv2.LINE_AA
                            )

                        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 95]
                        _, buffer = cv2.imencode('.jpg', img, encode_param)
                        zip_file.writestr(f'{filename}', buffer.tobytes())

        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer, 
            media_type='application/zip',
            headers={'Content-Disposition': 'attachment; filename=annotated-images.zip'}
        )

    except Exception as e:
        logger.error(f"Download error: {e}")
        raise HTTPException(status_code=500, detail=str(e))









#BIRD COUNT

def helper_get_heatmap(file: UploadFile = File(...)):
    image = Image.open(file.file)
    count, elapsed_time, heatmap_file, cluster_centers, image_dimensions,subgrid_counts,pred_cnt_flt,subgridcounts_error = demo.run_demo_image_nomongo(image)
    return heatmap_file


@app.post("/model_heatmap/")
async def predict(file: UploadFile = File(...)):
    heatmap_file=helper_get_heatmap(file)
    to_pil = transforms.ToPILImage()
    image = to_pil(heatmap_file)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="image/png")


def helper_get_gridmap(file: UploadFile = File(...)):
    image = Image.open(file.file)
    count, elapsed_time, heatmap_file, cluster_centers, image_dimensions,subgrid_counts,pred_cnt_flt,subgridcounts_error = demo.run_demo_image_nomongo(image)
    return subgridcounts_error

@app.post("/model_gridmap/")
async def predict(file: UploadFile = File(...)):
    gridmap=helper_get_gridmap(file)
    return gridmap

def helper_get_count(file: UploadFile = File(...)):
    image = Image.open(file.file)
    count, elapsed_time, heatmap_file, cluster_centers, image_dimensions,subgrid_counts,pred_cnt_flt,subgridcounts_error = demo.run_demo_image_nomongo(image)
    return pred_cnt_flt

@app.post("/model_count/")
async def predict(file: UploadFile = File(...)):
    count=helper_get_count(file)
    return count

def scale_coordinates(cluster_centers, original_size, target_size):
    tensor_width, tensor_height = original_size
    target_width, target_height = target_size

    scale_x = target_width / tensor_width
    scale_y = target_height / tensor_height

    # Flatten the list of lists and scale each point
    scaled_points = [
        {"x": int(point["x"] * scale_x), "y": int(point["y"] * scale_y)}
        for point in cluster_centers
    ]
    return scaled_points

def helper_get_cluster1(file: UploadFile = File(...)):
    image = Image.open(file.file)
    original_tensor_size = (480, 384)  # Tensor size (width, height)
    target_image_size = image.size  # Actual image size (width, height)
    print(image.size)

    # Replace the demo logic with the real function generating cluster centers
    count, elapsed_time, heatmap_file, cluster_centers, image_dimensions, subgrid_counts, pred_cnt_flt, subgridcounts_error = demo.run_demo_image_nomongo(image)
    print(len(cluster_centers[0]))
    # Scale the cluster centers
    scaled_cluster_centers = scale_coordinates(cluster_centers[3], original_tensor_size, target_image_size)
    print(len(scaled_cluster_centers))
    return scaled_cluster_centers

def helper_get_cluster2(file: UploadFile = File(...)):
    image = Image.open(file.file)
    count, elapsed_time, heatmap_file, cluster_centers, image_dimensions,subgrid_counts,pred_cnt_flt,subgridcounts_error = demo.run_demo_image_nomongo(image)
    return cluster_centers

@app.post("/model_cluster/")
async def predict(file: UploadFile = File(...)):
    cluster_centers=helper_get_cluster1(file)
    return cluster_centers

@app.get("/images/BirdCount/")
async def get_images_birdcount(request: Request, image_id: Optional[int] = None):
    user_id = await get_user_id(request)
    try:
        with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
            with conn.cursor() as cur:
                if image_id:
                    cur.execute(
                        "SELECT filepath FROM images WHERE id = %s AND user_id = %s AND model_type = 2",
                        (image_id, user_id)
                    )
                    result = cur.fetchone()
                    if not result:
                        raise HTTPException(status_code=404, detail="Image not found")
                    
                    file_path = result['filepath']
                    if not os.path.exists(file_path):
                        raise HTTPException(status_code=404, detail="Image file not found")
                    return FileResponse(file_path)
                
                
                cur.execute(
                    "SELECT id FROM images WHERE user_id = %s AND model_type = 2",
                    (user_id,)
                )
                return {"image_ids": [row[0] for row in cur.fetchall()]}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Database error: {e}")
        return {"error": str(e)}


@app.get("/images/BirdCount/{image_id}/annotations")
async def get_annotations(request: Request, image_id: int):
    user_id = await get_user_id(request)
    try:
        with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT a.cluster_centers FROM annotations a
                    JOIN images i ON a.image_id = i.id
                    WHERE i.id = %s AND i.user_id = %s
                """, (image_id, user_id))
                return {"annotations": cur.fetchall()}
    except Exception as e:
        logger.error(f"Database error: {e}")
        return {"error": str(e)}
    
@app.post("/images/BirdCount/")
async def upload_images_BirdCount(
    request: Request,
    file: UploadFile = File(...)
):
    user_id = await get_user_id(request)
    try:
        with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
            with conn.cursor() as cur:
                    unique_filename = f"{uuid.uuid4()}_{file.filename}"
                    file_path = os.path.join(UPLOAD_DIR, unique_filename)
                    
                    with open(file_path, "wb") as buffer:
                        content = await file.read()
                        buffer.write(content)
                    
                    cur.execute(
                        """
                        INSERT INTO images (filename, filepath, user_id, model_type) 
                        VALUES (%s, %s, %s, 2) 
                        RETURNING id
                        """,
                        (unique_filename, file_path, user_id)
                    )
                    image_id = cur.fetchone()[0]
                    
                    try:
                        cluster_centers=helper_get_cluster1(file)
                        print(cluster_centers)
                        image = Image.open(file.file)
                        target_image_size = image.size 
                        target_width, target_height = target_image_size
                        cluster_centers_json = json.dumps(cluster_centers)
                        cur.execute(
                            """
                            INSERT INTO annotations (image_id, width, height, cluster_centers) 
                            VALUES (%s, %s, %s, %s)
                            """,
                            (
                                image_id,                    
                                target_width,
                                target_height,
                                cluster_centers_json
                            )
                        )
                    except Exception as infer_err:
                        logger.error(f"Inference error for image {image_id}: {infer_err}")
                
                    conn.commit()
                    return {"uploaded_image_id": image_id,"user_id":user_id}
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return {"error": str(e)}
    

@app.post("/folders/BirdCount/")
async def upload_folder_birdcount(request: Request, folder: UploadFile = File(...)):
    if not folder.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only ZIP files are allowed")
        
    user_id = await get_user_id(request)
    
    try:
        temp_zip = os.path.join(UPLOAD_DIR, f"temp_{int(time.time())}.zip")
        with open(temp_zip, "wb") as buffer:
            content = await folder.read()
            buffer.write(content)
            
        uploaded_ids = []
        with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
            with conn.cursor() as cur:
                with ZipFile(temp_zip) as zip_ref:
                    for file_info in zip_ref.filelist:
                        if file_info.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                            original_filename = os.path.basename(file_info.filename)
                            unique_filename = f"{uuid.uuid4()}_{original_filename}"
                            file_path = os.path.join(UPLOAD_DIR, unique_filename)
                            
                            with zip_ref.open(file_info) as zip_file:
                                with open(file_path, 'wb') as target:
                                    target.write(zip_file.read())
                            
                            cur.execute(
                                """
                                INSERT INTO images (filename, filepath, user_id, model_type) 
                                VALUES (%s, %s, %s, 2) 
                                RETURNING id
                                """,
                                (unique_filename, file_path, user_id)
                            )
                            image_id = cur.fetchone()[0]
                            uploaded_ids.append(image_id)
                
                            try:
                                cluster_centers=helper_get_cluster1(file_info)
                                image = Image.open(file_info.file)
                                target_image_size = image.size 
                                target_width, target_height = target_image_size
                                cluster_centers_json = json.dumps(cluster_centers)
                                cur.execute(
                                    """
                                    INSERT INTO annotations (image_id, width, height, cluster_centers) 
                                    VALUES (%s, %s, %s, %s)
                                    """,
                                    (
                                        image_id,                    
                                        target_width,
                                        target_height,
                                        cluster_centers_json
                                    )
                                )
                            except Exception as infer_err:
                                logger.error(f"Inference error for image {image_id}: {infer_err}")
                
                conn.commit()
        
        os.remove(temp_zip)
        
        return {
            "message": "Folder uploaded successfully",
            "uploaded_image_ids": uploaded_ids
        }
        
    except Exception as e:
        logger.error(f"Folder upload error: {e}")
        if os.path.exists(temp_zip):
            os.remove(temp_zip)
        return {"error": str(e)}

    
@app.post("/images/BirdCount/{image_id}/{user_id}/annotations")
async def upload_annotations(request: Request, image_id: int, user_id:int,cluster_centers: List[dict]):
    user_id = user_id
    try:
        with psycopg2.connect(**DB_CONFIG, cursor_factory=DictCursor) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM images WHERE id = %s AND user_id = %s AND model_type = 2", 
                          (image_id, user_id))
                if not cur.fetchone():
                    raise HTTPException(status_code=403, detail="Not authorized to modify this image")
                print(image_id)
                cur.execute("SELECT width, height FROM annotations WHERE image_id = %s", (image_id,))
                target_width, target_height = cur.fetchone()
                print("gg")
                cur.execute("DELETE FROM annotations WHERE image_id = %s", (image_id,))
                cluster_centers_json = json.dumps(cluster_centers)
                cur.execute(
                    """
                    INSERT INTO annotations (image_id, width, height, cluster_centers) 
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                    image_id,                    
                    target_width,
                    target_height,
                    cluster_centers_json
                    )
                )
                
                conn.commit()
                return {"message": "Annotation uploaded successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Box upload error: {e}")
        return {"error": str(e)}
    


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="debug")