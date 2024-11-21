import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import UserType from './components/UserType';
import ObjectDetection from './components/ObjectDetection';
import TaskSelectionPage from './components/TaskSelectionPage';
import Options from './components/Options'
import ThreeButtons from './components/ThreeButtonsPage'
import Collage from './components/Collage'
import ReIdentification from './components/ReIdentification'

function App() {
  return (
    <Router>  {/* only have one Router here */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/user-type" element={<UserType />} />
        <Route path="/task-selection" element={<TaskSelectionPage />} />
        <Route path="/object-detection" element={<ObjectDetection />} />
        <Route path="/options" element={<Options/>} /> 
        <Route path="/ThreeButtons" element={<ThreeButtons/>} /> 
        <Route path="/Collage" element={<Collage/>} />
        <Route path="/re-identification" element={<ReIdentification/>} />
        
        {/* for viewing existing images */}

      </Routes>
    </Router>
  );
}

export default App;
