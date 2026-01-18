import React, { useState } from 'react';
import './ShapeSorterGame.css';

interface Shape {
  id: number;
  type: 'circle' | 'square' | 'triangle';
  color: 'red' | 'blue' | 'yellow';
  x: number;
  y: number;
}

interface Bin {
  type: 'circle' | 'square' | 'triangle';
  count: number;
}

const ShapeSorterGame: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([
    { id: 1, type: 'circle', color: 'red', x: 50, y: 100 },
    { id: 2, type: 'square', color: 'blue', x: 150, y: 100 },
    { id: 3, type: 'triangle', color: 'yellow', x: 250, y: 100 },
    { id: 4, type: 'circle', color: 'blue', x: 350, y: 100 },
    { id: 5, type: 'square', color: 'yellow', x: 450, y: 100 },
    { id: 6, type: 'triangle', color: 'red', x: 550, y: 100 },
  ]);

  const [bins, setBins] = useState<Bin[]>([
    { type: 'circle', count: 0 },
    { type: 'square', count: 0 },
    { type: 'triangle', count: 0 },
  ]);

  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Drag shapes to matching bins!');

  const handleDrop = (shapeId: number, binType: 'circle' | 'square' | 'triangle') => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;

    if (shape.type === binType) {
      // Correct match
      setScore(score + 1);
      setMessage('🎉 Correct! Great job!');
      
      // Play success sound
      const audio = new Audio('/sounds/coin.mp3');
      audio.volume = 0.3;
      audio.play();
      
      // Remove shape and update bin
      setShapes(shapes.filter(s => s.id !== shapeId));
      setBins(bins.map(bin => 
        bin.type === binType ? { ...bin, count: bin.count + 1 } : bin
      ));
    } else {
      // Incorrect match
      setMessage('🤔 Try again! Match the shape type.');
      const audio = new Audio('/sounds/error.mp3');
      audio.volume = 0.3;
      audio.play();
    }
  };

  const resetGame = () => {
    setShapes([
      { id: 1, type: 'circle', color: 'red', x: 50, y: 100 },
      { id: 2, type: 'square', color: 'blue', x: 150, y: 100 },
      { id: 3, type: 'triangle', color: 'yellow', x: 250, y: 100 },
      { id: 4, type: 'circle', color: 'blue', x: 350, y: 100 },
      { id: 5, type: 'square', color: 'yellow', x: 450, y: 100 },
      { id: 6, type: 'triangle', color: 'red', x: 550, y: 100 },
    ]);
    setBins([
      { type: 'circle', count: 0 },
      { type: 'square', count: 0 },
      { type: 'triangle', count: 0 },
    ]);
    setScore(0);
    setMessage('Drag shapes to matching bins!');
  };

  return (
    <div className="shape-sorter-game">
      <div className="game-header">
        <h2>🎯 Shape Sorter Game</h2>
        <div className="score-board">
          <div className="score">Score: <strong>{score}</strong> / 6</div>
          <button className="reset-btn" onClick={resetGame}>🔄 Reset Game</button>
        </div>
      </div>

      <div className="message">{message}</div>

      {/* Bins */}
      <div className="bins-container">
        {bins.map(bin => (
          <div 
            key={bin.type}
            className="bin"
            onDragOver={e => e.preventDefault()}
            onDrop={() => {
              // Simplified drag-drop - in real version would use drag events
            }}
          >
            <div className={`bin-shape ${bin.type}`}></div>
            <div className="bin-label">{bin.type.toUpperCase()} BIN</div>
            <div className="bin-count">Count: {bin.count}</div>
            <div className="bin-drop-zone">
              Drop {bin.type}s here
            </div>
          </div>
        ))}
      </div>

      {/* Shapes */}
      <div className="shapes-container">
        {shapes.map(shape => (
          <div
            key={shape.id}
            className="shape"
            style={{
              left: `${shape.x}px`,
              top: `${shape.y}px`,
              backgroundColor: shape.color,
              cursor: 'grab'
            }}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('shapeId', shape.id.toString());
            }}
            onClick={() => {
              // For now, just cycle through bins on click
              const currentBinIndex = bins.findIndex(b => b.type === shape.type);
              handleDrop(shape.id, shape.type);
            }}
          >
            <div className={`shape-inner ${shape.type}`}></div>
            <div className="shape-label">{shape.type}</div>
          </div>
        ))}
      </div>

      <div className="instructions">
        <h3>How to Play:</h3>
        <ol>
          <li>Drag shapes to the matching bins</li>
          <li>Circles go in circle bin, squares in square bin, etc.</li>
          <li>Get all 6 correct to win!</li>
          <li>Click shapes if drag doesn't work (simplified version)</li>
        </ol>
      </div>
    </div>
  );
};

export default ShapeSorterGame;