// import React from 'react';
// import Header from './Header';
// import Footer from './Footer';

// const Options = () => {
//   return (
//     <div className="new-component-page">
//       <Header />
//       <main className="main-content">
//         <h1>Welcome to the New Component</h1>
//         <p>This is the new page you navigated to!</p>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default Options;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

function Options() {
  const navigate = useNavigate();

  // Functions to handle button actions
  const handleButton1Click = () => {
    navigate('/button1-action'); // Replace with the actual route for Button 1
  };

  const handleButton2Click = () => {
    navigate('/button2-action'); // Replace with the actual route for Button 2
  };

//   return (
//     <div className="two-buttons-page">
//       <Header />
//       <main>
//         <div className="button-container">
//           <button className="button" onClick={handleButton1Click}>
//             Button 1 Action
//           </button>
//           <button className="button" onClick={handleButton2Click}>
//             Button 2 Action
//           </button>
//         </div>
//       </main>
//       <Footer />
//     </div>
//   );

    return (
        <div className="two-buttons-page">
        <Header />
        <main>
            <div className="button-container">
            <div className="button-section">
                <h2>Object Detection</h2>
                <button className="button" onClick={handleButton1Click}>
                Start Object Detection
                </button>
            </div>
            <div className="button-section">
                <h2>Re-identification</h2>
                <button className="button" onClick={handleButton2Click}>
                Start Re-ID
                </button>
            </div>
            </div>
        </main>
        <Footer />
        </div>
    );

}

export default Options;
