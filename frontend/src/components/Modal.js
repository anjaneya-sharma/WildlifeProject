import React, { useState, useEffect } from 'react';
import './Modal.css';

const Modal = ({ selected_image, path_to_images, handle_close_modal }) => {
  return (
    <div className="modal" onClick={handle_close_modal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()} // stop modal from closing when clicking inside it
      >
        <img
          src={`${path_to_images}${selected_image}`}
          alt={selected_image}
          className="modal-image"
        />
        <div className="modal-metadata">
          <p>Metadata for {selected_image}</p>
          {/* fetch metadata as necessary */}
        </div>
      </div>
    </div>
  );
};

export default Modal;
