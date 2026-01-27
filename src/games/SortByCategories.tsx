import React, { useState, useEffect, useCallback } from 'react';
import './SortByCategories.css';

type Category = 'color' | 'shape' | 'animal' | 'food' | 'clothing';
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameItem {
  id: number;
  name: string;
  color: string;
  shape?: string;
  category: string;
  image?: string;
}

// MOVE itemDatabase OUTSIDE the component
const itemDatabase: GameItem[] = [
  // Colors
  { id: 1, name: 'Red Circle', color: 'red', category: 'color' },
  { id: 2, name: 'Blue Circle', color: 'blue', category: 'color' },
  { id: 3, name: 'Green Circle', color: 'green', category: 'color' },
  { id: 4, name: 'Yellow Circle', color: 'yellow', category: 'color' },
  { id: 5, name: 'Orange Circle', color: 'orange', category: 'color' },
  { id: 6, name: 'Purple Circle', color: 'purple', category: 'color' },
  
  // Shapes
  { id: 7, name: 'Circle', color: 'blue', shape: 'circle', category: 'shape' },
  { id: 8, name: 'Square', color: 'blue', shape: 'square', category: 'shape' },
  { id: 9, name: 'Triangle', color: 'blue', shape: 'triangle', category: 'shape' },
  { id: 10, name: 'Star', color: 'blue', shape: 'star', category: 'shape' },
  { id: 11, name: 'Heart', color: 'blue', shape: 'heart', category: 'shape' },
  
  // Animals
  { id: 12, name: 'Dog', color: 'brown', category: 'animal' },
  { id: 13, name: 'Cat', color: 'gray', category: 'animal' },
  { id: 14, name: 'Bird', color: 'yellow', category: 'animal' },
  { id: 15, name: 'Fish', color: 'orange', category: 'animal' },
];

