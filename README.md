# Wildlife Project
A web application with a FastAPI backend and a React frontend designed for Human-in-the-Loop Visual Wildlife Monitoring Systems.

## Installation Options
Choose **one** of the following installation methods:
1. Local 
2. Docker

## Local
### Clone the Repository
```bash
git clone https://github.com/anjaneya-sharma/WildlifeProject.git
```

### Backend Setup
1. Navigate to the backend directory:
```bash
cd WildlifeProject/backend
```

2. Install required dependencies:  
```bash 
pip install -r requirements.txt
```

3. Download Required Model Files
   * Download [best_28_072.pt](https://drive.google.com/file/d/1ayoChH5EFXFhj2B3z_pJJq3HDR7etf4n/view)
   * Rename to `best.pt` 
   * Place in: `backend/ObjectDetection/YOLO/runs/train/wii_28_072/weights/best.pt`
   * Download [original.pth](https://drive.google.com/file/d/1MiVNz53icmq-Miyn2ML3w0EELx1WDqHi/view)
   * Place in: `backend/BirdCount/model_files/pth/original.pth`

4. Setup Environment:
```bash
cp .env.example .env
```

5. Start Backend Server:
```bash
uvicorn main:app --reload
```

### Frontend Setup
1. Navigate to frontend directory:
```bash
cd WildlifeProject/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start frontend:
```bash
npm start
```

## Docker
### Docker Images 
* Backend: [awe35/backend](https://hub.docker.com/r/awe35/backend)
* Frontend: [awe35/frontend](https://hub.docker.com/r/awe35/frontend)

### Quick Start
1. Pull images:
```bash
docker pull awe35/backend:latest
docker pull awe35/frontend:latest
```

2. Run with docker compose:
```bash
docker-compose up -d
```

3. Access the Application:
* Frontend: http://localhost:3000
* Backend API: http://localhost:8000/docs

## Screenshots

### Welcome Page
![Welcome Page](./images/WelcomePage.png)

### Image Collage
![Collage](./images/Collage.png)

### Bounding Box Detection
![Bounding Box](./images/BoundingBox.png)