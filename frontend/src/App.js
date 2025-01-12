import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './ObjectDetection/components/LandingPage';
import HomePage from './HomePage'
import Upload from './BirdCount/Upload'
import Annotate from './BirdCount/Annotate';
import Gallery from './BirdCount/Gallery';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/landingpage" element={<LandingPage />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/annotate" element={<Annotate />} />
      </Routes>
    </Router>
  );
}

export default App;