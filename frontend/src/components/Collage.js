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



// import React, { useState, useEffect } from 'react';
// import './styles.css';  // Import the styles you've provided

// const CollagePage = () => {
//   const [images, setImages] = useState([]);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const pathToImages = 'path/to/your/images/folder/';  // Path to your images folder

//   // Fetch images from the folder (simulated here)
//   useEffect(() => {
//     const fetchImages = async () => {
//       const imageFiles = [
//         'image1.jpg', 'image2.jpg', 'image3.jpg', 
//         'image4.jpg', 'image5.jpg', 'image6.jpg',
//         // Add more image names here
//       ];
//       setImages(imageFiles);
//     };

//     fetchImages();
//   }, []);

//   const handleImageClick = (image) => {
//     setSelectedImage(image);
//   };

//   const handleCloseModal = () => {
//     setSelectedImage(null);
//   };

//   return (
//     <div>
//       <div className="collage">
//         {images.map((image) => (
//           <div className="collage-column" key={image}>
//             <img
//               src={`${pathToImages}${image}`}
//               alt={image}
//               className="collage-image"
//               onClick={() => handleImageClick(image)}
//             />
//           </div>
//         ))}
//       </div>

//       {selectedImage && (
//         <div className="modal" onClick={handleCloseModal}>
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-image-container">
//               <img
//                 src={`${pathToImages}${selectedImage}`}
//                 alt={selectedImage}
//                 className="modal-image"
//               />
//             </div>
//             <span className="close" onClick={handleCloseModal}>&times;</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CollagePage;
