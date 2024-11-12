import React, { useState, useEffect } from 'react';
import ClassFilter from '../ClassFilter';
import Collage from '../Collage';
import Modal from '../Modal';
import { fetchImages } from '../../api/imageApi';

const ObjectDetection = ({ uploadedImageIds = [] }) => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedClass, setSelectedClass] = useState('All');
  const [columnImages, setColumnImages] = useState([[], [], [], [], []]);

  useEffect(() => {
    loadImages(selectedClass);
  }, [selectedClass, uploadedImageIds]);

  const loadImages = async (className) => {
    try {
      const loadedImages = await fetchImages(className);

      const uniqueImages = [...new Set(loadedImages)];

      setImages(uniqueImages);
      distributeImages(uniqueImages);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const distributeImages = (imageList) => {
    if (!imageList.length) return;

    const columns = Array.from({ length: 5 }, () => ({ height: 0, images: [] }));

    imageList.forEach(imagePath => {
      const img = new Image();
      img.src = `http://127.0.0.1:8000/image/${encodeURIComponent(imagePath)}`;

      img.onload = () => {
        const minHeightColumn = columns.reduce((prev, curr) =>
          prev.height < curr.height ? prev : curr
        );
        minHeightColumn.images.push(imagePath);
        minHeightColumn.height += img.height;
        setColumnImages(columns.map(col => col.images));
      };

      img.onerror = (error) => {
        console.error('Error loading image:', imagePath, error);
      };
    });
  };

  return (
    <section className="image-section">
      <ClassFilter
        onClassSelect={setSelectedClass}
        selectedClass={selectedClass}
      />
      <Collage
        column_images={columnImages}
        handle_image_click={setSelectedImage}
      />
      {selectedImage && (
        <Modal
          selected_image={selectedImage}
          path_to_images="http://127.0.0.1:8000/image/"
          handle_close_modal={() => setSelectedImage(null)}
        />
      )}
    </section>
  );
};

export default ObjectDetection;