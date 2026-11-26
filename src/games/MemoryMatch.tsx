import React, { useState, useEffect, useRef } from 'react';
import './MemoryMatch.css';
import { playSound, playChime } from '../utils/sound';
import { shuffle } from '../utils/targetRotation';

// One-player memory game: flip two cards at a time; a matching pair stays face
// up, a mismatch flips back. Deliberately simple for now - no data collection
// or clinical settings until the BCBA weighs in on what it should target.

interface Card {
  id: number;
  face: string;
  label: string;
  matched: boolean;
}

const PICTURES = [
  { face: '🐶', label: 'Dog' },
  { face: '🐱', label: 'Cat' },
  { face: '🐸', label: 'Frog' },
  { face: '🦁', label: 'Lion' },
  { face: '🐵', label: 'Monkey' },
  { face: '🐼', label: 'Panda' },
  { face: '🐷', label: 'Pig' },
  { face: '🐰', label: 'Bunny' },
];

const PAIR_OPTIONS = [3, 4, 6, 8];
const DEFAULT_PAIRS = 6;
const MISMATCH_SHOW_MS = 1000; // long enough to see both before they flip back

const dealCards = (pairs: number): Card[] =>
  shuffle(
    shuffle(PICTURES).slice(0, pairs).flatMap((picture, i) => [
      { id: i * 2, ...picture, matched: false },
      { id: i * 2 + 1, ...picture, matched: false },
    ])
  );

const MemoryMatch: React.FC = () => {
  const [pairs, setPairs] = useState(DEFAULT_PAIRS);
  const [cards, setCards] = useState<Card[]>(() => dealCards(DEFAULT_PAIRS));
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [locked, setLocked] = useState(false); // while a mismatch is showing
  const flipBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFlipBackTimer = () => {
    if (flipBackTimerRef.current) clearTimeout(flipBackTimerRef.current);
    flipBackTimerRef.current = null;
  };

  useEffect(() => clearFlipBackTimer, []);

  const allMatched = cards.length > 0 && cards.every(c => c.matched);

  const newGame = (pairCount: number = pairs) => {
    clearFlipBackTimer();
    setPairs(pairCount);
    setCards(dealCards(pairCount));
    setFlippedIds([]);
    setTries(0);
    setLocked(false);
  };

  const handleTap = (card: Card) => {
    if (locked || card.matched || flippedIds.includes(card.id)) return;

    const nowFlipped = [...flippedIds, card.id];
    setFlippedIds(nowFlipped);
    if (nowFlipped.length < 2) return;

    setTries(t => t + 1);
    const [first, second] = nowFlipped.map(id => cards.find(c => c.id === id)!);

    if (first.face === second.face) {
      const updated = cards.map(c => (c.face === first.face ? { ...c, matched: true } : c));
      setCards(updated);
      setFlippedIds([]);
      if (updated.every(c => c.matched)) playChime();
      else playSound('/sounds/coin.mp3', 0.3);
    } else {
      setLocked(true);
      flipBackTimerRef.current = setTimeout(() => {
        setFlippedIds([]);
        setLocked(false);
      }, MISMATCH_SHOW_MS);
    }
  };

  // Square-ish grids: 6 cards in 3 columns, the rest in 4.
  const columns = cards.length <= 6 ? 3 : 4;

  return (
    <div className="memory-match">
      <h2>🃏 Memory Match</h2>

      <div className="memory-controls">
        <span className="memory-label">Pairs:</span>
        {PAIR_OPTIONS.map(n => (
          <button
            key={n}
            className={`memory-pairs-btn ${pairs === n ? 'active' : ''}`}
            onClick={() => newGame(n)}
          >
            {n}
          </button>
        ))}
        <span className="memory-tries">Tries: <strong>{tries}</strong></span>
      </div>

      {allMatched && (
        <div className="memory-win">
          🎉 You found them all! 🎉
          <button className="memory-again-btn" onClick={() => newGame()}>🔄 Play Again</button>
        </div>
      )}

      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {cards.map(card => {
          const faceUp = card.matched || flippedIds.includes(card.id);
          return (
            <button
              key={card.id}
              className={`memory-card ${faceUp ? 'face-up' : ''} ${card.matched ? 'matched' : ''}`}
              onClick={() => handleTap(card)}
              aria-label={faceUp ? card.label : 'Face-down card'}
            >
              <span className="memory-card-inner">
                <span className="memory-card-back">?</span>
                <span className="memory-card-front">{card.face}</span>
              </span>
            </button>
          );
        })}
      </div>

      {!allMatched && (
        <button className="memory-restart-btn" onClick={() => newGame()}>🔀 New Cards</button>
      )}
    </div>
  );
};

export default MemoryMatch;
