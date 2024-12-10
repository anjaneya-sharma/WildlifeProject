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
    imageList.forEach(image => {
      const img = new Image();
      img.src = image.src;
      img.onload = () => {
        const minHeightColumn = columns.reduce((prev, curr) => prev.height < curr.height ? prev : curr);
        minHeightColumn.images.push(image);
        minHeightColumn.height += img.height;
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
            selected_image={selectedImage}
            handleCloseModal={handleCloseModal}
          />
        )}
      </main>
      {/* <Footer /> */}
    </div>
  );
}

export default ObjectDetection;