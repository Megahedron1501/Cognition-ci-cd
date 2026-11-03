import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SortByCategories.css';
import { playSound as playAudioFile, speak } from '../utils/sound';
import {
  PromptLevel,
  PROMPT_LEVELS,
  DEFAULT_PROMPT_LEVEL,
  promptLabel,
} from '../types/promptLevel';
import { toCsv, downloadCsv } from '../utils/csv';

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

// One DTT-style trial per round, scored on the FIRST response only. Clicks
// after an error are error correction, not new trials - they're counted in
// `attempts` but never change `correct`. This is invisible to the player -
// it only surfaces in the clinician-facing summary once the session ends.
interface Trial {
  round: number;
  category: Category;
  target: string;
  itemClicked: string; // first response
  correct: boolean; // first response was correct (at whatever prompt level)
  promptLevel: PromptLevel; // prompt in effect at the first response
  difficulty: Difficulty;
  responseTimeMs: number; // latency to first response
  attempts: number; // total clicks until the correct item, including the first
  timestamp: number; // when the first response happened (epoch ms)
  labelsShown: boolean; // text labels on the choices act as a textual prompt
}

// Targets per category. Each category draws from a shuffled bag so every
// target comes up once before any repeats (balanced presentation), and the
// same target is never presented twice in a row across a bag boundary.
const TARGETS: Partial<Record<Category, string[]>> = {
  color: ['red', 'blue', 'green', 'yellow'],
  shape: ['circle', 'square', 'triangle', 'star'],
  animal: ['Dog', 'Cat', 'Bird', 'Fish'],
};

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// The instruction (SD), shown on screen and spoken aloud.
function instructionFor(category: Category, target: string): string {
  return category === 'color' ? `Touch the ${target} one` : `Touch the ${target}`;
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

  // Trial-by-trial data, for the clinician-facing summary only.
  const [trials, setTrials] = useState<Trial[]>([]);
  const roundStartRef = useRef<number>(Date.now());
  // Whether this round's trial has already been recorded (first response in),
  // and whether the round is finished (correct item found, waiting to advance).
  const trialRecordedRef = useRef(false);
  const roundResolvedRef = useRef(false);

  // Prompt level the clinician is currently delivering. Sticky across trials
  // (prompts usually change gradually), and defaults to Independent so
  // anyone who never opens the panel gets accurate unprompted data.
  const [promptLevel, setPromptLevel] = useState<PromptLevel>(DEFAULT_PROMPT_LEVEL);
  const [showPromptPanel, setShowPromptPanel] = useState(false);

  // Text labels on the choices let a reader match words instead of
  // discriminating the stimulus, so they're off by default.
  const [showLabels, setShowLabels] = useState(false);

  const targetBagsRef = useRef<Partial<Record<Category, string[]>>>({});
  const lastTargetRef = useRef<Partial<Record<Category, string>>>({});

  const drawTarget = (category: Category): string => {
    const pool = TARGETS[category] ?? [];
    let bag = targetBagsRef.current[category] ?? [];
    if (bag.length === 0) {
      bag = shuffle(pool);
      if (bag.length > 1 && bag[0] === lastTargetRef.current[category]) {
        bag.push(bag.shift()!);
      }
    }
    const next = bag.shift()!;
    targetBagsRef.current[category] = bag;
    lastTargetRef.current[category] = next;
    return next;
  };

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
      case 'shape':
      case 'animal':
        newTarget = drawTarget(newCategory);
        filteredItems = itemDatabase.filter(item => item.category === newCategory);
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
    roundStartRef.current = Date.now();
    trialRecordedRef.current = false;
    roundResolvedRef.current = false;
    speak(instructionFor(newCategory, newTarget));
    // drawTarget only touches refs, so it's safe to leave out of the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, difficulty]); // itemDatabase is outside, so not needed here

  // Handle item click - FIXED setRound with functional update
  const handleItemClick = (item: GameItem) => {
    // Ignore extra clicks once the correct item is found (e.g. a double-click),
    // so they can't log phantom attempts or advance the round twice.
    if (roundResolvedRef.current) return;

    const isTarget = targetItems.some(t => t.id === item.id);

    if (!trialRecordedRef.current) {
      trialRecordedRef.current = true;
      setTrials(prev => [...prev, {
        round,
        category: currentCategory,
        target,
        itemClicked: item.name,
        correct: isTarget,
        promptLevel,
        difficulty,
        responseTimeMs: Date.now() - roundStartRef.current,
        attempts: 1,
        timestamp: Date.now(),
        labelsShown: showLabels,
      }]);
    } else {
      setTrials(prev => prev.map((t, i) =>
        i === prev.length - 1 ? { ...t, attempts: t.attempts + 1 } : t
      ));
    }

    if (isTarget) {
      roundResolvedRef.current = true;
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
      // Re-present the choices and the instruction for error correction.
      setTimeout(() => {
        setItems(originalItems);
        speak(instructionFor(currentCategory, target));
      }, 500);
    }
  };

  // Sound effects
  const playSound = (type: 'correct' | 'incorrect' | 'celebration') => {
    if (type === 'correct') {
      playAudioFile('/sounds/coin.mp3', 0.3);
    } else if (type === 'celebration') {
      playAudioFile('/sounds/celebration.mp3', 0.5);
    }
  };

  // Reset game
  const resetGame = () => {
    setScore(0);
    setRound(1);
    setGameComplete(false);
    setMessage('');
    setTrials([]);
  };

  // Trial-level summary for the clinician-facing review - distinct from
  // `score`/`totalRounds`, which only count the final (eventually correct)
  // response per round and ignore wrong attempts along the way.
  // Only a correct first response with no prompt counts as independent.
  const isIndependentCorrect = (t: Trial) => t.correct && t.promptLevel === 'I';
  const independentCorrect = trials.filter(isIndependentCorrect).length;
  const promptedCorrect = trials.filter(t => t.correct && t.promptLevel !== 'I').length;
  const trialAccuracy = trials.length > 0
    ? Math.round((independentCorrect / trials.length) * 100)
    : 0;
  const errorCorrectionTrials = trials.filter(t => !t.correct).length;
  const labeledTrials = trials.filter(t => t.labelsShown).length;
  const promptLevelCounts = PROMPT_LEVELS
    .map(({ code, label }) => ({ code, label, count: trials.filter(t => t.promptLevel === code).length }))
    .filter(p => p.count > 0);
  const avgResponseTimeMs = trials.length > 0
    ? Math.round(trials.reduce((sum, t) => sum + t.responseTimeMs, 0) / trials.length)
    : 0;
  const categoryBreakdown = trials.reduce<Record<string, { correct: number; total: number }>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = { correct: 0, total: 0 };
    acc[t.category].total += 1;
    if (isIndependentCorrect(t)) acc[t.category].correct += 1;
    return acc;
  }, {});

  // Trial-by-trial export for the BCBA. Deliberately has no client name or
  // other identifying info - the RBT files it under the client themselves.
  const exportTrialsCsv = () => {
    const headers = [
      'Timestamp', 'Trial', 'Category', 'Target', 'Prompt Level',
      'First Response', 'Correct', 'Independent', 'Attempts', 'Latency (ms)', 'Difficulty',
      'Labels Shown',
    ];
    // Local time, not UTC, so it matches the session clock when opened in Excel.
    const pad = (n: number) => String(n).padStart(2, '0');
    const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const rows = trials.map(t => [
      `${localDate(new Date(t.timestamp))} ${localTime(new Date(t.timestamp))}`,
      t.round,
      t.category,
      t.target,
      t.promptLevel,
      t.itemClicked,
      t.correct ? 'Y' : 'N',
      isIndependentCorrect(t) ? 'Y' : 'N',
      t.attempts,
      t.responseTimeMs,
      t.difficulty,
      t.labelsShown ? 'Y' : 'N',
    ]);
    const start = new Date(trials[0]?.timestamp ?? Date.now());
    const stamp = `${localDate(start)}_${pad(start.getHours())}${pad(start.getMinutes())}`;
    downloadCsv(`sort-by-categories_${stamp}.csv`, toCsv(headers, rows));
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

  // Render item based on category
  // No visual marking of the correct item - that would be a built-in
  // stimulus prompt on every trial and invalidate "Independent" data.
  const renderItem = (item: GameItem) => {
    switch (currentCategory) {
      case 'color':
        return (
          <div 
            className="game-item color-item"
            style={{ backgroundColor: item.color }}
            title={showLabels ? item.name : undefined}
          >
            {showLabels && <div className="item-label">{item.color.toUpperCase()}</div>}
          </div>
        );
        
      case 'shape':
        return (
          <div 
            className="game-item shape-item"
            style={{ 
              backgroundColor: item.color,
              clipPath: getShapeClipPath(item.shape || 'circle')
            }}
            title={showLabels ? item.name : undefined}
          >
            {showLabels && <div className="item-label">{item.shape?.toUpperCase()}</div>}
          </div>
        );
        
      case 'animal':
        return (
          <div 
            className="game-item animal-item"
            style={{ backgroundColor: item.color }}
            title={showLabels ? item.name : undefined}
          >
            {showLabels && <div className="item-label">{item.name.toUpperCase()}</div>}
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

      <div className="prompt-panel-wrapper">
        <button
          className="prompt-toggle-button"
          onClick={() => setShowPromptPanel(!showPromptPanel)}
        >
          📋 Prompt Level: {promptLabel(promptLevel)}
        </button>
        <button
          className="prompt-toggle-button labels-toggle-button"
          onClick={() => setShowLabels(!showLabels)}
          title="Text labels let readers match words instead of the picture/color - recorded in the data when on"
        >
          🏷️ Text Labels: {showLabels ? 'On' : 'Off'}
        </button>
        {showPromptPanel && (
          <div className="prompt-panel">
            <div className="prompt-buttons">
              {PROMPT_LEVELS.map(({ code, label }) => (
                <button
                  key={code}
                  className={`prompt-btn ${promptLevel === code ? 'active' : ''}`}
                  onClick={() => setPromptLevel(code)}
                  title={label}
                >
                  {code}
                </button>
              ))}
            </div>
            <p className="prompt-note">
              Select the prompt you're giving before the learner responds. It stays selected until you change it.
            </p>
          </div>
        )}
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
            <button onClick={resetGame} className="play-again-btn">
              🔄 Play Again
            </button>
          </div>

          <div className="clinician-summary">
            <h3>💡 For Clinician Review</h3>
            <p>
              Independent correct: <strong>{trialAccuracy}%</strong> ({independentCorrect}/{trials.length} trials)
            </p>
            <p>Prompted correct: <strong>{promptedCorrect}</strong></p>
            <p>Incorrect first response (error correction): <strong>{errorCorrectionTrials}</strong></p>
            <p>Average latency to first response: <strong>{avgResponseTimeMs}ms</strong></p>
            {labeledTrials > 0 && (
              <p className="labels-warning">
                ⚠️ Text labels were on for {labeledTrials}/{trials.length} trials - the learner may have matched words rather than identifying the stimulus.
              </p>
            )}

            <h4>Trials by prompt level</h4>
            <ul>
              {promptLevelCounts.map(p => (
                <li key={p.code}>{p.label} ({p.code}): {p.count}</li>
              ))}
            </ul>

            <h4>Independent correct by category</h4>
            <ul>
              {Object.entries(categoryBreakdown).map(([category, stats]) => (
                <li key={category}>
                  {category}: {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
                </li>
              ))}
            </ul>

            <h4>Trial-by-trial</h4>
            <table className="trial-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Target</th>
                  <th>Prompt</th>
                  <th>1st response</th>
                  <th>Attempts</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {trials.map(t => (
                  <tr key={t.round}>
                    <td>{t.round}</td>
                    <td>{t.target}</td>
                    <td>{t.promptLevel}</td>
                    <td>{t.correct ? '+' : '−'}</td>
                    <td>{t.attempts}</td>
                    <td>{t.responseTimeMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={exportTrialsCsv} className="export-csv-btn">
              ⬇️ Download CSV
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="game-prompt">
            <h3>{instructionFor(currentCategory, target)}</h3>
            <button
              className="say-again-btn"
              onClick={() => speak(instructionFor(currentCategory, target))}
            >
              🔊 Say it again
            </button>
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