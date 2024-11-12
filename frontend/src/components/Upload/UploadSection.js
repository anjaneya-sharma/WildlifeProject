import React, { useState } from 'react';
import UploadButton from './UploadButton';
import StatusMessage from '../common/StatusMessage';
import { uploadFiles, uploadFolders } from '../../api/uploadApi';

const UploadSection = ({ onUploadSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleUpload = async (type, event) => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadStatus(null);

      const files = Array.from(event.target.files);
      const uploadFn = type === 'folder' ? uploadFolders : uploadFiles;
      const result = await uploadFn(files);

      setUploadStatus('upload-success');
      onUploadSuccess(result.imageIds);
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
          handleUpload={(e) => handleUpload('file', e)}
          icon="🗒️"
          title="Upload Files"
          description="Click or drag files here"
        />

        <UploadButton
          type="folder"
          isLoading={isLoading}
          uploadStatus={uploadStatus}
          handleUpload={(e) => handleUpload('folder', e)}
          icon="📂"
          title="Upload Folders"
          description="Click or drag folders here"
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