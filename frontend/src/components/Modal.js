// Modal.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Modal.css';
import BoundingBox from './BoundingBox';

const Modal = ({ selected_image, path_to_images, handle_close_modal, initial_box_data }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [boxData, setBoxData] = useState(initial_box_data || null);
  const imageRef = useRef(null);

  useEffect(() => {
    const updateImageSize = () => {
      if (imageRef.current) {
        const { width, height } = imageRef.current.getBoundingClientRect();
        setImageSize({ width, height });
      }
    };

    const img = new Image();
    img.src = `${path_to_images}${selected_image}`;
    img.onload = updateImageSize;

    window.addEventListener('resize', updateImageSize);
    return () => window.removeEventListener('resize', updateImageSize);
  }, [selected_image, path_to_images]);

  const handleBoxChange = useCallback((newBoxData) => {
    setBoxData(newBoxData);
  }, []);

  const handleSave = useCallback(() => {
    if (boxData) {
      const data = {
        filename: selected_image,
        bbox: boxData
      };
      console.log('Saving data:', data);
      // send this to backend
    }
  }, [boxData, selected_image]);

  return (
    <div className="modal" onClick={handle_close_modal}>
      <div
        className="modal-content"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div className="image-container">
          <img
            ref={imageRef}
            src={`${path_to_images}${selected_image}`}
            alt={selected_image}
            className="modal-image"
            onDragStart={(e) => e.preventDefault()}
          />
          {imageSize.width > 0 && imageSize.height > 0 && (
            <BoundingBox
              key={`${imageSize.width}-${imageSize.height}`}
              imageWidth={imageSize.width}
              imageHeight={imageSize.height}
              onBoxChange={handleBoxChange}
              initialBox={boxData}
            />
          )}
        </div>
        <button className="save-button" onClick={handleSave}>Save</button>
        <div className="modal-metadata">
          <p>Metadata for {selected_image}</p>
        </div>
        <span className="close" onClick={handle_close_modal}>&times;</span>
      </div>
    </div>
  );
};

export default Modal;