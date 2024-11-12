import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles.css';
import BoundingBox from './BoundingBox';

const Modal = ({ selected_image, path_to_images, handle_close_modal }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [boxes, setBoxes] = useState([]);
  const imageRef = useRef(null);
  const modalRef = useRef(null);
  const modalBackgroundRef = useRef(null);
  const nextIdRef = useRef(1);
  const [isInteractingWithBoundingBox, setIsInteractingWithBoundingBox] = useState(false);

  useEffect(() => {
    // Fetch existing boxes when image loads
    const fetchBoxes = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/get_boxes/${selected_image}`);
        if (response.ok) {
          const data = await response.json();
          setBoxes(data.boxes || []);
          // Update nextIdRef based on existing boxes
          if (data.boxes && data.boxes.length > 0) {
            nextIdRef.current = Math.max(...data.boxes.map(b => b.id)) + 1;
          }
        }
      } catch (error) {
        console.error('Error fetching boxes:', error);
      }
    };

    fetchBoxes();
  }, [selected_image]);

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
      boxes: boxes.map(box => ({
        id: box.id,
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        category: box.category
      }))
    };

    fetch('http://127.0.0.1:8000/save_boxes/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(result => {
        console.log('Success:', result);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }, [boxes, selected_image]);

  const handleClickOutside = (e) => {
    if (modalBackgroundRef.current && modalBackgroundRef.current === e.target && !isInteractingWithBoundingBox) {
      // console.log("isInteractingWithBoundingBox:", isInteractingWithBoundingBox);
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
        <div className="modal-image-container">
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
              setIsInteractingWithBoundingBox={setIsInteractingWithBoundingBox}
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
        {/* <span className="close" onClick={handle_close_modal}>&times;</span> */}
      </div>
    </div>
  );
};

export default Modal;