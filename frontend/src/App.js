import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const path_to_images = 'http://127.0.0.1:8000/image/';
const logoPath       = '/assets/static/AIWilD.jpg';
const iiitdLogoPath  = '/assets/static/iiitd logo.png';
const wiiLogoPath    = '/assets/static/WII Logo.jpeg';
const ntcaLogoPath   = '/assets/static/NTCA logo.png';

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [columnImages, setColumnImages] = useState([[], [], [], [], []]); // 5 cols

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/images')
      .then(response => {
        const loadedImages = response.data.images;
        setImages(loadedImages);
        distributeImages(loadedImages); // separate images into columns when fetched
      })
      .catch(error => {
        console.error('Error fetching images:', error);
      });
  }, []);

  // aahhhhhhhh
  const distributeImages = (imageList) => {
    const columns = Array.from({ length: 5 }, () => ({ height: 0, images: [] })); // 5 cols

    imageList.forEach(image => {
      const img = new Image();
      img.src = `${path_to_images}${image}`;

      img.onload = () => {
        const minHeightColumn = columns.reduce((prev, curr) => prev.height < curr.height ? prev : curr);
        // greedy
        minHeightColumn.images.push(image);
        minHeightColumn.height += img.height;
        
        setColumnImages(columns.map(col => col.images));
      };
    });
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="top-bar">
          <img src={logoPath} alt="AIWilD Logo" className="logo" />
          <nav className="nav-links">
            <a href="#" className="nav-link">Home</a>
            <a href="#" className="nav-link">Team</a>
            <a href="#" className="nav-link">Contact Us</a>
          </nav>
          <div className="logo-group">
            <img src={ntcaLogoPath} alt="NTCA Logo" className="small-logo" />
            <img src={wiiLogoPath} alt="WII Logo" className="small-logo" />
            <img src={iiitdLogoPath} alt="IIITD Logo" className="small-logo" />
          </div>
        </div>
      </header>
      <main>
        <div className="collage">
          {columnImages.map((column, columnIndex) => (
            <div key={columnIndex} className="collage-column">
              {column.map(image => (
                <img
                  key={image}
                  src={`${path_to_images}${image}`}
                  alt={image}
                  className="collage-image"
                  onClick={() => handleImageClick(image)}
                  loading="lazy"
                />
              ))}
            </div>
          ))}
        </div>
        {selectedImage && (
          <div className="modal" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <span className="close" onClick={handleCloseModal}>&times;</span>
              <img
                src={`${path_to_images}${selectedImage}`}
                alt={selectedImage}
                className="modal-image"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </main>
      <footer className="App-footer">
        <p>&copy; 2024 Ameya Kumar</p>
      </footer>
    </div>
  );
}

export default App;