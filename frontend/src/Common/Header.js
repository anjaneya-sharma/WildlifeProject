import React from 'react';
// import '../Object Detection/components/styles.css';
import styles from '../ObjectDetection/components/styles.module.css';

const logoPath = '/assets/static/aiwild.webp';
const iiitdLogoPath = '/assets/static/iiitd_logo.webp';
const wiiLogoPath = '/assets/static/wii_logo.webp';
const ntcaLogoPath = '/assets/static/ntca_logo.webp';

const Header = () => {
  return (
    <header className={styles["App-header"]}>
      <div className={styles["top-bar"]}>
        <img src={logoPath} alt="AIWilD Logo" className={styles["logo"]} />
        <nav className={styles["nav-links"]}>
          <a href="/" className={styles["nav-link"]}>Home</a>
          <a href="#" className={styles["nav-link"]}>Team</a>
          <a href="mailto:ameya21447@iiitd.ac.in" className={styles["nav-link"]}>Contact Us</a>
        </nav>
        <div className={styles["logo-group"]}>
          <img src={ntcaLogoPath} alt="NTCA Logo" className={styles["small-logo"]} />
          <a href="https://wii.gov.in" target="_blank" rel="noopener noreferrer">
            <img src={wiiLogoPath} alt="WII Logo" className={styles["small-logo"]} />
          </a>
          <a href="https://iiitd.ac.in" target="_blank" rel="noopener noreferrer">
            <img src={iiitdLogoPath} alt="IIITD Logo" className={styles["small-logo"]} />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;