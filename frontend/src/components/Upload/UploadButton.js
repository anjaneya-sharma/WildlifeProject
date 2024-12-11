import React from 'react';

const UploadButton = ({ 
  isLoading, 
  uploadStatus, 
  handleUpload, 
  icon, 
  title, 
  description,
  accept = "*/*"
}) => {
  return (
    <div className={`upload-button ${uploadStatus || ''} ${isLoading ? 'loading' : ''}`}>
      <input 
        type="file" 
        accept={accept}
        onChange={handleUpload}
        disabled={isLoading}
      />
      <div className="upload-content">
        <span className="upload-icon">{icon}</span>
        <h3>{title}</h3>
        <p>{isLoading ? 'Uploading...' : description}</p>
      </div>
    </div>
  );
};

export default UploadButton;