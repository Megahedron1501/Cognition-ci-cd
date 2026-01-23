// App.tsx - VISUAL TOKEN BOARD WITH SOUND
import React, { useState } from 'react';
import './App.css';
import ShapeSorterGame from './games/ShapeSorterGame';
import EmotionMatcherGame from './games/EmotionMatcherGame';
import VisualScheduleBuilder from './components/VisualSchedule/VisualScheduleBuilder';

function App() {
  const [tokens, setTokens] = useState(0);
  const totalTokens = 5;
  
  // 🆕 ADD: Game view state
  const [currentView, setCurrentView] = useState<'tokenBoard' | 'shapeGame' | 'emotionGame' | 'scheduleBuilder'>('tokenBoard');
 
  const addToken = () => {
    if (tokens < totalTokens) {
      setTokens(tokens + 1);
      
      // SIMPLE SOUND PLAYER
      try {
        const sound = new Audio('/sounds/coin.mp3');
        sound.volume = 0.5; // 50% volume
        sound.play();
        console.log("🎵 Playing coin sound!");
      } catch (error) {
        console.log("Couldn't play sound:", error);
      }
    }
  };

  // KEEP THIS FUNCTION - it resets tokens to zero
  const resetTokens = () => {
    setTokens(0);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🏅 Digital Token Board</h1>
        <p style={styles.subtitle}>For: <strong>Joshua: </strong> | Goal: {totalTokens} tokens</p>
      </div>

      {/* 🆕  NAVIGATION SECTION - FIXED */}
      <div style={styles.navigation}>
        <button 
          onClick={() => setCurrentView('tokenBoard')}
          style={{
            ...styles.navButton,
            backgroundColor: currentView === 'tokenBoard' ? '#4CAF50' : '#6c757d'
          }}
        >
          🏅 Token Board
        </button>
        <button 
          onClick={() => setCurrentView('shapeGame')}
          style={{
            ...styles.navButton,
            backgroundColor: currentView === 'shapeGame' ? '#4CAF50' : '#6c757d'
          }}
        >
          🎯 Shape Sorter Game
        </button>
        <button 
          onClick={() => setCurrentView('emotionGame')}
          style={{
            ...styles.navButton,
            backgroundColor: currentView === 'emotionGame' ? '#4CAF50' : '#6c757d'
          }}
        >
          🎭 Emotion Matcher
        </button>
        <button 
          onClick={() => setCurrentView('scheduleBuilder')}
          style={{
            ...styles.navButton,
            backgroundColor: currentView === 'scheduleBuilder' ? '#4CAF50' : '#6c757d'
          }}
        >
          📅 Schedule Builder
        </button>
      </div>

      {/* 🆕 VIEW SWITCHER - FIXED */}
      {currentView === 'tokenBoard' && (
        // Token board code
        <>
          {/* Token Display - CIRCLES! */}
          <div style={styles.tokenDisplay}>
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                style={{
                  ...styles.token,
                  backgroundColor: num <= tokens ? '#FFD700' : '#FFFFFF',
                  borderColor: num <= tokens ? '#FFA500' : '#CCCCCC',
                  transform: num <= tokens ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {num <= tokens ? '★' : num}
              </div>
            ))}
          </div>

          {/* Progress Text */}
          <div style={styles.progressText}>
            <h2>
              Tokens: <span style={{ color: '#2E8B57' }}>{tokens}</span> / {totalTokens}
            </h2>
          </div>

          {/* Buttons */}
          <div style={styles.buttons}>
            <button
              onClick={addToken}
              disabled={tokens >= totalTokens}
              style={{
                ...styles.button,
                backgroundColor: tokens >= totalTokens ? '#CCCCCC' : '#4CAF50',
                cursor: tokens >= totalTokens ? 'not-allowed' : 'pointer',
              }}
            >
              {tokens >= totalTokens ? '✅ All Tokens Earned!' : '➕ Add Token'}
            </button>

            {/* This button uses resetTokens function */}
            <button
              onClick={resetTokens}
              style={{
                ...styles.button,
                backgroundColor: '#F44336',
              }}
            >
              🔄 Reset Board
            </button>
            
            {/* TEMPORARY TEST BUTTON - Remove this after testing */}
            <button
              onClick={() => {
                console.log("🔊 Testing sound directly...");
                new Audio('/sounds/coin.mp3').play();
              }}
              style={{ 
                backgroundColor: 'purple', 
                color: 'white',
                padding: '15px 30px',
                fontSize: '1.2rem',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              🔊 Test Sound
            </button>
          </div>

          {/* Celebration Message */}
          {tokens >= totalTokens && (
            <div style={styles.celebration}>
              <div style={styles.celebrationContent}>
                <h2 style={{ margin: 0 }}>🎉 EXCELLENT WORK! 🎉</h2>
                <p>You've earned all {totalTokens} tokens!</p>
                <div style={styles.rewardBox}>
                  <strong>Reward: </strong> Choice of iPad, puzzles, or sensory bin
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {currentView === 'shapeGame' && <ShapeSorterGame />}
      {currentView === 'emotionGame' && <EmotionMatcherGame />}
      {currentView === 'scheduleBuilder' && <VisualScheduleBuilder />}

      {/* Demo Notes (for BCBA) */}
      <div style={styles.demoNotes}>
        <h3>💡 For BCBA Review:</h3>
        <ul>
          <li>✅ Digital version of token board system</li>
          <li>✅ Visual feedback (circles fill in)</li>
          <li>✅ Clear progress tracking</li>
          <li>✅ Ready for tablet use in sessions</li>
          <li>🚀 Future: Save progress, add sounds, customize tokens</li>
        </ul>
      </div>
    </div>
  );
}

// CSS Styles (all in one file) - KEEP ALL YOUR ORIGINAL STYLES
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F0F8FF',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  title: {
    color: '#2C3E50',
    fontSize: '2.5rem',
    marginBottom: '10px',
  },
  subtitle: {
    color: '#7F8C8D',
    fontSize: '1.2rem',
  },
  // 🆕 ADD THESE NEW STYLES:
  navigation: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
  },
  navButton: {
    padding: '12px 24px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '180px',
  },
  // Keep all your original styles below:
  tokenDisplay: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    margin: '40px 0',
    flexWrap: 'wrap' as const,
  },
  token: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '4px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  progressText: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    margin: '40px 0',
    flexWrap: 'wrap' as const,
  },
  button: {
    padding: '15px 30px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    minWidth: '200px',
  },
  celebration: {
    backgroundColor: '#DFF0D8',
    border: '2px solid #3C763D',
    borderRadius: '15px',
    padding: '20px',
    margin: '40px auto',
    maxWidth: '600px',
    textAlign: 'center' as const,
    animation: 'pulse 2s infinite',
  },
  celebrationContent: {
    color: '#3C763D',
  },
  rewardBox: {
    backgroundColor: '#D9EDF7',
    border: '1px solid #31708F',
    borderRadius: '8px',
    padding: '15px',
    marginTop: '15px',
    fontSize: '1.1rem',
  },
  demoNotes: {
    backgroundColor: '#E3F2FD',
    border: '2px dashed #2196F3',
    borderRadius: '10px',
    padding: '20px',
    marginTop: '40px',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};

export default App;