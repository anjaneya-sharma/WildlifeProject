import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const path_to_images = 'http://localhost:5000/image/';  // path to images

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/images')
      .then(response => {
        setImages(response.data.images);
      })
      .catch(error => {
        console.error('Error fetching images:', error);
      });
  }, []);

  useEffect(() => {
    const adjustImageHeights = () => {
      const columns = Array.from(document.querySelectorAll('.collage-column'));
      columns.forEach(column => {
        const images = Array.from(column.querySelectorAll('.collage-image'));
        images.forEach(image => {
          image.onload = () => {
            // set all images in a column to the same height as the first image
            const firstImage = images[0];
            image.style.height = `${firstImage.clientHeight}px`;
          };
        });
      });
    };

    adjustImageHeights();
    window.addEventListener('resize', adjustImageHeights);

    return () => {
      window.removeEventListener('resize', adjustImageHeights);
    };
  }, [images]);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const columnCount = 5;
  const columns = Array.from({ length: columnCount }, (_, index) => index);

  return (
    <div className = "App">
      <header className = "App-header">
        <h1>Wildlife Collage</h1>
        <p>A collection of wildlife images</p>
      </header>
      <main>
        <div className="collage">
          {columns.map(columnIndex => (
            <div key = {columnIndex} className="collage-column">
              {images.filter((_, index) => index % columnCount === columnIndex).map(image => (
                <img
                  key = {image}
                  src = {`${path_to_images}${image}`}
                  alt = {image}
                  className = "collage-image"
                  onClick={() => handleImageClick(image)}
                  loading='lazy'
                />
              ))}
            </div>
          ))}
        </div>
        {selectedImage && (
          <div className = "modal" onClick = {handleCloseModal}>
            <div className = "modal-content" onClick = {e => e.stopPropagation()}>
              <span className = "close" onClick = {handleCloseModal}>&times;</span>
              <img
                src = {`${path_to_images}${selectedImage}`}
                alt = {selectedImage}
                className="modal-image"
                loading='lazy'
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