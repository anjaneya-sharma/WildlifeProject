# Wildlife Project
A web application with a FastAPI backend and a React frontend designed for Human-in-the-Loop Visual Wildlife Monitoring Systems.

## Installation and Setup
### Clone the Repository
```bash
git clone https://github.com/Am3-y/WildlifeProject.git
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

    1. Download [best_28_072.pt](https://drive.google.com/file/d/1ayoChH5EFXFhj2B3z_pJJq3HDR7etf4n/view), rename it to `best.pt`, and place it in the following directory:

    ```bash
    backend/ObjectDetection/YOLO/runs/train/wii_28_072/weights/best.pt
    ```

    2. Download [original.pth](https://drive.google.com/file/d/1MiVNz53icmq-Miyn2ML3w0EELx1WDqHi/view) and place it in the following directory:

    ```bash
    backend/BirdCount/model_files/pth/original.pth
    ```

4. Setup .env

5. Start the backend server:
```bash
fastapi dev main.py
```
The backend server should now be running on `http://localhost:8000/docs`

### Frontend Setup
1. Open a new terminal window and navigate to the frontend directory:
```bash
cd WildlifeProject/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend application:
```bash
npm start
```
The frontend application should now be running on `http://localhost:3000`

![Welcome Page](./images/WelcomePage.png)
![Collage](./images/Collage.png)
![Bounding Box](./images/BoundingBox.png)
```