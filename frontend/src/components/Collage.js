// Collage.js
import React from 'react';
import './styles.css';


const Collage = ({ column_images, handle_image_click }) => {
  return (
    <div className="collage">
      {column_images.map((images, index) => (
        <div key={index} className="collage-column">
          {images.map((image, idx) => (
            <img
              key={idx}
              src={`http://127.0.0.1:8000/image/${image}`}
              alt={image}
              className="collage-image"
              onClick={() => handle_image_click(image) }
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Collage;