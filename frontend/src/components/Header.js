// Header.js
import React from 'react';
import './styles.css';


const logoPath = '/assets/static/AIWilD.jpg';
const iiitdLogoPath = '/assets/static/iiitd logo.png';
const wiiLogoPath = '/assets/static/WII Logo.jpeg';
const ntcaLogoPath = '/assets/static/NTCA logo.png';

const Header = () => {
  return (
    <header className="App-header">
      <div className="top-bar">
        <img src={logoPath} alt="AIWilD Logo" className="logo" />
        <nav className="nav-links">
          <a href="/" className="nav-link">Home</a>
          <a href="#" className="nav-link">Team</a>
          <a href="mailto:anands@iiitd.ac.in" className="nav-link">Contact Us</a>
        </nav>
        <div className="logo-group">
          <img src={ntcaLogoPath} alt="NTCA Logo" className="small-logo" />
          <a href="https://wii.gov.in" target="_blank" rel="noopener noreferrer">
            <img src={wiiLogoPath} alt="WII Logo" className="small-logo" />
          </a>
          <a href="https://iiitd.ac.in" target="_blank" rel="noopener noreferrer">
            <img src={iiitdLogoPath} alt="IIITD Logo" className="small-logo" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
