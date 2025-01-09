import React from 'react';
import './styles.css';
import { logError } from '../utils/error.js';

const validateImages = (images, columnIndex) => {
  if (!Array.isArray(images)) {
    logError(`"images" at column index ${columnIndex} is not an array. Received:`, images);
    return false;
  }
  return true;
};

const validateImage = (image, columnIndex, imageIndex) => {
  if (!image || typeof image !== 'object') {
    logError(`Invalid image object at column ${columnIndex}, index ${imageIndex}. Received:`, image);
    return false;
  }
  const { src, filename } = image;
  if (!src || !filename) {
    logError(`Missing src or filename for image at column ${columnIndex}, index ${imageIndex}.`);
    return false;
  }
  return true;
};

const Collage = ({ columnImages = [], handleImageClick }) => {
  if (!Array.isArray(columnImages)) {
    logError('"columnImages" is not an array. Received:', columnImages);
    return null;
  }

  return (
    <div className="collage">
      {columnImages.map((images, columnIndex) => {
        if (!validateImages(images, columnIndex)) return null;

        return (
          <div key={columnIndex} className="collage-column">
            {images.map((image, imageIndex) => {
              if (!validateImage(image, columnIndex, imageIndex)) return null;

              const { src, filename, id } = image;

              return (
                <img
                  key={id}
                  src={src}
                  alt={filename}
                  className="collage-image"
                  onClick={() => handleImageClick(id)}
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