import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SortByCategories.css';
import { playSound as playAudioFile, speak, stopSpeaking, isSoundEnabled } from '../utils/sound';
import {
  PromptLevel,
  PROMPT_LEVELS,
  DEFAULT_PROMPT_LEVEL,
  promptLabel,
} from '../types/promptLevel';
import { toCsv, downloadCsv } from '../utils/csv';

type Category = 'color' | 'shape' | 'animal' | 'size' | 'food' | 'clothing';
// Which categories a session runs: one on its own, or the mixed rotation.
type CategoryMode = 'mixed' | 'color' | 'shape' | 'animal' | 'size';
type SizeClass = 'small' | 'medium' | 'big';
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameItem {
  id: number;
  name: string;
  color: string;
  shape?: string;
  category: string;
  image?: string;
  emoji?: string; // size items only
  sizeClass?: SizeClass; // size items only
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
  fieldSize: number; // how many choices were on screen
  instructionSpoken: boolean; // app spoke before the first response; false means the clinician gave it
}

// Targets per category. Each category draws from a shuffled bag so every
// target comes up once before any repeats (balanced presentation), and the
// same target is never presented twice in a row across a bag boundary.
const TARGETS: Partial<Record<Category, string[]>> = {
  color: ['red', 'blue', 'green', 'yellow', 'orange', 'purple'],
  shape: ['circle', 'square', 'triangle', 'star', 'heart', 'rectangle', 'oval'],
  animal: ['Dog', 'Cat', 'Bird', 'Fish'],
  size: ['big', 'large', 'small', 'little', 'medium'],
};

const CATEGORY_MODES: { mode: CategoryMode; label: string }[] = [
  { mode: 'mixed', label: 'MIXED' },
  { mode: 'color', label: 'COLORS' },
  { mode: 'shape', label: 'SHAPES' },
  { mode: 'animal', label: 'ANIMALS' },
  { mode: 'size', label: 'SIZES' },
];

// Synonyms share a size class, so "big" and "large" both mean the largest one.
const SIZE_CLASS_FOR_WORD: Record<string, SizeClass> = {
  big: 'big',
  large: 'big',
  medium: 'medium',
  small: 'small',
  little: 'small',
};
const SIZE_NAMES: Record<SizeClass, string> = { small: 'Small', medium: 'Medium', big: 'Big' };
const SIZE_FONT_PX: Record<SizeClass, number> = { small: 40, medium: 75, big: 120 };
const SIZE_OBJECTS = [
  { name: 'Apple', emoji: '🍎' },
  { name: 'Ball', emoji: '⚽' },
  { name: 'Star', emoji: '⭐' },
  { name: 'Dog', emoji: '🐕' },
  { name: 'Car', emoji: '🚗' },
  { name: 'Flower', emoji: '🌸' },
];

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Exactly one correct answer per trial: one tile per size class, in random
// positions so size never correlates with where the tile sits. Easy is
// small vs. big; medium adds a middle size; hard also uses a different object
// per tile, so the learner has to attend to size and ignore what the object is.
function buildSizeItems(difficulty: Difficulty): GameItem[] {
  const classes: SizeClass[] = difficulty === 'easy' ? ['small', 'big'] : ['small', 'medium', 'big'];
  const objects = shuffle(SIZE_OBJECTS);
  return shuffle(classes).map((sizeClass, i) => {
    const object = difficulty === 'hard' ? objects[i] : objects[0];
    return {
      id: 100 + i,
      name: `${SIZE_NAMES[sizeClass]} ${object.name}`,
      color: '',
      category: 'size',
      emoji: object.emoji,
      sizeClass,
    };
  });
}

function isTargetItem(item: GameItem, category: Category, target: string): boolean {
  switch (category) {
    case 'color': return item.color === target;
    case 'shape': return item.shape === target;
    case 'animal': return item.name === target;
    case 'size': return item.sizeClass === SIZE_CLASS_FOR_WORD[target];
    default: return false;
  }
}

