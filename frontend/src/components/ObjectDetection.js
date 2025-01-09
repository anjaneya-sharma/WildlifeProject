import React, { useEffect, useState } from 'react';
import ClassFilter from './ClassFilter';
import Collage from './Collage';
import Modal from './Modal';
import './styles.css';
import { fetchImages, getRawImageUrl } from '../api/imageApi';
import { logError } from '../utils/error.js';

function ObjectDetection() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [columnImages, setColumnImages] = useState([[], [], [], [], []]);
  const [selectedClass, setSelectedClass] = useState('All');
  const [classList, setClassList] = useState([]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const fetchedImages = await fetchImages(selectedClass);
        setImages(fetchedImages);
        distributeImages(fetchedImages);
      } catch (error) {
        logError('Error fetching images:', error);
      }
    };

    loadImages();
  }, [selectedClass]);

  const distributeImages = (imageList) => {
    const columns = Array.from({ length: 5 }, () => ({ height: 0, images: [] }));
      
    imageList.forEach((imageData) => {
      const img = new Image();
      const imageUrl = getRawImageUrl(imageData.id);
      img.src = imageUrl;
        
      const imageObject = {
        id: imageData.id,
        src: imageUrl,
        filename: imageData.filename || `Image ${imageData.id}`
      };
  
      img.onload = () => {
        const minHeightColumn = columns.reduce((prev, curr, currentIndex) => {
          return curr.height < prev.height || (curr.height === prev.height && currentIndex < columns.indexOf(prev))
            ? curr 
            : prev;
        }, columns[0]);

        minHeightColumn.images.push(imageObject);
        minHeightColumn.height += img.height;

        setColumnImages(columns.map(col => col.images));
      };

      img.onerror = (error) => {
        logError(`Error loading image with ID ${imageData.id}:`, error);
      };
    });
  };

  return (
    <div className="App">
      <main>
        <ClassFilter 
          onClassSelect={setSelectedClass} 
          selectedClass={selectedClass}
          setImages={setImages}
          setClassList={setClassList}
        />
        <Collage columnImages={columnImages} handleImageClick={setSelectedImage} />
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