import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';
import TaskSelectionPage from './components/TaskSelectionPage';

function App() {
  return (
    <Router>  {/* only have one Router here */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/task-selection" element={<TaskSelectionPage />} />
        <Route path="/main" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;
