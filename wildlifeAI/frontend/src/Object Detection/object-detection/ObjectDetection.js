import React, { useEffect, useRef, useState } from 'react';
import ClassFilter from '../ClassFilter';
import Collage from '../Collage';
import Modal from '../Modal';
import Footer from '../../Common/Footer';
import '../styles.css';
import { fetchImages } from '../api/imageApi';

function ObjectDetection() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [columnImages, setColumnImages] = useState([[], [], [], [], []]);
  const [selectedClass, setSelectedClass] = useState('All');
  const [classList, setClassList] = useState([]); // New state for class list

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

  return (
    <div className="App">
      <main>
        <ClassFilter 
          onClassSelect={setSelectedClass} 
          selectedClass={selectedClass}
          setImages={setImages}
          setClassList={setClassList} // Pass setClassList to ClassFilter
        />
        <Collage columnImages={columnImages} handleImageClick={setSelectedImage} />
        {selectedImage && (
          <Modal
            selectedImage={selectedImage}
            handleCloseModal={() => setSelectedImage(null)}
            classList={classList} // Pass classList to Modal
          />
        )}
      </main>
      {/* <Footer /> */}
    </div>
  );
}

export default ObjectDetection;