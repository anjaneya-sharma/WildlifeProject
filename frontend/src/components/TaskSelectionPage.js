import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const TaskCard = ({ icon, title, description, path, disabled }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className={`task-card ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && navigate(path)}
    >
      <div className="task-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {disabled && <span className="coming-soon">Coming Soon</span>}
    </div>
  );
};

const TaskSelectionPage = () => {
  const tasks = [
    {
      icon: '🔍',
      title: 'Object Detection',
      description: 'Detect and classify wildlife species',
      path: '/main',
      disabled: false
    },
    {
      icon: '🦅',
      title: 'Bird Count',
      description: 'Automatically count birds in images',
      path: '/bird-count',
      disabled: true
    },
    {
      icon: '🎯',
      title: 'Re-identification',
      description: 'Track individual animals across images',
      path: '/re-identification',
      disabled: true
    },
    {
      icon: '📁',
      title: 'View Uploaded Images',
      description: 'Access your previously uploaded images',
      path: '/view-images',
      disabled: false
    },
    {
      icon: '⬆️',
      title: 'Upload New Images',
      description: 'Upload a new set of images for analysis',
      path: '/upload-images',
      disabled: false
    }
  ];

  return (
    <div className="task-selection-page">
      <Header />
      
      <main className="task-selection-content">
        <div className="task-selection-header">
          <h1>Select Your Task</h1>
          <p>Choose the task you'd like to perform</p>
        </div>

        <div className="tasks-grid">
          {tasks.map((task, index) => (
            <TaskCard key={index} {...task} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TaskSelectionPage;