import React, { useState } from 'react';
import { uploadImages, uploadZipFolder } from '../api/uploadApi';
import { logError } from '../utils/error.js';
import styles from './styles.module.css';

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
      handler: uploadImages,
      processResult: (result) => Array.isArray(result) ? result : [result]
    },
    folder: {
      accept: ".zip",
      icon: "🗂️", 
      title: "Upload Zip Folder",
      description: "Click or drag zip folders here",
      handler: uploadZipFolder,
      processResult: (result) => Array.isArray(result) ? result : []
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

      const processedIds = config.processResult(result);
      if (processedIds.length > 0) {
        onUploadSuccess(processedIds);
      } else {
        throw new Error('No images were processed successfully');
      }
    } catch (error) {
      logError('Upload error:', error);
      setError(error.message);
      setUploadStatus('upload-error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["upload-section"]}>
      <div className={styles["upload-buttons"]}>
        {Object.entries(uploadConfigs).map(([key, config]) => (
          <div 
            key={key} 
            className={`${styles["upload-button"]} ${isLoading ? styles["loading"] : ''}`}
            >
            <input 
              type="file"
              accept={config.accept}
              onChange={(e) => handleUpload(e, config)}
              disabled={isLoading}
            />
            <div className={styles["upload-content"]}>
              <span className={styles["upload-icon"]}>{config.icon}</span>
              <h3>{config.title}</h3>
              <p>{isLoading ? 'Uploading...' : config.description}</p>
            </div>
          </div>
        ))}
      </div>

      {(uploadStatus || error) && (
      <div className={`${styles["status-message"]} ${uploadStatus === 'upload-success' ? styles["success"] : styles["error"]}`}>
        {error || (uploadStatus === 'upload-success' ? 'Upload successful!' : 'Upload failed!')}
      </div>
      )}
    </div>
  );
};

export default UploadSection;