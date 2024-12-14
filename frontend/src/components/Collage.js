import React from 'react';
import './styles.css';

const Collage = ({ columnImages = [], handleImageClick }) => {
  if (!Array.isArray(columnImages)) {
    console.error('Error: "columnImages" is not an array. Received:', columnImages);
    return null;
  }

  return (
    <div className="collage">
      {columnImages.map((images, columnIndex) => {
        if (!Array.isArray(images)) {
          console.error(`Error: "images" at column index ${columnIndex} is not an array. Received:`, images);
          return null;
        }

        return (
          <div key={columnIndex} className="collage-column">
            {images.map((image, imageIndex) => {
              if (!image || typeof image !== 'object') {
                console.error(`Error: Invalid image object at column ${columnIndex}, index ${imageIndex}. Received:`, image);
                return null;
              }

              const { src, filename } = image;
              if (!src || !filename) {
                console.error(`Error: Missing src or filename for image at column ${columnIndex}, index ${imageIndex}.`);
                return null;
              }

              return (
                <img
                  key={image.id}
                  src={src}
                  alt={filename}
                  className="collage-image"
                  onClick={() => handleImageClick(image.id)}
                  draggable={false}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default Collage;