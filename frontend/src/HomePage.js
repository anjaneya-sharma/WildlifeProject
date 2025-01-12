import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';
import Header from './Common/Header';

const HomePage = () => {
  const navigate = useNavigate();

  const handleRedirect = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.title}>Human-in-the-loop Visual Wildlife Monitoring Systems</h1>
        <div className={styles.buttonContainer}>
          <button
            type="button"
            className={styles.button}
            onClick={() => handleRedirect('/landingpage')}
          >
            Object Detection
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => handleRedirect('/upload')}
          >
            Bird Count
          </button>
        </div>
      </div>
    </>
  );
};

export default HomePage;