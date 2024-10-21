// MainApp.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';
import Collage from './Collage';
import Modal from './Modal';
import Header from './Header';
import Footer from './Footer';

const path_to_images = 'http://127.0.0.1:8000/image/';

function MainApp() {

  const [images, set_images] = useState([]);                                            // state to keep the list of image URLs fetched from the backend
  const [selected_image, set_selected_image] = useState(null);                          // state to keep the currently selected image (used in the Modal for viewing a single image)
  const [column_images, set_column_images] = useState([[], [], [], [], []]);            // state to keep an array of arrays representing images grouped by columns for the collage layout

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/images')                                           // request to fetch the image list                                    
      .then(response => {
        const loaded_images = response.data.images;                                     // take out image data from the backend response 
        set_images(loaded_images);                                                      // update state with the list of images
        distribute_images(loaded_images);                                               // distribute the images into columns 
      })
      .catch(error => {
        console.error('error fetching images:', error);                                 // GET request failed
      });
  }, []);                                                                               // no dependency ensures this effect runs only once

  // function to distribute images evenly across columns
  const distribute_images = (image_list) => {
    const columns = Array.from({ length: 5 }, () => ({ height: 0, images: [] }));      // initialize array representing 5 columns each with a height of 0 and an empty image array
    
    // to get tha open image dataset v7 look
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

  // function to handle when an image in the collage is clicked, updates the selected_image state, triggering the modal to open
  const handle_image_click = (image) => {
    set_selected_image(image);
  };

  // function to close the modal
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

export default MainApp;