const SortByCategories: React.FC = () => {
  // Game state
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(10);
  const [message, setMessage] = useState('');
  const [gameComplete, setGameComplete] = useState(false);
  
  // Game configuration
  const [currentCategory, setCurrentCategory] = useState<Category>('color');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [target, setTarget] = useState('');
  
  // Game items
  const [items, setItems] = useState<GameItem[]>([]);
  const [targetItems, setTargetItems] = useState<GameItem[]>([]);

  // Initialize a new round - FIXED with useCallback and proper dependencies
  const startNewRound = useCallback(() => {
    setMessage('');
    
    const categories: Category[] = ['color', 'shape', 'animal'];
    const newCategory = categories[(round - 1) % categories.length];
    setCurrentCategory(newCategory);
    
    let newTarget = '';
    let filteredItems: GameItem[] = [];
    
    switch (newCategory) {
      case 'color':
        newTarget = ['red', 'blue', 'green', 'yellow'][Math.floor(Math.random() * 4)];
        filteredItems = itemDatabase.filter(item => item.category === 'color');
        break;
      case 'shape':
        newTarget = ['circle', 'square', 'triangle', 'star'][Math.floor(Math.random() * 4)];
        filteredItems = itemDatabase.filter(item => item.category === 'shape');
        break;
      case 'animal':
        newTarget = ['Dog', 'Cat', 'Bird', 'Fish'][Math.floor(Math.random() * 4)];
        filteredItems = itemDatabase.filter(item => item.category === 'animal');
        break;
      default:
        newTarget = 'red';
        filteredItems = itemDatabase.filter(item => item.category === 'color');
    }
    
    setTarget(newTarget);
    
    // Select random items based on difficulty
    let numItems = 4;
    if (difficulty === 'medium') numItems = 6;
    if (difficulty === 'hard') numItems = 8;
    
    // Shuffle and select items
    const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, Math.min(numItems, filteredItems.length));
    
    // Ensure at least one target item exists
    const hasTarget = selectedItems.some(item => 
      newCategory === 'color' ? item.color === newTarget :
      newCategory === 'shape' ? item.shape === newTarget :
      newCategory === 'animal' ? item.name === newTarget : false
    );
    
    if (!hasTarget && selectedItems.length > 0) {
      const targetItem = filteredItems.find(item => 
        newCategory === 'color' ? item.color === newTarget :
        newCategory === 'shape' ? item.shape === newTarget :
        newCategory === 'animal' ? item.name === newTarget : false
      );
      
      if (targetItem) {
        const randomIndex = Math.floor(Math.random() * selectedItems.length);
        selectedItems[randomIndex] = targetItem;
      }
    }
    
    setItems(selectedItems);
    
    // Identify target items
    const targets = selectedItems.filter(item => 
      newCategory === 'color' ? item.color === newTarget :
      newCategory === 'shape' ? item.shape === newTarget :
      newCategory === 'animal' ? item.name === newTarget : false
    );
    setTargetItems(targets);
  }, [round, difficulty]); // itemDatabase is outside, so not needed here

  // Handle item click - FIXED setRound with functional update
  const handleItemClick = (item: GameItem) => {
    const isTarget = targetItems.some(t => t.id === item.id);
    
    if (isTarget) {
      playSound('correct');
      setScore(score + 1);
      setMessage('Great job! ✅');
      
      setTimeout(() => {
        if (round < totalRounds) {
          setRound(prevRound => prevRound + 1); // FIX: Use functional update
        } else {
          setGameComplete(true);
          playSound('celebration');
        }
      }, 1000);
    } else {
      playSound('incorrect');
      setMessage('Try again! Look for the ' + target);
      
      const originalItems = [...items];
      setItems([]);
      setTimeout(() => setItems(originalItems), 500);
    }
  };

  // Sound effects
  const playSound = (type: 'correct' | 'incorrect' | 'celebration') => {
    try {
      if (type === 'correct') {
        const audio = new Audio('/sounds/coin.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Silently fail if audio can't play
      } else if (type === 'celebration') {
        const audio = new Audio('/sounds/celebration.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
    } catch (error) {
      // Silently fail
    }
  };

  // Reset game
  const resetGame = () => {
    setScore(0);
    setRound(1);
    setGameComplete(false);
    setMessage('');
  };

  // Change difficulty
  const changeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    resetGame();
  };

  // Initialize on component mount and round change - FIXED
  useEffect(() => {
    if (!gameComplete && round <= totalRounds) {
      startNewRound();
    }
  }, [round, gameComplete, startNewRound, totalRounds]);

  // Get category display text
  const getCategoryText = () => {
    switch (currentCategory) {
      case 'color': return 'COLOR';
      case 'shape': return 'SHAPE';
      case 'animal': return 'ANIMAL';
      default: return 'CATEGORY';
    }
  };

  // Get target display text
  const getPromptText = () => {
    switch (currentCategory) {
      case 'color': return `Touch the ${target} one`;
      case 'shape': return `Touch the ${target}`;
      case 'animal': return `Touch the ${target}`;
      default: return `Find the ${target}`;
    }
  };

  // Render item based on category
  const renderItem = (item: GameItem) => {
    const isTarget = targetItems.some(t => t.id === item.id);
    
    switch (currentCategory) {
      case 'color':
        return (
          <div 
            className={`game-item color-item ${isTarget ? 'target' : ''}`}
            style={{ backgroundColor: item.color }}
            title={item.name}
          >
            <div className="item-label">{item.color.toUpperCase()}</div>
          </div>
        );
        
      case 'shape':
        return (
          <div 
            className={`game-item shape-item ${isTarget ? 'target' : ''}`}
            style={{ 
              backgroundColor: item.color,
              clipPath: getShapeClipPath(item.shape || 'circle')
            }}
            title={item.name}
          >
            <div className="item-label">{item.shape?.toUpperCase()}</div>
          </div>
        );
        
      case 'animal':
        return (
          <div 
            className={`game-item animal-item ${isTarget ? 'target' : ''}`}
            style={{ backgroundColor: item.color }}
            title={item.name}
          >
            <div className="item-label">{item.name.toUpperCase()}</div>
            <div className="animal-emoji">
              {item.name === 'Dog' ? '🐕' : 
               item.name === 'Cat' ? '🐈' : 
               item.name === 'Bird' ? '🐦' : 
               item.name === 'Fish' ? '🐠' : '?'}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Helper for shape clipping
  const getShapeClipPath = (shape: string) => {
    switch (shape) {
      case 'square': return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
      case 'triangle': return 'polygon(50% 0%, 0% 100%, 100% 100%)';
      case 'star': return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      case 'heart': return 'polygon(50% 0%, 100% 35%, 100% 70%, 50% 100%, 0% 70%, 0% 35%)';
      default: return 'circle(50% at 50% 50%)';
    }
  };

  return (
    <div className="sort-by-categories">
      <div className="game-header">
        <h2>🎯 Sort By Categories</h2>
        <div className="game-info">
          <div className="score">Score: <strong>{score}</strong></div>
          <div className="round">Round: <strong>{round}/{totalRounds}</strong></div>
          <div className="category">Category: <strong>{getCategoryText()}</strong></div>
        </div>
      </div>

      <div className="difficulty-selector">
        <h3>Difficulty:</h3>
        <div className="difficulty-buttons">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
            <button
              key={level}
              className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
              onClick={() => changeDifficulty(level)}
            >
              {level.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="difficulty-info">
          {difficulty === 'easy' && '4 choices'}
          {difficulty === 'medium' && '6 choices'}
          {difficulty === 'hard' && '8 choices'}
        </div>
      </div>

      {gameComplete ? (
        <div className="game-complete">
          <div className="celebration">
            <h2>🎉 GAME COMPLETE! 🎉</h2>
            <div className="final-score">
              You scored <strong>{score}</strong> out of <strong>{totalRounds}</strong>!
            </div>
            <div className="accuracy">
              Accuracy: <strong>{Math.round((score / totalRounds) * 100)}%</strong>
            </div>
            <button onClick={resetGame} className="play-again-btn">
              🔄 Play Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="game-prompt">
            <h3>{getPromptText()}</h3>
            <div className="category-badge">
              Looking for: <strong>{target.toUpperCase()}</strong>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('✅') ? 'correct' : 'incorrect'}`}>
              {message}
            </div>
          )}

          <div className={`items-grid ${difficulty}`}>
            {items.map((item) => (
              <div
                key={item.id}
                className="item-container"
                onClick={() => handleItemClick(item)}
              >
                {renderItem(item)}
              </div>
            ))}
          </div>

          <div className="instructions">
            <p>Click on the item that matches the category and target.</p>
            <p>Categories rotate each round: Color → Shape → Animal</p>
          </div>
        </>
      )}
    </div>
  );
};

export default SortByCategories;