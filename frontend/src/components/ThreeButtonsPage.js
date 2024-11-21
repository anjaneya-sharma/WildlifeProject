import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

function ThreeButtonsPage() {
  const navigate = useNavigate();

  const tasks = [
    {
      icon: '🔍',
      title: 'Object Detection',
      description: 'Detect and classify wildlife species',
      onClick: () => navigate('/task-selection'),
      disabled: false,
    },
    // {
    //   icon: '🦅',
    //   title: 'Bird Count',
    //   description: 'Automatically count birds in images',
    //   onClick: () => navigate('/bird-count'),
    //   disabled: true,
    // },
    {
      icon: '🎯',
      title: 'Re-identification',
      description: 'Track individual animals across images',
      onClick: () => navigate('/re-identification'),
      disabled: true,
    },
  ];

  return (
    <div className="three-buttons-page">
      <Header />
      <main>
        <div className="button-container">
          {tasks.map((task, index) => (
            <div key={index} className="button-card">
              <div className="button-icon">{task.icon}</div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <button
                className={`big-button ${task.disabled ? 'disabled' : ''}`}
                onClick={task.disabled ? null : task.onClick}
                disabled={task.disabled}
              >
                {task.title}
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ThreeButtonsPage;
