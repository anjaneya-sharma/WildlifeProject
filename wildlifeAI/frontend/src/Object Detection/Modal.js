import React, { useCallback, useEffect, useRef, useState } from 'react';
import BoundingBox from './BoundingBox';
import './styles.css';

const Modal = ({ selectedImage, handleCloseModal, classList }) => { // Ensure classList is passed correctly
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [boxes, setBoxes] = useState([]);
  const imageRef = useRef(null);
  const modalRef = useRef(null);
  const modalBackgroundRef = useRef(null);
  const nextIdRef = useRef(1);
  const [isInteractingWithBoundingBox, setIsInteractingWithBoundingBox] = useState(false);

  useEffect(() => {
    if (!selectedImage) {
      console.error('Error: selectedImage is undefined');
      return;
    }

    // Fetch existing boxes when image loads
    const fetchBoxes = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/processed-images/${selectedImage}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched data:', data);

          if (data.metadata) {
            const annotations = Object.values(data.metadata).map((detection, index) => ({
              id: index,
              detection_id: index,  // Incorrect assignment
              x: detection.x - detection.width / 2,
              y: detection.y - detection.height / 2,
              width: detection.width,
              height: detection.height,
              category: detection.name,
            }));
            setBoxes(annotations);
            if (annotations.length > 0) {
              nextIdRef.current = Math.max(...annotations.map(b => b.id)) + 1;
            }
          } else {
            console.error('Error: Unexpected response structure', data);
          }
        } else {
          console.error('Error fetching boxes:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching boxes:', error);
      }
    };

    fetchBoxes();
  }, [selectedImage]);

  useEffect(() => {
    if (!selectedImage) {
      console.error('Error: selectedImage is undefined');
      return;
    }

    const updateImageSize = () => {
      if (imageRef.current) {
        const { width, height } = imageRef.current.getBoundingClientRect();
        setImageSize({ width, height });
      }
    };

    const img = new Image();
    img.src = `http://127.0.0.1:8000/raw-images/${selectedImage}`;
    img.onload = updateImageSize;

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
      console.error('handleSave Error: selectedImage is undefined');
      return;
    }
    
    console.log("Boxes before mapping:", boxes);
  
    // Convert boxes to corrections format
    const corrections = boxes.map(box => ({
      detection_id: box.id >= 0 ? box.id : null,  // Incorrect mapping
      x: box.x + box.width / 2,  // Convert to center coordinates
      y: box.y + box.height / 2, // Convert to center coordinates
      width: box.width,
      height: box.height,
      label: box.category,    // Ensure label matches backend class names
    }));
  
    console.log('Sending corrections:', corrections);
    fetch(`http://127.0.0.1:8000/annotations/${selectedImage}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(corrections)  // Send as a JSON array
    })
      .then(response => {
        if (response.status === 204) {
          console.log('Success: Annotations updated');
        } else {
          return response.json().then(result => {
            console.error('Error:', result);
          });
        }
      })
      .catch(error => {
        console.error('Error:', error);
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
              src={`http://127.0.0.1:8000/raw-images/${selectedImage}`}
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
            console.error('Error: selectedImage is undefined')
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
              classList={classList} // Pass class list to BoundingBox
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