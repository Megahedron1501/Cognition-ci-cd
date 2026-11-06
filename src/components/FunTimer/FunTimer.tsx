import React, { useState, useEffect, useRef } from 'react';
import './FunTimer.css';
import { playChime, speak } from '../../utils/sound';

// A visual timer a child can enjoy watching. Low floor: tap a time, tap Start.
// High ceiling: custom times and control over the warning and ending sounds,
// since an abrupt alarm can make a transition harder for some learners.

type ThemeId = 'rocket' | 'turtle' | 'train' | 'bubbles' | 'pie';
type Status = 'idle' | 'running' | 'paused' | 'done';

// Journey themes all work the same way: a traveler crosses to a destination.
// `travelerStyle` makes each emoji face its direction of travel (left to right).
const JOURNEYS: Partial<Record<ThemeId, {
  traveler: string;
  destination: string;
  trackClass: string;
  travelerStyle: React.CSSProperties;
}>> = {
  rocket: { traveler: '🚀', destination: '🌙', trackClass: 'track-space', travelerStyle: { transform: 'rotate(45deg)' } },
  turtle: { traveler: '🐢', destination: '🏠', trackClass: 'track-grass', travelerStyle: { transform: 'scaleX(-1)' } },
  train: { traveler: '🚂', destination: '🚉', trackClass: 'track-rails', travelerStyle: { transform: 'scaleX(-1)' } },
};

const THEMES: { id: ThemeId; emoji: string; label: string }[] = [
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'turtle', emoji: '🐢', label: 'Turtle' },
  { id: 'train', emoji: '🚂', label: 'Train' },
  { id: 'bubbles', emoji: '🫧', label: 'Bubbles' },
  { id: 'pie', emoji: '🥧', label: 'Pie' },
];

const MAX_PICKER_MINUTES = 60;
const BUBBLE_COUNT = 12;
const WARNING_MS = 60000;

