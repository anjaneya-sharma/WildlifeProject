import React, { useState } from 'react';
import { uploadFiles, uploadFolders } from '../../api/uploadApi';
import StatusMessage from '../common/StatusMessage';
import UploadButton from './UploadButton';

const UploadSection = ({ onUploadSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleFileUpload = async (event) => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadStatus(null);

      const files = Array.from(event.target.files);
      if (files.length === 0) {
        throw new Error('No files selected');
      }

      const result = await uploadFiles(files);

      setUploadStatus('upload-success');
      if (result.processed_image_id) {
        onUploadSuccess([result.processed_image_id]);
      } else if (result.processed_image_ids) {
        onUploadSuccess(result.processed_image_ids);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
      setUploadStatus('upload-error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderUpload = async (event) => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadStatus(null);

      const files = Array.from(event.target.files);
      if (files.length === 0) {
        throw new Error('No files selected');
      }

      const result = await uploadFolders(files[0]);

      setUploadStatus('upload-success');
      if (result && result.processed_image_ids) {
        onUploadSuccess(result.processed_image_ids);
      } else {
        onUploadSuccess([]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
      setUploadStatus('upload-error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-section">
      <div className="upload-buttons">
        <UploadButton
          type="file"
          isLoading={isLoading}
          uploadStatus={uploadStatus}
          handleUpload={handleFileUpload}
          icon="🗒️"
          title="Upload Image File"
          description="Click or drag image files here"
        />
        <UploadButton
          type="file"
          accept=".zip"
          isLoading={isLoading}
          uploadStatus={uploadStatus}
          handleUpload={handleFolderUpload}
          icon="🗂️"
          title="Upload Zip Folder"
          description="Click or drag zip folders here"
        />
      </div>

      {(uploadStatus || error) && (
        <StatusMessage
          status={uploadStatus}
          error={error}
        />
      )}
    </div>
  );
};

export default UploadSection;