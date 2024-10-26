import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './styles.css';


const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: '🔍',
      title: "Object Detection",
      description: "YOLOv5 based wildlife detection and classification in natural habitats."
    },
    {
      icon: '🦅',
      title: "Bird Count",
      description: "Automated counting and tracking of bird populations in wildlife images."
    },
    {
      icon: '🎯',
      title: "Re-identification",
      description: "Track and identify individual animals across multiple images."
    },
    {
      icon: '🖼️',
      title: "Segmentation",
      // description: "Precise separation of wildlife subjects from their backgrounds for detailed analysis."
    },
    {
      icon: '📏',
      title: "Depth Estimation",
      // description: "Calculate distances and spatial relationships in wildlife photographs."
    }
  ];

  return (
    <div className="landing-page">
      <Header />
      
      <main className="main-content">
        <section className="hero">
          <h1>AIWildlife Analysis</h1>
          <p>Leveraging artificial intelligence to analyze, track, and understand wildlife in their natural habitats.</p>
          <button className="cta-button" onClick={() => navigate('/user-type')}>
            Start Analyzing
            <span className="arrow">→</span>
          </button>
        </section>

        <section className="features">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;