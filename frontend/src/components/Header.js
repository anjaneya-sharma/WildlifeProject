// Header.js
import React from 'react';
import './Header.css';

const logo_path = '/assets/static/AIWilD.jpg';
const iiitd_logo_path = '/assets/static/iiitd logo.png';
const wii_logo_path = '/assets/static/WII Logo.jpeg';
const ntca_logo_path = '/assets/static/NTCA logo.png';

const Header = () => {
  return (
    <header className="App-header">
      <div className="top-bar">
        <img src={logo_path} alt="AIWilD Logo" className="logo" />
        <nav className="nav-links">
          <a href="#" className="nav-link">Home</a>
          <a href="#" className="nav-link">Team</a>
          <a href="#" className="nav-link">Contact Us</a>
        </nav>
        <div className="logo-group">
          <img src={ntca_logo_path} alt="NTCA Logo" className="small-logo" />
          <img src={wii_logo_path} alt="WII Logo" className="small-logo" />
          <img src={iiitd_logo_path} alt="IIITD Logo" className="small-logo" />
        </div>
      </div>
    </header>
  );
};

export default Header;