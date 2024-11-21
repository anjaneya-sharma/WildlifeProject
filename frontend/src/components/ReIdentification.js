import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import Header from './Header';
import Footer from './Footer';

function ReIdentification() {
  const navigate = useNavigate();

  const images = [
    'money1.png', 'wildlife_1.jpg', 'wildlife_2.jpg', 'wildlife_3.jpg', 'wildlife_4.jpg', 'wildlife_5.jpg',
    'wildlife_6.jpg', 'wildlife_7.jpg', 'wildlife_8.jpg', 'wildlife_9.jpg', 'wildlife_10.jpg', 'wildlife_11.jpg',
    'wildlife_12.jpg', 'wildlife_13.jpg', 'wildlife_14.jpg', 'wildlife_15.jpg', 'wildlife_16.jpg', 'wildlife_17.jpg',
    'wildlife_18.jpg', 'wildlife_19.jpg', 'wildlife_20.jpg', 'wildlife_21.jpg', 'wildlife_22.jpg', 'wildlife_23.jpg',
    'wildlife_24.jpg', 'wildlife_25.jpg', 'wildlife_26.jpg', 'wildlife_27.jpg', 'wildlife_28.jpg', 'wildlife_29.jpg',
    'wildlife_30.jpg', 'money2.png', 'wildlife_31.jpg', 'wildlife_32.jpg', 'wildlife_33.jpg', 'wildlife_34.jpg',
    'wildlife_35.jpg', 'wildlife_36.jpg', 'wildlife_37.jpg', 'wildlife_38.jpg', 'wildlife_39.jpg', 'wildlife_40.jpg',
    'wildlife_41.jpg', 'wildlife_42.jpg', 'wildlife_43.jpg', 'wildlife_44.jpg', 'wildlife_45.jpg', 'wildlife_46.jpg',
    'wildlife_47.jpg', 'wildlife_48.jpg', 'wildlife_49.jpg', 'wildlife_50.jpg', 'wildlife_51.jpg', 'wildlife_52.jpg',
    'wildlife_53.jpg', 'wildlife_54.jpg', 'wildlife_55.jpg', 'wildlife_56.jpg', 'wildlife_57.jpg', 'wildlife_58.jpg',
    'wildlife_59.jpg', 'wildlife_60.jpg', 'wildlife_61.jpg', 'wildlife_62.jpg', 'wildlife_63.jpg', 'wildlife_64.jpg',
    'wildlife_65.jpg', 'wildlife_66.jpg', 'wildlife_67.jpg', 'wildlife_68.jpg', 'wildlife_69.jpg', 'wildlife_70.jpg',
    'wildlife_71.jpg', 'wildlife_72.jpg', 'wildlife_73.jpg', 'wildlife_74.jpg', 'wildlife_75.jpg', 'wildlife_76.jpg',
    'wildlife_77.jpg', 'wildlife_78.jpg', 'wildlife_79.jpg', 'wildlife_80.jpg', 'wildlife_81.jpg', 'wildlife_82.jpg',
    'wildlife_83.jpg', 'wildlife_84.jpg', 'wildlife_85.jpg', 'wildlife_86.jpg', 'wildlife_87.jpg', 'wildlife_88.jpg',
    'wildlife_89.jpg', 'wildlife_90.jpg'
  ];

  const handleImageClick = (image) => {
    navigate(`/image/${image}`);
  };


  return (
    <div>
      {/* Header Component */}
      <Header />

      {/* Image Grid */}
      <div className="image-container2">
        <div className="image-column">
          {images.slice(0, Math.ceil(images.length / 3)).map((image, index) => (
            <div key={index} className="image-item" onClick={() => handleImageClick(image)}>
              <img src={`/assets/wildlife_images/${image}`} alt={image} className="image" />
            </div>
          ))}
        </div>

        <div className="image-column">
          {images.slice(Math.ceil(images.length / 3), Math.ceil((2 * images.length) / 3)).map((image, index) => (
            <div key={index} className="image-item" onClick={() => handleImageClick(image)}>
              <img src={`/assets/wildlife_images/${image}`} alt={image} className="image" />
            </div>
          ))}
        </div>

        <div className="image-column">
          {images.slice(Math.ceil((2 * images.length) / 3)).map((image, index) => (
            <div key={index} className="image-item" onClick={() => handleImageClick(image)}>
              <img src={`/assets/wildlife_images/${image}`} alt={image} className="image" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}

export default ReIdentification;
