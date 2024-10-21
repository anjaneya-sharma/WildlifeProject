import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './styles.css';


const RoleCard = ({ type, icon, description, features, isSelected, onClick }) => (
  <div 
    className={`role-card ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
  >
    <div className="role-icon">{icon}</div>
    <h3>{type}</h3>
    <p>{description}</p>
    <ul className="feature-list">
      {features.map((feature, index) => (
        <li key={index}>{feature}</li>
      ))}
    </ul>
    {isSelected && (
      <button 
        className="continue-button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        Continue as {type}
      </button>
    )}
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = (userType) => {
    if (selectedRole === userType) {
      console.log(`Logging in as ${userType}`);
      navigate('/task-selection');
    } else {
      setSelectedRole(userType);
      setError('');
    }
  };

  const roles = [
    {
      type: 'Maintainer',
      icon: '👤',
      description: 'Access annotation features and contribute to model improvement',
      features: [
        'All standard analysis tools',
        'Provide feedback for model training',
        'Upload and manage image sets',
        'Access to historical uploads'
      ]
    },
    {
      type: 'Guest',
      icon: '👥',
      description: 'Access core wildlife analysis features',
      features: [
        'Object detection',
        'Bird counting',
        'Re-identification',
        'Segmentation',
        'Depth estimation'
      ]
    }
  ];

  return (
    <div className="login-page">
      <Header />

      <main className="login-container">
        <div className="login-header">
          <h1>Choose Your Account Type</h1>
          <p>Select your role to proceed</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="roles-grid">
          {roles.map((role) => (
            <RoleCard
              key={role.type}
              {...role}
              isSelected={selectedRole === role.type}
              onClick={() => handleLogin(role.type)}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;