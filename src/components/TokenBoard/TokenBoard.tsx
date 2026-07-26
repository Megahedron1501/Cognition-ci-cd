// TokenBoard.tsx - WITH AUTO-NAVIGATION
import React, { useState, useRef, useEffect } from 'react';
import './TokenBoard.css';
import {
  ReinforcementSchedule,
  createRatioSequence,
  createIntervalSequence,
  describeSchedule,
} from '../../types/reinforcementSchedule';

// 👇 UPDATE THE INTERFACE - Add onAllTokensEarned
interface TokenBoardProps {
  clientName?: string;
  totalTokens?: number;
  initialTokens?: number;
  onAllTokensEarned?: () => void; // 👈 ADD THIS LINE
}

type ScheduleTypeOption = 'FR' | 'VR' | 'FI' | 'VI';

function parseNumberList(input: string): number[] {
  return input
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 1);
}

const TokenBoard: React.FC<TokenBoardProps> = ({
  clientName = 'Client',
  totalTokens: totalTokensProp = 5,
  initialTokens = 0,
  onAllTokensEarned // 👈 ADD THIS PARAMETER
}) => {
  const [tokens, setTokens] = useState(initialTokens);
  const [totalTokens, setTotalTokens] = useState(totalTokensProp);
  const [showSettings, setShowSettings] = useState(false);
  const [tokenGoalInput, setTokenGoalInput] = useState(String(totalTokensProp));

  // Reinforcement schedule: governs WHEN a token is delivered relative to
  // responses/time - separate from totalTokens, which is just the exchange
  // threshold (how many tokens fill the board before trading for a backup reinforcer).
  const [schedule, setSchedule] = useState<ReinforcementSchedule>({ type: 'FR', count: 1 });
  const [scheduleTypeInput, setScheduleTypeInput] = useState<ScheduleTypeOption>('FR');
  const [frCountInput, setFrCountInput] = useState('1');
  const [vrValuesInput, setVrValuesInput] = useState('3,4,5,6,7');
  const [fiDurationInput, setFiDurationInput] = useState('30');
  const [viDurationsInput, setViDurationsInput] = useState('15,25,30,35,45');

  const sequenceRef = useRef<() => number>(() => 1);
  const [threshold, setThreshold] = useState(1);
  const [responsesSinceLastToken, setResponsesSinceLastToken] = useState(0);
  const intervalStartRef = useRef<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isIntervalSchedule = schedule.type === 'FI' || schedule.type === 'VI';

  // Ticks the elapsed-time display once a second while an interval schedule is active.
  useEffect(() => {
    if (!isIntervalSchedule) return;
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - intervalStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isIntervalSchedule, schedule]);

  const applySettings = () => {
    const goal = parseInt(tokenGoalInput, 10);
    if (Number.isNaN(goal) || goal < 1 || goal > 20) return;

    let nextSchedule: ReinforcementSchedule | null = null;
    if (scheduleTypeInput === 'FR') {
      const count = parseInt(frCountInput, 10);
      if (!Number.isNaN(count) && count >= 1) nextSchedule = { type: 'FR', count };
    } else if (scheduleTypeInput === 'VR') {
      const values = parseNumberList(vrValuesInput);
      if (values.length > 0) nextSchedule = { type: 'VR', values };
    } else if (scheduleTypeInput === 'FI') {
      const durationSeconds = parseInt(fiDurationInput, 10);
      if (!Number.isNaN(durationSeconds) && durationSeconds >= 1) {
        nextSchedule = { type: 'FI', durationSeconds };
      }
    } else {
      const durationsSeconds = parseNumberList(viDurationsInput);
      if (durationsSeconds.length > 0) nextSchedule = { type: 'VI', durationsSeconds };
    }
    if (!nextSchedule) return;

    setTotalTokens(goal);
    setTokens(0);
    setSchedule(nextSchedule);

    const seq =
      nextSchedule.type === 'FR' || nextSchedule.type === 'VR'
        ? createRatioSequence(nextSchedule)
        : createIntervalSequence(nextSchedule);
    sequenceRef.current = seq;
    setThreshold(seq());
    setResponsesSinceLastToken(0);
    intervalStartRef.current = Date.now();
    setElapsedSeconds(0);

    setShowSettings(false);
  };

  // Delivers one token directly - the manual override path, independent of the schedule.
  const deliverToken = () => {
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

  // Records a correct response and delivers a token only once the active
  // reinforcement schedule's threshold is met.
  const recordResponse = () => {
    if (tokens >= totalTokens) return;

    if (schedule.type === 'FR' || schedule.type === 'VR') {
      const newCount = responsesSinceLastToken + 1;
      if (newCount >= threshold) {
        deliverToken();
        setResponsesSinceLastToken(0);
        setThreshold(sequenceRef.current());
      } else {
        setResponsesSinceLastToken(newCount);
      }
    } else {
      if (elapsedSeconds >= threshold) {
        deliverToken();
        intervalStartRef.current = Date.now();
        setElapsedSeconds(0);
        setThreshold(sequenceRef.current());
      }
    }
  };

  const resetTokens = () => {
    setTokens(0);
    setResponsesSinceLastToken(0);
    intervalStartRef.current = Date.now();
    setElapsedSeconds(0);
    setThreshold(sequenceRef.current());
  };

  const scheduleProgressText =
    schedule.type === 'FR' || schedule.type === 'VR'
      ? `${responsesSinceLastToken}/${threshold} responses toward next token`
      : `${elapsedSeconds}s elapsed / ${threshold}s needed`;

  // 👇 OPTIONAL: Update the celebration message to indicate what's coming
  return (
    <div className="token-board-container">
      {/* Header */}
      <div className="token-board-header">
        <h1 className="token-board-title">🏅 Digital Token Board</h1>
        <p className="token-board-subtitle">For: <strong>{clientName}</strong> | Goal: {totalTokens} tokens</p>
        <button
          className="settings-toggle-button"
          onClick={() => {
            setTokenGoalInput(String(totalTokens));
            setScheduleTypeInput(schedule.type);
            if (schedule.type === 'FR') setFrCountInput(String(schedule.count));
            if (schedule.type === 'VR') setVrValuesInput(schedule.values.join(','));
            if (schedule.type === 'FI') setFiDurationInput(String(schedule.durationSeconds));
            if (schedule.type === 'VI') setViDurationsInput(schedule.durationsSeconds.join(','));
            setShowSettings(!showSettings);
          }}
        >
          ⚙️ Settings
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <label htmlFor="token-goal-input">Token goal (1-20):</label>
          <input
            id="token-goal-input"
            type="number"
            min={1}
            max={20}
            value={tokenGoalInput}
            onChange={(e) => setTokenGoalInput(e.target.value)}
          />

          <hr />

          <label htmlFor="schedule-type-input">Reinforcement schedule:</label>
          <select
            id="schedule-type-input"
            value={scheduleTypeInput}
            onChange={(e) => setScheduleTypeInput(e.target.value as ScheduleTypeOption)}
          >
            <option value="FR">Fixed Ratio (FR)</option>
            <option value="VR">Variable Ratio (VR)</option>
            <option value="FI">Fixed Interval (FI)</option>
            <option value="VI">Variable Interval (VI)</option>
          </select>

          {scheduleTypeInput === 'FR' && (
            <div className="schedule-fields">
              <label htmlFor="fr-count-input">Reinforce every N responses:</label>
              <input
                id="fr-count-input"
                type="number"
                min={1}
                value={frCountInput}
                onChange={(e) => setFrCountInput(e.target.value)}
              />
            </div>
          )}
          {scheduleTypeInput === 'VR' && (
            <div className="schedule-fields">
              <label htmlFor="vr-values-input">Response counts to cycle (comma-separated):</label>
              <input
                id="vr-values-input"
                type="text"
                value={vrValuesInput}
                onChange={(e) => setVrValuesInput(e.target.value)}
              />
            </div>
          )}
          {scheduleTypeInput === 'FI' && (
            <div className="schedule-fields">
              <label htmlFor="fi-duration-input">Reinforce first response after (seconds):</label>
              <input
                id="fi-duration-input"
                type="number"
                min={1}
                value={fiDurationInput}
                onChange={(e) => setFiDurationInput(e.target.value)}
              />
            </div>
          )}
          {scheduleTypeInput === 'VI' && (
            <div className="schedule-fields">
              <label htmlFor="vi-durations-input">Durations to cycle, seconds (comma-separated):</label>
              <input
                id="vi-durations-input"
                type="text"
                value={viDurationsInput}
                onChange={(e) => setViDurationsInput(e.target.value)}
              />
            </div>
          )}

          <button onClick={applySettings}>Apply</button>
          <p className="settings-note">Changing settings resets current progress.</p>
        </div>
      )}

      {/* Token Display - CIRCLES! */}
      <div className="token-display">
        {Array.from({ length: totalTokens }, (_, i) => i + 1).map((num) => (
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

      {/* Schedule status */}
      <div className="schedule-status">
        <p>Schedule: {describeSchedule(schedule)}</p>
        <p>{scheduleProgressText}</p>
      </div>

      {/* Buttons */}
      <div className="token-buttons">
        <button
          onClick={recordResponse}
          disabled={tokens >= totalTokens}
          className="record-response-button"
        >
          ✅ Record Response
        </button>

        <button
          onClick={deliverToken}
          disabled={tokens >= totalTokens}
          className="add-token-button"
          style={{
            backgroundColor: tokens >= totalTokens ? '#CCCCCC' : '#4CAF50',
            cursor: tokens >= totalTokens ? 'not-allowed' : 'pointer',
          }}
        >
          {tokens >= totalTokens ? '✅ All Tokens Earned!' : '➕ Add Token (Manual)'}
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
      <p className="button-explainer">
        "Record Response" tracks against the reinforcement schedule above; "Add Token" delivers one immediately, bypassing the schedule.
      </p>

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
          <li>✅ Configurable reinforcement schedule (FR/VR/FI/VI)</li>
          <li>🚀 Future: Save progress across sessions</li>
        </ul>
      </div>
    </div>
  );
};

export default TokenBoard;
