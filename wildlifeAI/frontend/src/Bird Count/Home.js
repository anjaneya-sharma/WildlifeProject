import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; 
import Header from '../Common/Header';

function Home() {
  return (
    <div>
      <Header/>
    <div class="home-container">
    <div className="home-box">
      <header className="title">Bird Count</header>
      <div className="home-cont">
        <Link to="/landingpage" className="role-link">Object Detection</Link>
        <Link to="/upload" className="role-link">Bird Count</Link>
      </div>
    </div>
    </div>
    </div>
  );
}

export default Home;
