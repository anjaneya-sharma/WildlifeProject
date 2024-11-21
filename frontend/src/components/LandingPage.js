// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import Header from './Header';
// import Footer from './Footer';
// import './styles.css';


// const FeatureCard = ({ icon, title, description }) => (
//   <div className="feature-card">
//     <div className="feature-icon">{icon}</div>
//     <h3>{title}</h3>
//     <p>{description}</p>
//   </div>
// );

// const LandingPage = () => {
//   const navigate = useNavigate();
  
//   // const features = [
//   //   {
//   //     icon: '🔍',
//   //     title: "Object Detection",
//   //     description: "YOLOv5 based wildlife detection and classification in natural habitats."
//   //   },
//   //   {
//   //     icon: '🦅',
//   //     title: "Bird Count",
//   //     description: "Automated counting and tracking of bird populations in wildlife images."
//   //   },
//   //   {
//   //     icon: '🎯',
//   //     title: "Re-identification",
//   //     description: "Track and identify individual animals across multiple images."
//   //   },
//   //   {
//   //     icon: '🖼️',
//   //     title: "Segmentation",
//   //     // description: "Precise separation of wildlife subjects from their backgrounds for detailed analysis."
//   //   },
//   //   {
//   //     icon: '📏',
//   //     title: "Depth Estimation",
//   //     // description: "Calculate distances and spatial relationships in wildlife photographs."
//   //   }
//   // ];

//   return (
//     <div className="landing-page">
//       <Header />
      
//       <main className="main-content">
//         <section className="hero">
//           <h1>Wildlife Image Analysis</h1>
//           <p>Leveraging artificial intelligence to analyze, track, and understand wildlife in their natural habitats.</p>
//           <button className="cta-button" onClick={() => navigate('/ThreeButtons')}>
//             Start Analyzing
//             <span className="arrow">→</span>
//           </button>
//         </section>

//         {/* <section className="features">
//           {features.map((feature, index) => (
//             <FeatureCard key={index} {...feature} />
//           ))}
//         </section> */}
//       </main>

//       <Footer />
//     </div>
//   );
// };

// export default LandingPage;



import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const tasks = [
    {
      icon: '🔍',
      title: 'Object Detection',
      description: 'Detect and classify wildlife species',
      onClick: () => navigate('/task-selection'),
      disabled: false,
    },
    {
      icon: '🎯',
      title: 'Re-identification',
      description: 'Track individual animals across images',
      onClick: () => navigate('/re-identification'),
      disabled: false,
    },
  ];

  return (
    <div className="landing-page">
      <Header />
      
      <main className="main-content">
        <section className="hero">
          <h1>Wildlife Image Analysis</h1>
          <p>Leveraging artificial intelligence to analyze, track, and understand wildlife in their natural habitats.</p>
          {/* <button className="cta-button" onClick={() => navigate('/re-identification')}>
              <span className="arrow">→</span>
          </button> */}
        </section>

        {/* Buttons for Object Detection and Re-identification */}
        <section className="tasks">
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
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
