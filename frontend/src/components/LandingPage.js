import React, { useEffect, useState } from 'react';
import { fetchRawImages } from '../api/rawImageApi';
import Collage from './Collage';
import Header from './Header';
import UploadSection from './Upload/UploadSection';
import ObjectDetection from './object-detection/ObjectDetection';
import './styles.css';

const LandingPage = () => {
  const [showObjectDetection, setShowObjectDetection] = useState(false);
  const [uploadedImageIds, setUploadedImageIds] = useState([]);
  const [rawImages, setRawImages] = useState([]);

  useEffect(() => {
    const loadRawImages = async () => {
      try {
        const images = await fetchRawImages();
        setRawImages(images.map(img => img.filename));
      } catch (error) {
        console.error('Error loading raw images:', error);
      }
    };

    loadRawImages();
  }, []);

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
        <Collage column_images={rawImages} handle_image_click={(imagePath) => console.log(imagePath)} />
      </main>
    </div>
  );
};

export default LandingPage;
