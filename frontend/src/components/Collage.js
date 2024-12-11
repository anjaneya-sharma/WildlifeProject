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
                console.error(`Warning: Missing "src" or "filename" for image at column ${columnIndex}, index ${imageIndex}. Image object:`, image);
              }

              return (
                <img
                  key={`${columnIndex}-${imageIndex}`}
                  src={src}
                  alt={filename || 'Image'}
                  className="collage-image"
                  onClick={() => {
                    console.log(`Image clicked:`, image);
                    if (handleImageClick) {
                      handleImageClick(image);
                    } else {
                      console.warn('handleImageClick is not defined.');
                    }
                  }}
                  onError={(e) => {
                    console.error(`Error loading image at column ${columnIndex}, index ${imageIndex}:`, image, e);
                  }}
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
