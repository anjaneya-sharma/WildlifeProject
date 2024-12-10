import React from 'react';
import './styles.css';

const Collage = ({ columnImages=[], handleImageClick }) => {
  if (!Array.isArray(columnImages)) {
    console.error('columnImages not an array');
    return null;
  }

  return (
    <div className="collage">
      {columnImages.map((images, columnIndex) => (
        <div key={columnIndex} className="collage-column">
          {Array.isArray(images) && images.map((image, imageIndex) => (
            <img
              key={`${columnIndex}-${imageIndex}`}
              src={image.src}
              alt={image.filename}
              className="collage-image"
              onClick={() => handleImageClick(image)}
              onError={(e) => {
                console.error('Error loading image:', image.filename);
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Collage;
