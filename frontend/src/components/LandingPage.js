import React, { useEffect, useState } from 'react';
import { fetchRawImages } from '../api/imageApi.js';
import Header from './Header';
import UploadSection from './UploadSection';
import ObjectDetection from './ObjectDetection';
import './styles.css';
import Footer from './Footer';
import { logError } from '../utils/error.js';

const LandingPage = () => {
  const [isObjectDetectionVisible, setIsObjectDetectionVisible] = useState(false);
  const [uploadedImageIds, setUploadedImageIds] = useState([]);
  const [rawImageFilenames, setRawImageFilenames] = useState([]);

  const loadRawImages = async () => {
    try {
      const images = await fetchRawImages();
      setRawImageFilenames(images.map(img => img.filename));
    } catch (error) {
      logError('Error loading raw images:', error);
    }
  };

  useEffect(() => {
    loadRawImages();
  }, []);

  const handleUploadSuccess = (imageIds) => {
    setUploadedImageIds(prevIds => [...prevIds, ...imageIds]);
    setIsObjectDetectionVisible(true);
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
        {isObjectDetectionVisible && <ObjectDetection uploadedImageIds={uploadedImageIds} />}
      </main>
      {/* <Footer /> */}
    </div>
  );
};

export default LandingPage;