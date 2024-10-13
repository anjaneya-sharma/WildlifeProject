// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Collage from './components/Collage';
import Modal from './components/Modal';
import Header from './components/Header';
import Footer from './components/Footer';

const path_to_images = 'http://127.0.0.1:8000/image/';

function App() {
  const [images, set_images] = useState([]);
  const [selected_image, set_selected_image] = useState(null);
  const [column_images, set_column_images] = useState([[], [], [], [], []]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/images')
      .then(response => {
        const loaded_images = response.data.images;
        set_images(loaded_images);
        distribute_images(loaded_images);
      })
      .catch(error => {
        console.error('error fetching images:', error);
      });
  }, []);

  const distribute_images = (image_list) => {
    const columns = Array.from({ length: 5 }, () => ({ height: 0, images: [] }));
    image_list.forEach(image => {
      const img = new Image();
      img.src = `${path_to_images}${image}`;
      img.onload = () => {
        const min_height_column = columns.reduce((prev, curr) => prev.height < curr.height ? prev : curr);
        min_height_column.images.push(image);
        min_height_column.height += img.height;
        set_column_images(columns.map(col => col.images));
      };
    });
  };

  const handle_image_click = (image) => {
    set_selected_image(image);
  };

  const handle_close_modal = () => {
    set_selected_image(null);
  };

  return (
    <div className="App">
      <Header />
      <main>
        <Collage column_images={column_images} handle_image_click={handle_image_click} />
        {selected_image && (
          <Modal
            selected_image={selected_image}
            path_to_images={path_to_images}
            handle_close_modal={handle_close_modal}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;