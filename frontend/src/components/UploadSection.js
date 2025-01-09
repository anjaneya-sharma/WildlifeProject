import React, { useState } from 'react';
import { uploadFiles, uploadFolders } from '../api/uploadApi';
import { logError } from '../utils/error.js';

const UploadSection = ({ onUploadSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const uploadConfigs = {
    file: {
      accept: "image/*",
      icon: "🗒️",
      title: "Upload Image File",
      description: "Click or drag image files here",
      handler: uploadFiles,
      processResult: (result) => result.processed_image_id ? [result.processed_image_id] : result.processed_image_ids
    },
    folder: {
      accept: ".zip",
      icon: "🗂️", 
      title: "Upload Zip Folder",
      description: "Click or drag zip folders here",
      handler: uploadFolders,
      processResult: (result) => result?.processed_image_ids || []
    }
  };

  const handleUpload = async (event, config) => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadStatus(null);

      const files = Array.from(event.target.files);
      if (files.length === 0) throw new Error('No files selected');

      const result = await config.handler(config.accept === '.zip' ? files[0] : files);
      setUploadStatus('upload-success');
      onUploadSuccess(config.processResult(result));
    } catch (error) {
      logError('Upload error:', error);
      setError(error.message);
      setUploadStatus('upload-error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-section">
      <div className="upload-buttons">
        {Object.entries(uploadConfigs).map(([key, config]) => (
          <div key={key} className={`upload-button ${isLoading ? 'loading' : ''}`}>
            <input 
              type="file"
              accept={config.accept}
              onChange={(e) => handleUpload(e, config)}
              disabled={isLoading}
            />
            <div className="upload-content">
              <span className="upload-icon">{config.icon}</span>
              <h3>{config.title}</h3>
              <p>{isLoading ? 'Uploading...' : config.description}</p>
            </div>
          </div>
        ))}
      </div>

      {(uploadStatus || error) && (
        <div className={`status-message ${uploadStatus === 'upload-success' ? 'success' : 'error'}`}>
          {error || (uploadStatus === 'upload-success' ? 'Upload successful!' : 'Upload failed!')}
        </div>
      )}
    </div>
  );
};

export default UploadSection;