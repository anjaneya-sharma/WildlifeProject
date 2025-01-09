import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './Annotate.css';
import Header from '../Common/Header';

function Annotate() {
  const { state } = useLocation();
  const { file } = state || {};
  const [clusterMap, setClusterMap] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const imageRef = useRef(null);

  // Load the image and set its URL
  useEffect(() => {
    if (file) {
      setImageUrl(URL.createObjectURL(file));
    }
  }, [file]);

  // Fetch initial points from the API
  useEffect(() => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      fetch('http://127.0.0.1:8000/model_cluster/', {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Assuming the API returns an array of { x, y } points
          setClusterMap(data || []);
        })
        .catch((error) => console.error('Error fetching cluster map:', error));
    }
  }, [file]);

  // Handle click on the image to add a new dot
  const handleImageClick = (event) => {
    const rect = imageRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    setClusterMap((prevMap) => [...prevMap, { x: clickX, y: clickY }]);
  };

  // Handle click on a dot to remove it
  const handleDotClick = (index) => {
    setClusterMap((prevMap) => prevMap.filter((_, i) => i !== index));
  };

  // Handle Save button click
  const handleSave = () => {
    
    alert('Changes saved');
  };

  return (
    <div>
      <Header/>
    <div className="annotation-container">
      <h2>Annotation Page</h2>
      {imageUrl && (
        <div className="image-2-container">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Annotate"
            className="large-image"
            onClick={handleImageClick}
          />
          <svg className="overlay" width="100%" height="100%">
            {clusterMap.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="5"
                fill="blue"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the image click handler
                  handleDotClick(index);
                }}
              />
            ))}
          </svg>
        </div>
      )}
      <div>
        <button className="save-button" onClick={handleSave}>
        Save
      </button>
      </div>
    </div>
    </div>
  );
}

export default Annotate;
