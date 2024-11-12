import React from 'react';
import './styles.css';

const Collage = ({ column_images, handle_image_click }) => {
  return (
    <div className="collage">
      {column_images.map((images, columnIndex) => (
        <div key={columnIndex} className="collage-column">
          {images.map((imagePath, imageIndex) => (
            <img
              key={`${columnIndex}-${imageIndex}`}
              src={`http://127.0.0.1:8000/image/${encodeURIComponent(imagePath)}`}
              alt={imagePath}
              className="collage-image"
              onClick={() => handle_image_click(imagePath)}
              onError={(e) => {
                console.error('Error loading image:', imagePath);
                e.target.src = 'fallback-image-url.jpg'; // Add a fallback image
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Collage;