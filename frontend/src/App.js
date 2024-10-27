import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import UserType from './components/UserType';
import ObjectDetection from './components/ObjectDetection';
import TaskSelectionPage from './components/TaskSelectionPage';

function App() {
  return (
    <Router>  {/* only have one Router here */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/user-type" element={<UserType />} />
        <Route path="/task-selection" element={<TaskSelectionPage />} />
        <Route path="/object-detection" element={<ObjectDetection />} />
      </Routes>
    </Router>
  );
}

export default App;
