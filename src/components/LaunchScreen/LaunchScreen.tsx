// src/components/LaunchScreen/LaunchScreen.tsx
import React from 'react';
import './LaunchScreen.css';

interface LaunchScreenProps {
  onLaunch: () => void;
}

const LaunchScreen: React.FC<LaunchScreenProps> = ({ onLaunch }) => {
  const [buttonClicked, setButtonClicked] = React.useState(false);

  const handleLaunch = () => {
    setButtonClicked(true);
    // Play launch sound
    try {
      const audio = new Audio('/sounds/launch.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      // Silently fail
    }
    
    // Brief delay for animation
    setTimeout(() => {
      onLaunch();
    }, 800);
  };

  return (
    <div className="launch-screen">
      <div className="launch-container">
        {/* Logo/Title */}
        <div className="logo-section">
          <div className="logo">
            🧠
          </div>
          <h1 className="title">Cognition</h1>
          <p className="subtitle">ABA Therapy Digital Tools</p>
          <div className="tagline">Built by a practicing RBT</div>
        </div>

        {/* Feature Highlights */}
        <div className="features">
          <div className="feature">
            <span className="feature-icon">🏅</span>
            <span className="feature-text">Digital Token Boards</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🎯</span>
            <span className="feature-text">Discrimination Games</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🎭</span>
            <span className="feature-text">Emotion Training</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📅</span>
            <span className="feature-text">Visual Schedules</span>
          </div>
        </div>

        {/* Launch Button */}
        <div className="launch-section">
          <button
            className={`launch-button ${buttonClicked ? 'launching' : ''}`}
            onClick={handleLaunch}
            disabled={buttonClicked}
          >
            {buttonClicked ? 'Launching...' : 'Launch Tools'}
          </button>
          <div className="version">v1.0 • For Educational Use</div>
        </div>

        {/* Creator Info */}
        <div className="creator-info">
          <p>Created by a Registered Behavior Technician</p>
          <p className="disclaimer">
            ⚠️ For educational/demonstration purposes only.<br />
            No patient data stored. Not a medical device.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LaunchScreen;