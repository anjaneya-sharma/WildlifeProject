import React, { useCallback, useEffect, useRef, useState } from 'react';
import BoundingBox from './BoundingBox';
import './styles.css';
import { fetchProcessedImages, postAnnotations, getRawImageUrl } from '../api/imageApi.js';
import { logError } from '../utils/error.js';

const Modal = ({ selectedImage, handleCloseModal, classList }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [boxes, setBoxes] = useState([]);
  const imageRef = useRef(null);
  const modalRef = useRef(null);
  const modalBackgroundRef = useRef(null);
  const nextIdRef = useRef(1);
  const [isInteractingWithBoundingBox, setIsInteractingWithBoundingBox] = useState(false);

  useEffect(() => {
    if (!selectedImage) {
      logError('Error: selectedImage is undefined');
      return;
    }

    const fetchBoxes = async () => {
      try {
        const data = await fetchProcessedImages(selectedImage);
        console.log('Fetched data:', data);

        if (data.metadata) {
          const annotations = Object.values(data.metadata).map((detection, index) => ({
            id: index,
            detection_id: detection.id || index,
            x: detection.x,
            y: detection.y,
            width: detection.width,
            height: detection.height,
            category: detection.name,
          }));
          setBoxes(annotations);
          if (annotations.length > 0) {
            nextIdRef.current = Math.max(...annotations.map(b => b.id)) + 1;
          }
        } else {
          logError('Error: Unexpected response structure', data);
        }
      } catch (error) {
        logError('Error fetching boxes:', error);
      }
    };

    fetchBoxes();
  }, [selectedImage]);

  useEffect(() => {
    if (!selectedImage) {
      logError('Error: selectedImage is undefined');
      return;
    }

    const updateImageSize = () => {
      if (imageRef.current) {
        const { width, height } = imageRef.current.getBoundingClientRect();
        setImageSize({ width, height });
      }
    };

    const loadingImage = new Image();
    loadingImage.src = getRawImageUrl(selectedImage);
    loadingImage.onload = updateImageSize;

    window.addEventListener('resize', updateImageSize);
    return () => window.removeEventListener('resize', updateImageSize);
  }, [selectedImage]);

  const handleBoxChange = useCallback((newBoxData, id) => {
    setBoxes(prevBoxes =>
      prevBoxes.map(box =>
        box.id === id ? { ...box, ...newBoxData } : box
      )
    );
  }, []);

  const handleAddBox = useCallback(() => {
    console.log("handleAddBox function called");
    setBoxes(prevBoxes => [
      ...prevBoxes,
      { 
        id: nextIdRef.current,
        detection_id: null,
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
    console.log("handleSave function called");

    if (!selectedImage) {
      logError('handleSave Error: selectedImage is undefined');
      return;
    }

    console.log("Boxes before mapping:", boxes);

    const corrections = boxes.map(box => ({
      detection_id: box.detection_id !== null ? box.detection_id : null,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      label: box.category,
    }));

    console.log('Sending corrections:', corrections);
    
    postAnnotations(selectedImage, corrections)
      .then(response => {
        if (response.status === 204) {
          console.log('Success: Annotations updated');
        } else {
          logError('Error:', response.data);
        }
      })
      .catch(error => {
        logError('Error:', error);
      });
  }, [boxes, selectedImage]);

  const handleClickOutside = (e) => {
    if (modalBackgroundRef.current && modalBackgroundRef.current === e.target && !isInteractingWithBoundingBox) {
      handleCloseModal();
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
          {selectedImage ? (
            <img
              ref={imageRef}
              src={getRawImageUrl(selectedImage)}
              alt={`ID: ${selectedImage}`}
              onLoad={() => {
                if (imageRef.current) {
                  const { width, height } = imageRef.current.getBoundingClientRect();
                  setImageSize({ width, height });
                }
              }}
              className="modal-image"
              onDragStart={(e) => e.preventDefault()}
            />
          ) : (
            logError('Error: selectedImage is undefined')
          )}

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
              classList={classList}
            />
          ))}
        </div>
        <div className="modal-controls">
          <button className="control-button add-button" onClick={handleAddBox}>
            Add Box
          </button>
          <button className="save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;