// The instruction (SD), shown on screen and spoken aloud.
function instructionFor(category: Category, target: string): string {
  return category === 'color' || category === 'size' ? `Touch the ${target} one` : `Touch the ${target}`;
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
  { id: 16, name: 'Rectangle', color: 'blue', shape: 'rectangle', category: 'shape' },
  { id: 17, name: 'Oval', color: 'blue', shape: 'oval', category: 'shape' },
  
  // Animals
  { id: 12, name: 'Dog', color: 'brown', category: 'animal' },
  { id: 13, name: 'Cat', color: 'gray', category: 'animal' },
  { id: 14, name: 'Bird', color: 'yellow', category: 'animal' },
  { id: 15, name: 'Fish', color: 'orange', category: 'animal' },
];

// Real SVG shapes rather than clip-paths: curves like the heart draw properly,
// and rectangle/oval read clearly next to square/circle.
const ShapeIcon: React.FC<{ shape: string; color: string }> = ({ shape, color }) => {
  const paths: Record<string, React.ReactElement> = {
    circle: <circle cx="50" cy="50" r="46" />,
    square: <rect x="8" y="8" width="84" height="84" />,
    triangle: <polygon points="50,6 96,92 4,92" />,
    star: <polygon points="50,4 62,36 96,36 69,57 79,92 50,71 21,92 31,57 4,36 38,36" />,
    heart: <path d="M50 92 C12 62 4 42 4 28 C4 14 15 6 28 6 C38 6 46 12 50 22 C54 12 62 6 72 6 C85 6 96 14 96 28 C96 42 88 62 50 92 Z" />,
    rectangle: <rect x="2" y="24" width="96" height="52" />,
    oval: <ellipse cx="50" cy="50" rx="48" ry="30" />,
  };
  return (
    <svg className="shape-icon" viewBox="0 0 100 100" fill={color} aria-hidden="true">
      {paths[shape] ?? paths.circle}
    </svg>
  );
};

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
  const [categoryMode, setCategoryMode] = useState<CategoryMode>('mixed');
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

  // Spoken instruction on/off, separate from the global sound toggle so the
  // clinician can give the instruction themselves and keep the reward sounds.
  // The ref lets toggling apply right away without restarting the round.
  const [instructionSpoken, setInstructionSpoken] = useState(true);
  const instructionSpokenRef = useRef(true);
  // Whether the app actually spoke during this trial, which is what the data
  // records - the toggle can change partway through a trial.
  const spokenThisTrialRef = useRef(false);

  const sayInstruction = (category: Category, targetWord: string) => {
    if (!instructionSpokenRef.current || !isSoundEnabled()) return;
    spokenThisTrialRef.current = true;
    speak(instructionFor(category, targetWord));
  };

  const toggleInstructionSpoken = () => {
    const next = !instructionSpoken;
    instructionSpokenRef.current = next;
    setInstructionSpoken(next);
    if (!next) stopSpeaking();
  };

  const targetBagsRef = useRef<Partial<Record<Category, string[]>>>({});
  const lastTargetRef = useRef<Partial<Record<Category, string>>>({});

  const drawTarget = (category: Category, pool: string[]): string => {
    // The pool can shrink between rounds (no "medium" on Easy sizes).
    let bag = (targetBagsRef.current[category] ?? []).filter(t => pool.includes(t));
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
    
    // Sizes stay out of the mixed rotation: it's its own program, and a learner
    // not working on it shouldn't get untaught targets mixed into their data.
    const categories: Category[] = categoryMode === 'mixed' ? ['color', 'shape', 'animal'] : [categoryMode];
    const newCategory = categories[(round - 1) % categories.length];
    setCurrentCategory(newCategory);

    const pool = (TARGETS[newCategory] ?? []).filter(t =>
      !(newCategory === 'size' && difficulty === 'easy' && t === 'medium')
    );
    const newTarget = drawTarget(newCategory, pool);
    setTarget(newTarget);

    let selectedItems: GameItem[];
    if (newCategory === 'size') {
      selectedItems = buildSizeItems(difficulty);
    } else {
      const filteredItems = itemDatabase.filter(item => item.category === newCategory);

      // Select random items based on difficulty
      let numItems = 4;
      if (difficulty === 'medium') numItems = 6;
      if (difficulty === 'hard') numItems = 8;

      // Shuffle and select items
      const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
      selectedItems = shuffled.slice(0, Math.min(numItems, filteredItems.length));

      // Ensure at least one target item exists
      if (!selectedItems.some(item => isTargetItem(item, newCategory, newTarget))) {
        const targetItem = filteredItems.find(item => isTargetItem(item, newCategory, newTarget));
        if (targetItem) {
          selectedItems[Math.floor(Math.random() * selectedItems.length)] = targetItem;
        }
      }
    }

    setItems(selectedItems);
    setTargetItems(selectedItems.filter(item => isTargetItem(item, newCategory, newTarget)));
    roundStartRef.current = Date.now();
    trialRecordedRef.current = false;
    roundResolvedRef.current = false;
    spokenThisTrialRef.current = false;
    sayInstruction(newCategory, newTarget);
    // drawTarget and sayInstruction only touch refs, so they're safe to leave out of the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, difficulty, categoryMode]); // itemDatabase is outside, so not needed here

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
        fieldSize: items.length,
        instructionSpoken: spokenThisTrialRef.current,
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
        sayInstruction(currentCategory, target);
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
      'Labels Shown', 'Choices', 'Instruction Spoken',
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
      t.fieldSize,
      t.instructionSpoken ? 'Y' : 'N',
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

  const changeCategoryMode = (newMode: CategoryMode) => {
    setCategoryMode(newMode);
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
      case 'size': return 'SIZE';
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
            title={showLabels ? item.name : undefined}
          >
            <ShapeIcon shape={item.shape || 'circle'} color={item.color} />
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
        
      case 'size': {
        const sizeClass = item.sizeClass || 'medium';
        // The label uses the word being asked for, so "LARGE" isn't labeled "BIG".
        const label = sizeClass === SIZE_CLASS_FOR_WORD[target] ? target : SIZE_NAMES[sizeClass];
        return (
          <div
            className="game-item size-item"
            title={showLabels ? item.name : undefined}
          >
            <span style={{ fontSize: `${SIZE_FONT_PX[sizeClass]}px` }}>{item.emoji}</span>
            {showLabels && <div className="item-label">{label.toUpperCase()}</div>}
          </div>
        );
      }

      default:
        return null;
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
        <button
          className="prompt-toggle-button labels-toggle-button"
          onClick={toggleInstructionSpoken}
          title="Turn off to give the instruction yourself. Reward sounds keep playing."
        >
          {instructionSpoken ? '🗣️ Spoken Instruction: On' : '🔇 Spoken Instruction: Off'}
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
        <h3>Sort by:</h3>
        <div className="difficulty-buttons">
          {CATEGORY_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              className={`difficulty-btn ${categoryMode === mode ? 'active' : ''}`}
              onClick={() => changeCategoryMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>
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
          {categoryMode === 'size' ? (
            <>
              {difficulty === 'easy' && '2 sizes, same picture'}
              {difficulty === 'medium' && '3 sizes, same picture'}
              {difficulty === 'hard' && '3 sizes, different pictures'}
            </>
          ) : (
            <>
              {difficulty === 'easy' && '4 choices'}
              {difficulty === 'medium' && 'Up to 6 choices'}
              {difficulty === 'hard' && 'Up to 8 choices'}
            </>
          )}
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
            {instructionSpoken && (
              <button
                className="say-again-btn"
                onClick={() => sayInstruction(currentCategory, target)}
              >
                🔊 Say it again
              </button>
            )}
            <div className="category-badge">
              Looking for: <strong>{target.toUpperCase()}</strong>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('✅') ? 'correct' : 'incorrect'}`}>
              {message}
            </div>
          )}

          <div className={`items-grid ${currentCategory === 'size' ? (items.length === 2 ? 'easy' : 'medium') : difficulty}`}>
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
            {categoryMode === 'mixed' && <p>Categories rotate each round: Color → Shape → Animal</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default SortByCategories;