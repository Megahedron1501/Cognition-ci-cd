// App.tsx - THE SIMPLEST POSSIBLE TOKEN BOARD
import React, { useState } from 'react';

function App() {
  // Just ONE piece of state
  const [tokens, setTokens] = useState(0);

  return (
    <div style={{ padding: 50, textAlign: 'center' }}>
      <h1>Token Board</h1>
      
      {/* Show tokens as text */}
      <h2>Tokens: {tokens}</h2>
      
      {/* One button */}
      <button 
        onClick={() => setTokens(tokens + 1)}
        style={{ padding: 20, fontSize: 20 }}
      >
        Add Token
      </button>
      
      {/* Reset button */}
      <button 
        onClick={() => setTokens(0)}
        style={{ padding: 20, fontSize: 20, marginLeft: 10 }}
      >
        Reset
      </button>
      
      {/* Simple message when complete */}
      {tokens >= 5 && (
        <p style={{ color: 'green', fontSize: 24, marginTop: 20 }}>
          🎉 All done! Reward time! 🎉
        </p>
      )}
    </div>
  );
}

export default App;