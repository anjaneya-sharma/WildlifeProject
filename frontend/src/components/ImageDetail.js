import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './styles.css'; // Adjust based on your folder structure

function ImageDetail() {
  // Retrieve the image name from the URL
  const { image } = useParams();
  const [collageImages, setCollageImages] = useState([]);

  // Sample data for newImageList
  const newImageList = [
    'money1.png','money2.png','money3.jpg','money5.jpeg',
    'money4.jpeg'
  ];

  const money2NewImageList = [
    'money1.png',
    'wildlife_1.jpg', 'wildlife_2.jpg', 'wildlife_3.jpg', 
    'wildlife_4.jpg', 'wildlife_5.jpg', 'wildlife_6.jpg',
    'wildlife_7.jpg', 'wildlife_8.jpg', 'wildlife_9.jpg',
  ];

  useEffect(() => {
    // Dynamically set the collage images based on the main image
    if (image === 'money1.png' || image == 'money2.png') {
      setCollageImages(newImageList);
    } 
    else if(image == 'money2.png'){
        setCollageImages(money2NewImageList);
    }
    else {
      setCollageImages([]);
    }
  }, [image]);

  return (
    <div className="image-detail-container">
      {/* Main Image */}
      <div className="image-detail-main">
        <img src={`/assets/wildlife_images/${image}`} alt={image} className="image" />
      </div>
     
      {/* Collage Below */}
      <h2> Images similar to the above image</h2>
      <div className="image-container2">
        <div className="image-column">
          {collageImages.slice(0, Math.ceil(collageImages.length / 3)).map((collageImage, index) => (
            <div key={index} className="image-item">
              <img
                src={`/assets/wildlife_images/${collageImage}`}
                alt={collageImage}
                className="image"
              />
            </div>
          ))}
        </div>

        <div className="image-column">
          {collageImages.slice(Math.ceil(collageImages.length / 3), Math.ceil((2 * collageImages.length) / 3)).map((collageImage, index) => (
            <div key={index} className="image-item">
              <img
                src={`/assets/wildlife_images/${collageImage}`}
                alt={collageImage}
                className="image"
              />
            </div>
          ))}
        </div>

        <div className="image-column">
          {collageImages.slice(Math.ceil((2 * collageImages.length) / 3)).map((collageImage, index) => (
            <div key={index} className="image-item">
              <img
                src={`/assets/wildlife_images/${collageImage}`}
                alt={collageImage}
                className="image"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageDetail;
