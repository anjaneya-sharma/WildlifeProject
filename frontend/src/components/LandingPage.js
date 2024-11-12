import React, { useState } from 'react';
import Header from './Header';
import UploadSection from './Upload/UploadSection';
import ObjectDetection from './object-detection/ObjectDetection';
import './styles.css';

const LandingPage = () => {
  const [showObjectDetection, setShowObjectDetection] = useState(false);
  const [uploadedImageIds, setUploadedImageIds] = useState([]);

  const handleUploadSuccess = (imageIds) => {
    setUploadedImageIds(prevIds => [...prevIds, ...imageIds]);
    setShowObjectDetection(true);
  };

  return (
    <div className="landing-page">
      <Header />
      <main className="main-content">
        <section className="hero">
          <h1>AIWildlife</h1>
          <p>AI tool for species segregation</p>
          <UploadSection onUploadSuccess={handleUploadSuccess} />
        </section>
        {showObjectDetection && <ObjectDetection uploadedImageIds={uploadedImageIds} />}
      </main>
    </div>
  );
};

export default LandingPage;