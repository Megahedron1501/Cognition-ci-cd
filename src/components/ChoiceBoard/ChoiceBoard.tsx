// src/components/ChoiceBoard/ChoiceBoard.tsx
import React, { useState } from 'react';
import './ChoiceBoard.css';

const ChoiceBoard: React.FC = () => {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // HARD-CODED FOR WEDNESDAY DEMO
  const choices = [
    {
      id: 'bluey-phone',
      name: 'Bluey Phone',
      emoji: '📱',
      color: '#3498db', // Blue
      description: 'Play Bluey game on phone',
      sound: '/sounds/bluey.mp3' // Optional
    },
    {
      id: 'drawing',
      name: 'Drawing',
      emoji: '🎨',
      color: '#e74c3c', // Red
      description: 'Draw with markers',
      sound: '/sounds/drawing.mp3' // Optional
    }
  ];

  const handleChoiceClick = (choice: typeof choices[0]) => {
    setSelectedChoice(choice.name);
    
    // Play sound
    try {
      const audio = new Audio('/sounds/choice-selected.mp3' || '/sounds/coin.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {
      // Silently fail
    }
    
    // Show celebration
    setShowCelebration(true);
    
    // Auto-hide celebration after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  const resetChoice = () => {
    setSelectedChoice(null);
    setShowCelebration(false);
  };

  return (
    <div className="choice-board">
      {/* Header */}
      <div className="choice-header">
        <h1>🎯 Choice Board</h1>
        <p className="demo-note">***TESTING***</p>
        <p className="instruction">What would you like to work for?</p>
      </div>

      {/* Choice Buttons */}
      <div className="choices-container">
        {choices.map((choice) => (
          <button
            key={choice.id}
            className={`choice-button ${selectedChoice === choice.name ? 'selected' : ''}`}
            onClick={() => handleChoiceClick(choice)}
            style={{
              backgroundColor: choice.color,
              borderColor: selectedChoice === choice.name ? '#2c3e50' : choice.color
            }}
            disabled={!!selectedChoice}
          >
            <div className="choice-emoji">{choice.emoji}</div>
            <div className="choice-name">{choice.name}</div>
            <div className="choice-description">{choice.description}</div>
          </button>
        ))}
      </div>

      {/* Celebration Message */}
      {showCelebration && selectedChoice && (
        <div className="celebration">
          <div className="celebration-content">
            <h2>🎉 Excellent Choice!</h2>
            <p>You chose: <strong>{selectedChoice}</strong></p>
            <p className="reinforcer-text">
              {selectedChoice === 'Bluey Phone' 
                ? 'Great! After you earn 5 tokens, you can play Bluey!'
                : 'Awesome! After 5 tokens, you get to draw with markers!'}
            </p>
            <div className="celebration-emoji">
              {selectedChoice === 'Bluey Phone' ? '📱→🎮' : '🎨→🖼️'}
            </div>
          </div>
        </div>
      )}

      {/* Reset Button */}
      {selectedChoice && (
        <div className="reset-section">
          <button onClick={resetChoice} className="reset-button">
            🔄 Reset Choice
          </button>
          <p className="reset-hint">(For demo purposes - resets so you can try both)</p>
        </div>
      )}

      {/* Demo Instructions (for clinician) */}
      <div className="demo-instructions">
        <h3>💡 For Clinician Demo:</h3>
        <ul>
          <li>Client chooses between <strong>Bluey Phone</strong> or <strong>Drawing</strong></li>
          <li>Choice is visually confirmed with celebration</li>
          <li>Integrates with Token Board (earn 5 tokens → get chosen reinforcer)</li>
          <li>Simple, clear, clinically appropriate</li>
          <li>Built specifically for Wednesday's session goals</li>
        </ul>
      </div>

      {/* Clinical Rationale */}
      <div className="clinical-rationale">
        <h3>🧠 Clinical Rationale:</h3>
        <p>
          <strong>Choice-making</strong> is a critical skill in ABA. This digital choice board:
        </p>
        <ul>
          <li>Provides <strong>visual support</strong> for decision-making</li>
          <li>Offers <strong>limited, appropriate choices</strong> (2 options)</li>
          <li>Includes <strong>auditory feedback</strong> for selection</li>
          <li>Can be used for <strong>preference assessment</strong></li>
          <li>Supports <strong>communication</strong> for non-verbal clients</li>
        </ul>
      </div>
    </div>
  );
};

export default ChoiceBoard;