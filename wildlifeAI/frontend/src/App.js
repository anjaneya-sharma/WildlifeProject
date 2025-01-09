import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './Object Detection/LandingPage';
import Home from './Bird Count/Home'
import Upload from './Bird Count/Upload'
import Annotate from './Bird Count/Annotate';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<  Home />} />
        <Route path="/landingpage" element={<LandingPage />} />
        <Route path="/upload" element={<  Upload />} />
         <Route path="/annotate" element={<  Annotate />} />
      </Routes>
    </Router>
  );
}

export default App;