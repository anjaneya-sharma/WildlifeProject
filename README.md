# Wildlife Project
A web application featuring a FastAPI backend and React frontend for AIWildlife tasks.

## Prerequisites

Before you begin, ensure you have the following installed:
- Python (3.7 or higher)
- Node.js (14.0 or higher)
- npm (Node Package Manager)
- Git

## Installation and Setup

### Clone the Repository
```bash
git clone https://github.com/Am3-y/WildlifeProject.git
```

### Backend Setup
1. Navigate to the backend directory:
```bash
cd WildlifeProject/backend
pip install fastapi
fastapi dev main.py
```

The backend server should now be running on `http://localhost:8000/docs`

### Frontend Setup
1. Open a new terminal window and navigate to the frontend directory:
```bash
cd WildlifeProject/frontend
npm install
npm install react-router-dom
npm start
```

The frontend application should now be running on `http://localhost:3000`

![Landing Page](./LandingPage.png)
![User Type](./UserType.png)
![Task Select](./TaskSelect.png)
![Collage](./Collage.png)
![Bounding Box](./BoundingBox.png)