// TokenBoard.tsx - WITH AUTO-NAVIGATION
import React, { useState } from 'react';
import './TokenBoard.css';

// 👇 UPDATE THE INTERFACE - Add onAllTokensEarned
interface TokenBoardProps {
  clientName?: string;
  totalTokens?: number;
  initialTokens?: number;
  onAllTokensEarned?: () => void; // 👈 ADD THIS LINE
}

const TokenBoard: React.FC<TokenBoardProps> = ({
  clientName = 'Client',
  totalTokens = 5,
  initialTokens = 0,
  onAllTokensEarned // 👈 ADD THIS PARAMETER
}) => {
  const [tokens, setTokens] = useState(initialTokens);
  
  // 👇 UPDATE THE addToken FUNCTION
  const addToken = () => {
    if (tokens < totalTokens) {
      const newTokens = tokens + 1;
      setTokens(newTokens);
      
      // SIMPLE SOUND PLAYER
      try {
        const sound = new Audio('/sounds/coin.mp3');
        sound.volume = 0.5; // 50% volume
        sound.play();
        console.log("🎵 Playing coin sound!");
      } catch (error) {
        console.log("Couldn't play sound:", error);
      }
      
      // 👇 NEW: Check if we reached max tokens and trigger callback
      if (newTokens >= totalTokens && onAllTokensEarned) {
        // Wait 1.5 seconds for celebration to show, then navigate
        setTimeout(() => {
          console.log("🎯 All tokens earned! Triggering navigation to Choice Board...");
          onAllTokensEarned();
        }, 1500); // 1.5 second delay
      }
    }
  };

  const resetTokens = () => {
    setTokens(0);
  };

  // 👇 OPTIONAL: Update the celebration message to indicate what's coming
  return (
    <div className="token-board-container">
      {/* Header */}
      <div className="token-board-header">
        <h1 className="token-board-title">🏅 Digital Token Board</h1>
        <p className="token-board-subtitle">For: <strong>{clientName}</strong> | Goal: {totalTokens} tokens</p>
      </div>

      {/* Token Display - CIRCLES! */}
      <div className="token-display">
        {[1, 2, 3, 4, 5].map((num) => (
          <div
            key={num}
            className="token"
            style={{
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
      <div className="progress-text">
        <h2>
          Tokens: <span style={{ color: '#2E8B57' }}>{tokens}</span> / {totalTokens}
        </h2>
      </div>

      {/* Buttons */}
      <div className="token-buttons">
        <button
          onClick={addToken}
          disabled={tokens >= totalTokens}
          className="add-token-button"
          style={{
            backgroundColor: tokens >= totalTokens ? '#CCCCCC' : '#4CAF50',
            cursor: tokens >= totalTokens ? 'not-allowed' : 'pointer',
          }}
        >
          {tokens >= totalTokens ? '✅ All Tokens Earned!' : '➕ Add Token'}
        </button>

        <button
          onClick={resetTokens}
          className="reset-button"
        >
          🔄 Reset Board
        </button>
        
        {/* TEMPORARY TEST BUTTON - Remove this after testing */}
        <button
          onClick={() => {
            console.log("🔊 Testing sound directly...");
            new Audio('/sounds/coin.mp3').play();
          }}
          className="test-sound-button"
        >
          🔊 Test Sound
        </button>
      </div>

      {/* Celebration Message - OPTIONALLY UPDATE THIS */}
      {tokens >= totalTokens && (
        <div className="celebration-message">
          <div className="celebration-content">
            <h2>🎉 EXCELLENT WORK! 🎉</h2>
            <p>You've earned all {totalTokens} tokens!</p>
            
            {/* 👇 OPTIONAL: Add a hint about what's coming next */}
            <div style={{
              backgroundColor: '#E8F4FC',
              border: '2px solid #3498db',
              borderRadius: '10px',
              padding: '10px',
              margin: '15px 0',
              animation: 'pulse 2s infinite'
            }}>
              <p style={{ margin: 0, color: '#2c3e50', fontWeight: 'bold' }}>
                🎯 Choosing your reward in 2 seconds...
              </p>
            </div>
            
            <div className="reward-box">
              <strong>Reward: </strong> Choice of iPad, puzzles, or sensory bin
            </div>
          </div>
        </div>
      )}

      {/* Demo Notes (for BCBA) */}
      <div className="demo-notes">
        <h3>💡 For BCBA Review:</h3>
        <ul>
          <li>✅ Digital version of token board system</li>
          <li>✅ Visual feedback (circles fill in)</li>
          <li>✅ Clear progress tracking</li>
          <li>✅ Ready for tablet use in sessions</li>
          <li>✅ Auto-navigates to Choice Board when complete</li> {/* 👈 UPDATE THIS */}
          <li>🚀 Future: Save progress, add sounds, customize tokens</li>
        </ul>
      </div>
    </div>
  );
};

export default TokenBoard;