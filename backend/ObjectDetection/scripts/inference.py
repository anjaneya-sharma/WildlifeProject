import torch as T
from PIL import Image
import sys
from pathlib import Path
import argparse
import logging
import shutil

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parent.parent
YOLO_DIR = BACKEND_DIR / "YOLO"

for path in [BACKEND_DIR, YOLO_DIR]:
    if str(path) not in sys.path:
        sys.path.append(str(path))

from YOLO.detect import run

WEIGHTS_PATH = YOLO_DIR / "runs/train/wii_28_072/weights/best.pt"

def load_model():
    logger.debug(f"Loading model from path: {WEIGHTS_PATH}")
    
    if not WEIGHTS_PATH.exists():
        logger.error(f"Weights file not found at {str(WEIGHTS_PATH)}")
        raise FileNotFoundError(f"Weights file not found at {str(WEIGHTS_PATH)}")

    try:    
        from ultralytics import YOLO
        model = YOLO(str(WEIGHTS_PATH))
        
        device = 'cuda' if T.cuda.is_available() else 'cpu'
        logger.info(f"Using device: {device}")
        
        model = model.to(device)
        model.eval()
        
        logger.info("Model loaded successfully")
        return model

    except Exception as err:
        logger.error(f"Error loading model: {str(err)}")
        logger.exception(err)
        raise RuntimeError(f"Failed to load YOLOv5 model: {str(err)}")

def parse_detection_line(line, img_width, img_height):
    class_id, x_center, y_center, width, height, conf = map(float, line.strip().split())
    
    return {
        "x": x_center * img_width,
        "y": y_center * img_height,
        "width": width * img_width,
        "height": height * img_height,
        "confidence": conf,
        "class_id": int(class_id)
    }

def run_inference(image_path, model):
    logger.debug(f"Starting inference on image: {image_path}")
    
    with Image.open(image_path) as img:
        img_width, img_height = img.size
        logger.debug(f"Original image dimensions: {img_width}x{img_height}")

    try:
        results = run(
            weights=str(WEIGHTS_PATH),
            source=image_path,
            save_txt=True,
            save_conf=True,
            exist_ok=True,
            nosave=True
        )
        
        detections = []
        image_name = Path(image_path).stem
        labels_path = YOLO_DIR / "runs/detect/exp/labels" / f"{image_name}.txt"
        
        if labels_path.exists():
            with open(labels_path, 'r') as f:
                for line in f:
                    detection = parse_detection_line(line, img_width, img_height)
                    detections.append(detection)
                    logger.debug(f"Detection (scaled): {detection}")
        
        logger.info(f"Processed {len(detections)} detections")
        return detections
            
    except Exception as err:
        logger.error(f"Inference failed: {str(err)}")
        logger.exception(err)
        raise RuntimeError(f"Inference failed: {str(err)}")

def setup_directories(storage_path):
    paths = {
        'raw': storage_path / "raw_images",
        'processed': storage_path / "processed_images",
        'annotations': storage_path / "annotations"
    }
    
    for path in [storage_path, *paths.values()]:
        path.mkdir(parents=True, exist_ok=True)
        
    return paths

def main():
    parser = argparse.ArgumentParser(description="Run YOLOv5 inference on an image")
    parser.add_argument('--image', type=str, required=True, help='Path to input image')
    parser.add_argument('--save', action='store_true', help='Save the output image with predictions')
    parser.add_argument('--show', action='store_true', help='Display the output image with predictions')
    args = parser.parse_args()

    paths = setup_directories(Path("images"))
    raw_image_path = paths['raw'] / Path(args.image).name
    shutil.copy2(args.image, raw_image_path)

    run(
        weights=str(WEIGHTS_PATH),
        source=args.image,
        project=paths['processed'],
        name='',
        save_txt=True,
        save_conf=True,
        exist_ok=True,
        nosave=not args.save,
        view_img=args.show,
    )

if __name__ == "__main__":
    main()