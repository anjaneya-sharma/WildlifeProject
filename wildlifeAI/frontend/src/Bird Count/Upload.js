import React, { useState } from 'react';
import './Upload.css';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Header from '../Common/Header';

function Upload() {
  const [originalImage, setOriginalImage] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [count,setCount] = useState(null);
  const [gridMap,setGridMap] = useState([]);
  const navigate = useNavigate();

  const handleImageUpload = async(event) => {
    const file = event.target.files[0];
    if (file) {
      setOriginalImage(URL.createObjectURL(file)); // Set original image for display
      setOriginalFile(file);

      // Create form data to send the image
      const formData = new FormData();
      formData.append('file', file);

    try {
      // Send image to FastAPI endpoint
      const resultImageResponse = await fetch('http://127.0.0.1:8000/model_heatmap/', {
        method: 'POST',
        body: formData,
      });

      if (!resultImageResponse.ok) {
        throw new Error("Failed to fetch processed image");
      }

      const blob = await resultImageResponse.blob();
      const resultImageUrl = URL.createObjectURL(blob); // Convert blob to URL
      setResultImage(resultImageUrl); // Set result image for display

      // Call the fetch functions
      const countData = await fetchModelCount(formData);
      const gridMap = await fetchModelArray(formData); // Get gridMap here
      console.log(countData)
      console.log(gridMap)

      // Update state if needed
      setCount(countData);
      setGridMap(gridMap); // Update the state with fetched gridMap
    } catch (error) {
      console.error('Error processing image:', error);
    }
  }
};

const fetchModelCount = async (formData) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/model_count/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch model count");
    }

    const data = await response.json();
    console.log("Model Count Data:", data); // Log count data for inspection
    return data; // Return the count data
  } catch (error) {
    console.error('Error fetching model count:', error);
    return { count: 0 }; // Return a default value in case of error
  }
};

  // Fetch model array from API
const fetchModelArray = async (formData) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/model_gridmap/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch model array");
    }

    const data = await response.json();
    console.log("Model Array Data:", data); // Log the data for inspection

    return data; // Return the array
  } catch (error) {
    console.error('Error fetching model array:', error);
    return []; // Return an empty array in case of error
  }
};

  return (
    <div>
      <Header/>
    <div className="upload-container">
      
      <div className="upload-box">
      <h2>Welcome to <span>Bird Count</span></h2>
      <p class="text-xs">Our platform leverages advanced deep learning to count birds for ecological research accurately. Bird Count aids researchers in efficient data collection, supporting vital bird population monitoring.</p>
      {!count && (<p class="text-xs">Upload your image to get the count. <br></br>This is a research project at IIITD. If you upload an image, it will not be saved by us.</p>)}
      <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }}/>
      <label htmlFor="file-upload" className="custom-upload-button">
        Upload Image
      </label>
      {count !==null && (
    <h3>Total Count = {Math.floor(count)} +- {(count - Math.floor(count)).toFixed(2)} </h3>
  )}
      <div className="image-display">
  {originalImage && (
    <div className="image-container">
      <h4>Original Image (3x3 Grid)</h4>
      <div className="grid-container">
        <img src={originalImage} alt="Original" className="grid-image" />
        <div className="grid-overlay">
          <div></div><div></div><div></div>
          <div></div><div></div><div></div>
          <div></div><div></div><div></div>
        </div>
      </div>
    </div>
  )}
  {resultImage && (
    <div className="image-container">
      <h4>Processed Image</h4>
      <img src={resultImage} alt="Processed" />
    </div>
  )}
  {gridMap && gridMap.length>0 && (
  <div className="number-grid-container">
          <h4>Count Of Each Grid</h4>
          <div className="number-grid">
            {gridMap.map((number, index) => (
              <div key={index} className="number-cell">{number[0]} +- {number[1].toFixed(2)}</div>
            ))}
  </div>
  </div>
  )}
    </div>
    {originalImage && (
      <div>
        <h3>Submit a feedback in case you notice any error in the estimated count by the model.</h3>
        <button className="custom-upload-button">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdoujoShTU4cnOUPsJ0vhaCwVMGW_iFVLoqVUK2NVWlSLIKkw/viewform?usp=sf_link" target="_blank" rel="noopener noreferrer">FeedBack Form</a>
        </button>
        <h3>Help us improve the model</h3>
        <button className="custom-upload-button"><Link
          to={{
            pathname: '/annotate',
          }}
          state={{ file: originalFile }}
        >
          Go to Annotate
        </Link></button>
      </div>
      )}
      </div>x 
    </div>
    </div>
  );
}

export default Upload;