const formatTime = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const FunTimer: React.FC = () => {
  const [theme, setTheme] = useState<ThemeId>('rocket');
  const [status, setStatus] = useState<Status>('idle');
  const [chosenMs, setChosenMs] = useState(2 * 60000); // what Reset and Again return to
  const [totalMs, setTotalMs] = useState(2 * 60000); // chosenMs plus any added minutes
  const [remainingMs, setRemainingMs] = useState(2 * 60000);

  const [showSettings, setShowSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(2);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [warningOn, setWarningOn] = useState(true);
  const [endSoundOn, setEndSoundOn] = useState(true);

  // Counts down against the clock rather than counting ticks, so the time stays
  // right even if the browser slows timers while this tool or tab is hidden.
  const endAtRef = useRef(0);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (status !== 'running') return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, endAtRef.current - Date.now());
      setRemainingMs(remaining);

      if (remaining > 0 && remaining <= WARNING_MS && !warnedRef.current) {
        warnedRef.current = true;
        if (warningOn) speak('One more minute');
      }
      if (remaining === 0) {
        setStatus('done');
        if (endSoundOn) {
          playChime();
          speak('All done!');
        }
      }
    }, 200);
    return () => clearInterval(timer);
  }, [status, warningOn, endSoundOn]);

  const setDuration = (ms: number) => {
    setChosenMs(ms);
    setTotalMs(ms);
    setRemainingMs(ms);
    setStatus('idle');
  };

  const start = () => {
    endAtRef.current = Date.now() + remainingMs;
    // No warning on a timer that starts with a minute or less left.
    warnedRef.current = remainingMs <= WARNING_MS;
    setStatus('running');
  };

  const pause = () => {
    setRemainingMs(Math.max(0, endAtRef.current - Date.now()));
    setStatus('paused');
  };

  const addMinute = () => {
    endAtRef.current += 60000;
    setTotalMs(t => t + 60000);
    setRemainingMs(r => r + 60000);
    if (remainingMs + 60000 > WARNING_MS) warnedRef.current = false;
  };

  const applyCustomTime = () => {
    const ms = (customMinutes * 60 + customSeconds) * 1000;
    if (ms > 0) {
      setDuration(ms);
      setShowSettings(false);
    }
  };

  const chosenMinutes = Math.floor(chosenMs / 60000);
  const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0;
  const journey = JOURNEYS[theme];
  const poppedBubbles = status === 'done' ? BUBBLE_COUNT : Math.floor(progress * BUBBLE_COUNT);
  const locked = status === 'running' || status === 'paused';

  return (
    <div className="fun-timer">
      <h2>⏰ Fun Timer</h2>

      <div className="theme-picker">
        {THEMES.map(t => (
          <button
            key={t.id}
            className={`theme-btn ${theme === t.id ? 'active' : ''}`}
            onClick={() => setTheme(t.id)}
          >
            <span className="theme-emoji">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className={`timer-stage ${status}`}>
        {journey && (
          <div className={`journey-track ${journey.trackClass}`}>
            <div className="journey-destination">{journey.destination}</div>
            <div className="journey-traveler" style={{ left: `${progress * 78}%` }}>
              <span className="traveler-wiggle">
                <span style={{ display: 'inline-block', ...journey.travelerStyle }}>{journey.traveler}</span>
              </span>
            </div>
          </div>
        )}

        {theme === 'bubbles' && (
          <div className="bubble-field">
            {Array.from({ length: BUBBLE_COUNT }, (_, i) => (
              <div key={i} className={`bubble ${i < poppedBubbles ? 'popped' : ''}`} />
            ))}
          </div>
        )}

        {theme === 'pie' && (
          <div
            className="pie"
            style={{ background: `conic-gradient(#E74C3C ${(1 - progress) * 360}deg, #ECF0F1 0)` }}
          />
        )}

        <div className="timer-readout">{status === 'done' ? '🎉 All done! 🎉' : formatTime(remainingMs)}</div>
      </div>

      <div className="timer-controls">
        {(status === 'idle' || status === 'paused') && (
          <button className="timer-main-btn" onClick={start}>▶️ {status === 'paused' ? 'Keep Going' : 'Start'}</button>
        )}
        {status === 'running' && (
          <button className="timer-main-btn pause" onClick={pause}>⏸️ Pause</button>
        )}
        {status === 'done' && (
          <button className="timer-main-btn" onClick={() => setDuration(chosenMs)}>🔄 Again</button>
        )}
        {locked && (
          <>
            <button className="timer-small-btn" onClick={addMinute}>➕ 1 Minute</button>
            <button className="timer-small-btn" onClick={() => setDuration(chosenMs)}>🔄 Reset</button>
          </>
        )}
      </div>

      {!locked && status !== 'done' && (
        <div className="minute-picker">
          <button
            className="minute-step-btn"
            onClick={() => setDuration((chosenMinutes - 1) * 60000)}
            disabled={chosenMinutes <= 1}
            aria-label="One minute less"
          >
            −
          </button>
          <input
            className="minute-slider"
            type="range"
            min={1}
            max={MAX_PICKER_MINUTES}
            value={Math.min(Math.max(chosenMinutes, 1), MAX_PICKER_MINUTES)}
            onChange={e => setDuration(Number(e.target.value) * 60000)}
            aria-label="Minutes"
          />
          <button
            className="minute-step-btn"
            onClick={() => setDuration((chosenMinutes + 1) * 60000)}
            disabled={chosenMinutes >= MAX_PICKER_MINUTES}
            aria-label="One minute more"
          >
            +
          </button>
        </div>
      )}

      <button className="timer-settings-toggle" onClick={() => setShowSettings(!showSettings)}>
        ⚙️ Settings
      </button>

      {showSettings && (
        <div className="timer-settings">
          <div>
            <label>
              Custom time:{' '}
              <input
                type="number"
                min={0}
                max={120}
                value={customMinutes}
                onChange={e => setCustomMinutes(Math.max(0, Number(e.target.value)))}
                aria-label="Minutes"
              />{' '}
              min{' '}
              <input
                type="number"
                min={0}
                max={59}
                value={customSeconds}
                onChange={e => setCustomSeconds(Math.min(59, Math.max(0, Number(e.target.value))))}
                aria-label="Seconds"
              />{' '}
              sec
            </label>{' '}
            <button onClick={applyCustomTime}>Set</button>
          </div>
          <label>
            <input type="checkbox" checked={warningOn} onChange={e => setWarningOn(e.target.checked)} />{' '}
            Say "One more minute" as a warning
          </label>
          <label>
            <input type="checkbox" checked={endSoundOn} onChange={e => setEndSoundOn(e.target.checked)} />{' '}
            Chime and say "All done!" at the end
          </label>
          <p className="timer-settings-note">The header's Sound button turns all of these off too. Setting a custom time resets the timer.</p>
        </div>
      )}
    </div>
  );
};

export default FunTimer;
