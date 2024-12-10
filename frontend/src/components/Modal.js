import React, { useCallback, useEffect, useRef, useState } from 'react';
import BoundingBox from './BoundingBox';
import './styles.css';

const Modal = ({ selected_image, handleCloseModal }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [boxes, setBoxes] = useState([]);
  const imageRef = useRef(null);
  const modalRef = useRef(null);
  const modalBackgroundRef = useRef(null);
  const nextIdRef = useRef(1);
  const [isInteractingWithBoundingBox, setIsInteractingWithBoundingBox] = useState(false);

  useEffect(() => {
    if (!selected_image) {
      console.error('Error: selected_image is undefined');
      return;
    }

    // Fetch existing boxes when image loads
    const fetchBoxes = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/processed-images/${selected_image}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched data:', data);

          if (data.metadata) {
            const annotations = Object.values(data.metadata).map((detection, index) => ({
              id: index,
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
  }, [selected_image]);

  useEffect(() => {
    if (!selected_image) {
      console.error('Error: selected_image is undefined');
      return;
    }

    const updateImageSize = () => {
      if (imageRef.current) {
        const { width, height } = imageRef.current.getBoundingClientRect();
        setImageSize({ width, height });
      }
    };

    const img = new Image();
    img.src = `http://127.0.0.1:8000/raw-images/${selected_image}`;
    img.onload = updateImageSize;

    window.addEventListener('resize', updateImageSize);
    return () => window.removeEventListener('resize', updateImageSize);
  }, [selected_image]);

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

    if (!selected_image) {
      console.error('handleSave Error: selected_image is undefined');
      return;
    }
    
    console.log("Boxes before mapping:", boxes);

    const data = boxes.map(box => ({
      detection_id: box.id,
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      width: box.width,
      height: box.height,
      label: box.category
    }));

    console.log('Saved data:', data);
    fetch(`http://127.0.0.1:8000/annotations/${selected_image}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
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
  }, [boxes, selected_image]);

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
          {selected_image ? (
            <img
              ref={imageRef}
              src={`http://127.0.0.1:8000/raw-images/${selected_image}`}
              alt={`ID: ${selected_image}`}
              className="modal-image"
              onDragStart={(e) => e.preventDefault()}
            />
          ) : (
            console.error('Error: selected_image is undefined')
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
            />
          ))}
        </div>
        <div className="modal-controls">
          <button className="control-button add-button" onClick={handleAddBox}>
            Add Box
          </button>
          <button className="save-button" onClick={() => {
            console.log("Save button clicked");
            handleSave();
          }}>Save</button>
        </div>
        <div className="modal-metadata">
          <p>Metadata for {selected_image}</p>
        </div>
      </div>
    </div>
  );
};

export default Modal;
