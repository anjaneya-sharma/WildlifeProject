import React, { useEffect, useState, useCallback } from 'react';
import ClassFilter from './ClassFilter';
import Collage from './Collage';
import Modal from './Modal';
// import './styles.css';
import styles from './styles.module.css'
import { getImages, getImageUrl } from '../api/imageApi';
import { logError } from '../utils/error.js';

function ObjectDetection({ uploadedImageIds }) {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [columnImages, setColumnImages] = useState([[], [], [], [], []]);
  const [selectedClass, setSelectedClass] = useState('All');
  const [classList, setClassList] = useState([]);

  const loadImages = useCallback(async () => {
    try {
      const fetchedImages = await getImages(selectedClass);
      const uniqueImages = fetchedImages.filter((img, index, self) =>
        index === self.findIndex(t => t.id === img.id)
      );
      
      const uploadedSet = new Set(uploadedImageIds);
      const sortedImages = [...uniqueImages].sort((a, b) => {
        const aUploaded = uploadedSet.has(a.id);
        const bUploaded = uploadedSet.has(b.id);
        
        if (aUploaded && bUploaded) {
          return uploadedImageIds.indexOf(b.id) - uploadedImageIds.indexOf(a.id);
        }
        if (aUploaded) return -1;
        if (bUploaded) return 1;
        return 0;
      });

      setImages(sortedImages);
      distributeImages(sortedImages);
    } catch (error) {
      logError('Error fetching images:', error);
    }
  }, [selectedClass, uploadedImageIds]);

  useEffect(() => {
    loadImages();
  }, [uploadedImageIds, loadImages]);

  const distributeImages = useCallback((imageList) => {
    const columns = Array.from({ length: 5 }, () => []);
    
    imageList.forEach((imageData, index) => {
      const columnIndex = index % 5;
      const imageObject = {
        id: imageData.id,
        src: getImageUrl(imageData.id),
        filename: imageData.filename || `Image ${imageData.id}`
      };
      columns[columnIndex].push(imageObject);
    });
    
    setColumnImages(columns);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (!uploadedImageIds?.length) {
      alert('No uploaded images to download');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = `${process.env.REACT_APP_API_BASE_URL}/images/ObjectDetection/download-all/`;
      link.download = 'annotated-images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      logError('Error downloading images:', error);
      alert('Failed to download images');
    }
  }, [uploadedImageIds]);

  return (
    <div className={styles["App"]}>
      <main>
        <div className={styles["controls-container"]}>
          <ClassFilter 
            onClassSelect={setSelectedClass} 
            selectedClass={selectedClass}
            setImages={setImages}
            setClassList={setClassList}
          />
          {uploadedImageIds?.length > 0 && (
            <button 
              className={styles["download-button"]}
              onClick={handleDownloadAll}
            >
              Download All Images
            </button>
          )}
        </div>
        {images.length === 0 ? (
          <img
            src="/assets/fallback.png"
            alt="No images available"
            className={styles["fallback-image"]}
          />
        ) : (
          <Collage columnImages={columnImages} handleImageClick={setSelectedImage} />
        )}
        {selectedImage && (
          <Modal
            selectedImage={selectedImage}
            handleCloseModal={() => setSelectedImage(null)}
            classList={classList}
          />
        )}
      </main>
    </div>
  );
}

export default ObjectDetection;