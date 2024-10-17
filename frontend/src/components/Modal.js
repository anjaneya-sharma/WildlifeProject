// Modal.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Modal.css';
import BoundingBox from './BoundingBox';

const Modal = ({ selected_image, path_to_images, handle_close_modal, initial_box_data }) => {
  
  // states for event listeners
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });  // state to keep track of the image dimensions
  const [boxData, setBoxData] = useState(initial_box_data || null);     // state to keep track of bounding box data

  // references to DOM elements
  const imageRef = useRef(null);                                        // reference to the image element
  const modalRef = useRef(null);                                        // reference to the modal content element
  const modalBackgroundRef = useRef(null);                              // reference to the modal background element


  // effect to update image size when the image loads or window resizes
  useEffect(() => {

    // function to update image size when the image is loaded or resized
    const updateImageSize = () => {
      if (imageRef.current) {
        const { width, height } = imageRef.current.getBoundingClientRect();
        setImageSize({ width, height });
      }
    };

    // load image and set the size on load
    const img = new Image();
    img.src = `${path_to_images}${selected_image}`;
    img.onload = updateImageSize;

    // add a resize event listener to handle window resizing
    window.addEventListener('resize', updateImageSize);

    // cleanup the resize event listener when component closes
    return () => window.removeEventListener('resize', updateImageSize);
  }, [selected_image, path_to_images]);

  // callback to handle changes in bounding box
  const handleBoxChange = useCallback((newBoxData) => {
    setBoxData(newBoxData);
  }, []);

  // callback to handle the save button click
  const handleSave = useCallback(() => {
    if (boxData) {
      const data = {
        filename: selected_image,
        bbox: boxData 
      };
      console.log('Saving data:', data);
      // send data to backend goes here
    }
  }, [boxData, selected_image]);

  const handleClickOutside = (e) => {

    console.log('Clicked outside modal content. Checking refs:', {
      modalBackgroundRef: modalBackgroundRef.current,
      modalRef: modalRef.current,
      clickedElement: e.target
    });  

    // check if click happened outside the modal content
    if (modalBackgroundRef.current && modalBackgroundRef.current === e.target) {
      console.log("Click outside modal background. Closing modal.");
      handle_close_modal();
    }
  };

  return (
    <div 
      className="modal" 
      ref={modalBackgroundRef} // Attach ref to the modal background
      onClick={handleClickOutside}
    >
      <div
        className="modal-content"
        onClick={(e) => {
          e.stopPropagation();                               // prevent clicks inside modal content from propagating and closing the modal
          e.preventDefault();                                // prevent default behavior of the event (i do not know how to explain)
        }}
        ref={modalRef}                                       // reference for the modal content
      >
        <div className="image-container">
          <img
            ref={imageRef}                                   // reference for the image element
            src={`${path_to_images}${selected_image}`}       // image source
            alt={selected_image}                             
            className="modal-image"                          // for css
            onDragStart={(e) => e.preventDefault()}          // prevent dragging of the image
          />
          
          {/* render bounding box if image is loaded */}
          {imageSize.width > 0 && imageSize.height > 0 && (
            <BoundingBox
              key={`${imageSize.width}-${imageSize.height}`} // unique key for the BoundingBox
              imageWidth={imageSize.width}                   // pass image width
              imageHeight={imageSize.height}                 // pass image height
              onBoxChange={handleBoxChange}                  // callback for bounding box changes
              initialBox={boxData}                           // pass initial bounding box data
            />
          )}
        </div>
        <button className="save-button" onClick={handleSave}>Save</button>
        <div className="modal-metadata">
          <p>Metadata for {selected_image}</p> {/* metadata for the selected image goes here */}
        </div>
        <span className="close" onClick={handle_close_modal}>&times;</span>
      </div>
    </div>
  );
};

export default Modal;