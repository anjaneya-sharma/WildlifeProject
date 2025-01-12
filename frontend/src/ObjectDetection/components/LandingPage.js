import React, { useState } from 'react';
import Header from '../../Common/Header.js';
import UploadSection from './UploadSection';
import ObjectDetection from './ObjectDetection';
// import './styles.css';
import styles from './styles.module.css'
import { logError } from '../utils/error.js';

const LandingPage = () => {
  const [isObjectDetectionVisible, setIsObjectDetectionVisible] = useState(false);
  const [uploadedImageIds, setUploadedImageIds] = useState([]);

  const handleUploadSuccess = (imageIds = []) => {
    if (!Array.isArray(imageIds)) {
      logError('handleUploadSuccess received non-array imageIds:', imageIds);
      imageIds = [];
    }
    setUploadedImageIds(prevIds => {
      const newIds = [...new Set([...prevIds, ...imageIds])];
      return newIds;
    });
    setIsObjectDetectionVisible(true);
  };

  return (
    <div className={styles["landing-page"]}>
      <Header />
      <main className={styles["main-content"]}>
        <section className={styles["hero"]}>
          <h1>AIWildlife</h1>
          <p>AI tool for species segregation</p>
          <UploadSection onUploadSuccess={handleUploadSuccess} />
        </section>
        {isObjectDetectionVisible && <ObjectDetection uploadedImageIds={uploadedImageIds} />}
      </main>
    </div>
  );
};

export default LandingPage;