import React, { useState } from 'react';
import './EmotionMatcherGame.css';

type Emotion = 'happy' | 'sad' | 'angry' | 'surprised' | 'scared' | 'disgusted';

interface EmotionCard {
  id: number;
  type: Emotion;
  emoji: string;
  word: string;
  x: number;
  y: number;
  matched: boolean;
}

const EmotionMatcherGame: React.FC = () => {
  // Emotions to match
  const emotions: Emotion[] = ['happy', 'sad', 'angry', 'surprised', 'scared', 'disgusted'];
  
  // Emoji mapping
  const emotionEmojis: Record<Emotion, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    surprised: '😲',
    scared: '😨',
    disgusted: '🤢'
  };

  // Word mapping
  const emotionWords: Record<Emotion, string> = {
    happy: 'Happy',
    sad: 'Sad', 
    angry: 'Angry',
    surprised: 'Surprised',
    scared: 'Scared',
    disgusted: 'Disgusted'
  };

  // Initialize game state
  const [emotionCards, setEmotionCards] = useState<EmotionCard[]>([
    { id: 1, type: 'happy', emoji: '😊', word: 'Happy', x: 50, y: 100, matched: false },
    { id: 2, type: 'sad', emoji: '😢', word: 'Sad', x: 200, y: 100, matched: false },
    { id: 3, type: 'angry', emoji: '😠', word: 'Angry', x: 350, y: 100, matched: false },
    { id: 4, type: 'surprised', emoji: '😲', word: 'Surprised', x: 500, y: 100, matched: false },
    { id: 5, type: 'scared', emoji: '😨', word: 'Scared', x: 650, y: 100, matched: false },
    { id: 6, type: 'disgusted', emoji: '🤢', word: 'Disgusted', x: 800, y: 100, matched: false },
  ]);

  const [wordCards, setWordCards] = useState<EmotionCard[]>([
    { id: 7, type: 'happy', emoji: '', word: 'Happy', x: 50, y: 300, matched: false },
    { id: 8, type: 'sad', emoji: '', word: 'Sad', x: 200, y: 300, matched: false },
    { id: 9, type: 'angry', emoji: '', word: 'Angry', x: 350, y: 300, matched: false },
    { id: 10, type: 'surprised', emoji: '', word: 'Surprised', x: 500, y: 300, matched: false },
    { id: 11, type: 'scared', emoji: '', word: 'Scared', x: 650, y: 300, matched: false },
    { id: 12, type: 'disgusted', emoji: '', word: 'Disgusted', x: 800, y: 300, matched: false },
  ]);

  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Match emotions to words!');
  const [draggedCard, setDraggedCard] = useState<number | null>(null);

  const handleDragStart = (cardId: number) => {
    setDraggedCard(cardId);
  };

  const handleDrop = (wordCardId: number) => {
    if (draggedCard === null) return;

    const emotionCard = emotionCards.find(c => c.id === draggedCard);
    const wordCard = wordCards.find(c => c.id === wordCardId);

    if (!emotionCard || !wordCard) return;

    if (emotionCard.type === wordCard.type) {
      // Correct match
      setScore(score + 1);
      setMessage(`🎉 Correct! ${emotionCard.word} = ${emotionCard.emoji}`);
      
      // Play success sound
      new Audio('/sounds/coin.mp3').play();
      
      // Mark as matched
      setEmotionCards(emotionCards.map(c => 
        c.id === emotionCard.id ? { ...c, matched: true } : c
      ));
      setWordCards(wordCards.map(c => 
        c.id === wordCard.id ? { ...c, matched: true } : c
      ));
    } else {
      // Incorrect match
      setMessage('🤔 Try again! Match the emotion to the correct word.');
      new Audio('/sounds/error.mp3').play();
    }
    
    setDraggedCard(null);
  };

  const resetGame = () => {
    setEmotionCards([
      { id: 1, type: 'happy', emoji: '😊', word: 'Happy', x: 50, y: 100, matched: false },
      { id: 2, type: 'sad', emoji: '😢', word: 'Sad', x: 200, y: 100, matched: false },
      { id: 3, type: 'angry', emoji: '😠', word: 'Angry', x: 350, y: 100, matched: false },
      { id: 4, type: 'surprised', emoji: '😲', word: 'Surprised', x: 500, y: 100, matched: false },
      { id: 5, type: 'scared', emoji: '😨', word: 'Scared', x: 650, y: 100, matched: false },
      { id: 6, type: 'disgusted', emoji: '🤢', word: 'Disgusted', x: 800, y: 100, matched: false },
    ]);
    setWordCards([
      { id: 7, type: 'happy', emoji: '', word: 'Happy', x: 50, y: 300, matched: false },
      { id: 8, type: 'sad', emoji: '', word: 'Sad', x: 200, y: 300, matched: false },
      { id: 9, type: 'angry', emoji: '', word: 'Angry', x: 350, y: 300, matched: false },
      { id: 10, type: 'surprised', emoji: '', word: 'Surprised', x: 500, y: 300, matched: false },
      { id: 11, type: 'scared', emoji: '', word: 'Scared', x: 650, y: 300, matched: false },
      { id: 12, type: 'disgusted', emoji: '', word: 'Disgusted', x: 800, y: 300, matched: false },
    ]);
    setScore(0);
    setMessage('Match emotions to words!');
    setDraggedCard(null);
  };

  return (
    <div className="emotion-matcher-game">
      <div className="game-header">
        <h2>🎭 Emotion Matcher</h2>
        <div className="score-board">
          <div className="score">Matches: <strong>{score}</strong> / 6</div>
          <button className="reset-btn" onClick={resetGame}>🔄 Reset Game</button>
        </div>
      </div>

      <div className="message">{message}</div>

      <div className="instructions">
        <h3>How to Play:</h3>
        <p>Drag the emotion emojis to match the correct emotion words!</p>
      </div>

      {/* Emotion Emojis (Top Row) */}
      <div className="emojis-container">
        <h3>Emotions:</h3>
        <div className="cards-row">
          {emotionCards.map(card => (
            <div
              key={card.id}
              className={`emotion-card ${card.matched ? 'matched' : ''}`}
              style={{ left: `${card.x}px`, top: `${card.y}px` }}
              draggable={!card.matched}
              onDragStart={() => !card.matched && handleDragStart(card.id)}
            >
              <div className="emoji">{card.emoji}</div>
              {!card.matched && <div className="drag-hint">Drag me!</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Emotion Words (Bottom Row) */}
      <div className="words-container">
        <h3>Match To:</h3>
        <div className="cards-row">
          {wordCards.map(card => (
            <div
              key={card.id}
              className={`word-card ${card.matched ? 'matched' : ''}`}
              style={{ left: `${card.x}px`, top: `${card.y}px` }}
              onDragOver={(e) => !card.matched && e.preventDefault()}
              onDrop={() => !card.matched && handleDrop(card.id)}
            >
              <div className="word">{card.word}</div>
              {!card.matched && <div className="drop-hint">Drop here</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="emotion-guide">
        <h4>Emotion Guide:</h4>
        <div className="guide-grid">
          {emotions.map(emotion => (
            <div key={emotion} className="guide-item">
              <span className="guide-emoji">{emotionEmojis[emotion]}</span>
              <span className="guide-word">{emotionWords[emotion]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionMatcherGame;