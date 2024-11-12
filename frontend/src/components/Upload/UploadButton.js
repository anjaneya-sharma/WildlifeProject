import React from 'react';

const UploadButton = ({ 
  type, 
  isLoading, 
  uploadStatus, 
  handleUpload, 
  icon, 
  title, 
  description 
}) => {
  return (
    <div className={`upload-button ${uploadStatus || ''} ${isLoading ? 'loading' : ''}`}>
      <input 
        type="file" 
        multiple 
        {...(type === 'folder' ? { webkitdirectory: "true" } : {})}
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