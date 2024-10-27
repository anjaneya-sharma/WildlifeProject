import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const UploadSection = ({ onUpload, isSelected, uploadStatus }) => {
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    onUpload(selectedFiles);
  };

  return (
    <div className={`upload-section ${isSelected ? 'selected' : ''} ${uploadStatus || ''}`}>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="file-input"
        accept="image/*"
      />
      <div className="upload-content">
        <div className="upload-icon">⬆️</div>
        <h3>Upload New Images</h3>
        <p>Drag & drop your images or click to browse</p>
        {uploadStatus === 'upload-success' && (
          <div className="status-message success">
            Upload successful! ✓
          </div>
        )}
        {uploadStatus === 'upload-error' && (
          <div className="status-message error">
            Upload failed! Please try again
          </div>
        )}
      </div>
    </div>
  );
};

const ViewSection = ({ onClick, isSelected }) => (
  <div 
    className={`view-section ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
  >
    <div className="view-content">
      <div className="view-icon">🖼️</div>
      <h3>View Existing Images</h3>
      <p>Browse and analyze your uploaded images</p>
    </div>
  </div>
);

const TaskCard = ({ icon, title, description, disabled, onClick }) => {
  return (
    <div 
      className={`task-card ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onClick()}
    >
      <div className="task-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {disabled && <span className="coming-soon">Coming Soon</span>}
    </div>
  );
};

const TaskSelectionPage = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadedImageIds, setUploadedImageIds] = useState(null);

  const handleUpload = async (files) => {
    setUploadedFiles(files);
    setSelectedMode('upload');
    setUploadStatus(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      setUploadedImageIds(result.imageIds);
      setUploadStatus('upload-success');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('upload-error');
      setSelectedMode(null);
      setUploadedImageIds(null);
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const handleViewOld = () => {
    setSelectedMode('view');
    setUploadedFiles(null);
    setUploadStatus(null);
    setUploadedImageIds(null);
  };

  const handleTaskSelection = (taskType) => {
    if (selectedMode === 'upload' && uploadedImageIds) {
      navigate(`/${taskType}`, { state: { imageIds: uploadedImageIds } });
    } else {
      navigate(`/${taskType}`, { state: { mode: 'view' } });
    }
  };

  const tasks = [
    {
      icon: '🔍',
      title: 'Object Detection',
      description: 'Detect and classify wildlife species',
      onClick: () => handleTaskSelection('object-detection'),
      disabled: false
    },
    {
      icon: '🦅',
      title: 'Bird Count',
      description: 'Automatically count birds in images',
      onClick: () => handleTaskSelection('bird-count'),
      disabled: true
    },
    {
      icon: '🎯',
      title: 'Re-identification',
      description: 'Track individual animals across images',
      onClick: () => handleTaskSelection('re-identification'),
      disabled: true
    }
  ];

  // only show tasks if we are in view existing images mode OR if we have a successful upload
  const shouldShowTasks = selectedMode === 'view' || (selectedMode === 'upload' && uploadStatus === 'upload-success');

  return (
    <div className="task-selection-page">
      <Header />
      <main className="task-selection-content">
        <div className="task-selection-header">
          <h1>Wildlife Image Analysis</h1>
          <p>Upload new images or analyze existing ones</p>
        </div>

        <div className="upload-view-section">
          <UploadSection 
            onUpload={handleUpload}
            isSelected={selectedMode === 'upload'}
            uploadStatus={uploadStatus}
          />
          <ViewSection
            onClick={handleViewOld}
            isSelected={selectedMode === 'view'}
          />
        </div>

        {shouldShowTasks && (
          <div className="tasks-container">
            <h2>Select Analysis Task</h2>
            <div className="tasks-grid">
              {tasks.map((task, index) => (
                <TaskCard key={index} {...task} />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TaskSelectionPage;