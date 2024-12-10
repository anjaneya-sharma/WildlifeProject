import React, { useEffect, useState } from 'react';
import { fetchImages } from '../../api/imageApi';
import ClassFilter from '../ClassFilter';
import Collage from '../Collage';
import Modal from '../Modal';
import '../styles.css';

function ObjectDetection() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [columnImages, setColumnImages] = useState([[], [], [], [], []]);
  const [selectedClass, setSelectedClass] = useState('All');

  useEffect(() => {
    const loadImages = async () => {
      try {
        const images = await fetchImages(selectedClass);
        setImages(images);
        distributeImages(images);
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    loadImages();
  }, [selectedClass]);

  const distributeImages = (imageList) => {
    const columns = Array.from({ length: 5 }, () => ({ height: 0, images: [] }));
      
    imageList.forEach((imageData) => {
      const img = new Image();
      const imageUrl = `http://127.0.0.1:8000/raw-images/${imageData.id}`;
      img.src = imageUrl;
        
      const imageObject = {
        id: imageData.id,
        src: imageUrl,
        filename: imageData.filename || `Image ${imageData.id}`
      };
  
      img.onload = () => {
        // Find column with minimum height, prioritizing leftmost column when heights are equal
        const minHeightColumn = columns.reduce((prev, curr, currentIndex, arr) => {
          const prevIndex = columns.indexOf(prev);
          return curr.height < prev.height || (curr.height === prev.height && currentIndex < prevIndex)
            ? curr 
            : prev;
        });
  
        // Add image to column with minimum height
        minHeightColumn.images.push(imageObject);
        minHeightColumn.height += img.height;
  
        // Update state with new column distribution
        setColumnImages(columns.map(col => col.images));
      };
    });
  };

  const handleImageClick = (image) => {
    setSelectedImage(image.id);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="App">
      <main>
        <ClassFilter
          onClassSelect={setSelectedClass}
          selectedClass={selectedClass}
          setImages={setImages}
        />
        <Collage columnImages={columnImages} handleImageClick={handleImageClick} />
        {selectedImage && (
          <Modal
            selectedImage={selectedImage}
            handleCloseModal={handleCloseModal}
          />
        )}
      </main>
      {/* <Footer /> */}
    </div>
  );
}

export default ObjectDetection;
