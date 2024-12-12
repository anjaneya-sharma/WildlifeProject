import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import './styles.css'; // Adjust based on your folder structure

function ImageDetail() {
  const { image } = useParams();
  const [collageImages, setCollageImages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [clickedImage, setClickedImage] = useState(null);

  // Sample data for newImageList
  // const newImageList = [
  //   'money1.png',
  //   'money2.png',
  //   'money3.jpg',
  //   'wildlife_1.jpg', 'wildlife_2.jpg', 'wildlife_3.jpg',
  // ];
  const newImageList = [
    'Tiger2.jpg',
    'Tiger3.jpg',
    'Tiger4.jpg',
    'Tiger5.jpg',
    'Tiger6.jpg'
  ];

  useEffect(() => {
    if (image === 'Tiger1.jpg') {
      setCollageImages(newImageList);
    } else {
      setCollageImages([]);
    }
  }, [image]);

  const openModal = (clickedImage) => {
    setClickedImage(clickedImage);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setClickedImage(null);
  };

  return (
    <div>
    {/* Header Component */}
    <Header />

    <div className="image-detail-container">
      {/* Main Image */}
      <div className="image-detail-main">
        <img src={`/assets/wildlife_images/${image}`} alt={image} className="image" />
      </div>

      {/* Collage Below */}
      <div className="image-container2">
        <div className="image-column">
          {collageImages.slice(0, Math.ceil(collageImages.length / 3)).map((collageImage, index) => (
            <div key={index} className="image-item">
              <img
                src={`/assets/wildlife_images/${collageImage}`}
                alt={collageImage}
                className="image"
                onClick={() => openModal(collageImage)} // Open modal on click
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
                onClick={() => openModal(collageImage)}
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
                onClick={() => openModal(collageImage)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="demo-modal-overlay" onClick={closeModal}>
          <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="demo-modal-header">
              <h3>Image Comparison</h3>
              <button onClick={closeModal} className="demo-close-button">X</button>
            </div>
            <div className="demo-modal-content">
              <div className="demo-modal-image">
                <img src={`/assets/wildlife_images/${image}`} alt={image} />
              </div>
              <div className="demo-modal-image">
                <img src={`/assets/wildlife_images/${clickedImage}`} alt={clickedImage} />
              </div>
            </div>
            <div className="demo-modal-footer">
              <img src={`/assets/wildlife_images/sift_matching_Tiger1_Tiger2.png`} alt="sift_matching_Tiger1_Tiger2.png" className="demo-footer-image" />
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default ImageDetail;
