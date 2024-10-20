import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Modal.css';
import BoundingBox from './BoundingBox';

const Modal = ({ selected_image, path_to_images, handle_close_modal, initial_box_data }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [boxes, setBoxes] = useState(() => {
    if (initial_box_data) {
      return [{ id: 1, ...initial_box_data }];
    }
    return [{ id: 1, x: 10, y: 10, width: 100, height: 100, category: 'XYZ' }];
  });

  const imageRef = useRef(null);
  const modalRef = useRef(null);
  const modalBackgroundRef = useRef(null);
  const nextIdRef = useRef(2);

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

  const handleBoxChange = useCallback((newBoxData, id) => {
    setBoxes(prevBoxes => 
      prevBoxes.map(box => 
        box.id === id ? { ...box, ...newBoxData } : box
      )
    );
  }, []);

  const handleAddBox = useCallback(() => {
    setBoxes(prevBoxes => [
      ...prevBoxes,
      {
        id: nextIdRef.current,
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        category: 'XYZ'
      }
    ]);
    nextIdRef.current += 1;
  }, []);

  const handleRemoveBox = useCallback((id) => {
    setBoxes(prevBoxes => {
      if (prevBoxes.length <= 1) return prevBoxes;
      return prevBoxes.filter(box => box.id !== id);
    });
  }, []);

  const handleSave = useCallback(() => {
    const data = {
      filename: selected_image,
      boxes: boxes
    };
    console.log('Saving data:', data);
  }, [boxes, selected_image]);

  const handleClickOutside = (e) => {
    if (modalBackgroundRef.current && modalBackgroundRef.current === e.target) {
      handle_close_modal();
    }
  };

  return (
    <div 
      className="modal" 
      ref={modalBackgroundRef} 
      onClick={handleClickOutside}
    >
      <div
        className="modal-content"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        ref={modalRef}
      >
        <div className="image-container">
          <img
            ref={imageRef}
            src={`${path_to_images}${selected_image}`}
            alt={selected_image}
            className="modal-image"
            onDragStart={(e) => e.preventDefault()}
          />

          {imageSize.width > 0 && imageSize.height > 0 && boxes.map((box) => (
            <BoundingBox
              key={box.id}
              id={box.id}
              imageWidth={imageSize.width}
              imageHeight={imageSize.height}
              onBoxChange={(newBoxData) => handleBoxChange(newBoxData, box.id)}
              initialBox={box}
              onRemove={() => handleRemoveBox(box.id)}
              showRemoveButton={boxes.length > 1}
            />
          ))}
        </div>
        <div className="modal-controls">
          <button className="control-button add-button" onClick={handleAddBox}>
            Add Box
          </button>
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
        <div className="modal-metadata">
          <p>Metadata for {selected_image}</p>
        </div>
        <span className="close" onClick={handle_close_modal}>&times;</span>
      </div>
    </div>
  );
};

export default Modal;