import React, { useState, useEffect } from 'react';
import './BehaviorTracker.css';
import { toCsv, downloadCsv } from '../../utils/csv';

// Behavior data collection for the whole session, running alongside the
// other tools. Low floor: one behavior card with a big +1 button - tap it and
// you're collecting frequency data. High ceiling: multiple behaviors,
// frequency vs. duration measurement, ABC notes, and a CSV export.

type MeasureType = 'frequency' | 'duration';

interface Behavior {
  id: number;
  name: string;
  type: MeasureType;
}

interface FrequencyEvent {
  behaviorId: number;
  time: number;
}

interface DurationEpisode {
  behaviorId: number;
  start: number;
  end: number | null; // null while the episode is still running
}

interface AbcNote {
  behaviorId: number;
  time: number;
  antecedent: string;
  consequence: string;
  notes: string;
}

// Common quick-picks, matching the usual function-based categories so ABC
// data can feed a functional hypothesis later. Free text is always allowed.
const ANTECEDENTS = [
  'Demand placed', 'Denied access', 'Transition', 'Attention diverted',
  'Item removed', 'Alone / no activity', 'Peer interaction',
];
const CONSEQUENCES = [
  'Attention given', 'Demand removed (escape)', 'Item given (tangible)',
  'Planned ignoring', 'Redirected', 'Blocked', 'Verbal reprimand',
];

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const BehaviorTracker: React.FC = () => {
  const [behaviors, setBehaviors] = useState<Behavior[]>([
    { id: 1, name: 'Behavior 1', type: 'frequency' },
  ]);
  const [nextId, setNextId] = useState(2);
  const [frequencyEvents, setFrequencyEvents] = useState<FrequencyEvent[]>([]);
  const [durationEpisodes, setDurationEpisodes] = useState<DurationEpisode[]>([]);
  const [abcNotes, setAbcNotes] = useState<AbcNote[]>([]);

  // Session clock starts on the first recorded event (or the Start button)
  // and freezes when the session is ended.
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [sessionEnd, setSessionEnd] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const [showAbcForm, setShowAbcForm] = useState(false);
  const [abcDraft, setAbcDraft] = useState({ behaviorId: 1, antecedent: '', consequence: '', notes: '' });

  const sessionRunning = sessionStart !== null && sessionEnd === null;
  const hasData = frequencyEvents.length > 0 || durationEpisodes.length > 0 || abcNotes.length > 0;

  // Tick once a second while the session runs, for the clock and running durations.
  useEffect(() => {
    if (!sessionRunning) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sessionRunning]);

  // Nothing is saved yet, so warn before a reload or tab close throws data away.
  useEffect(() => {
    if (!hasData) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasData]);

  const clockEnd = sessionEnd ?? now;
  const elapsedMs = sessionStart !== null ? clockEnd - sessionStart : 0;

  // Starts the clock if needed; returns false if the session has ended.
  const ensureSessionRunning = (): boolean => {
    if (sessionEnd !== null) return false;
    if (sessionStart === null) {
      const t = Date.now();
      setSessionStart(t);
      setNow(t);
    }
    return true;
  };

  // --- Frequency ---
  const recordOccurrence = (behaviorId: number) => {
    if (!ensureSessionRunning()) return;
    setFrequencyEvents(prev => [...prev, { behaviorId, time: Date.now() }]);
  };

  const undoOccurrence = (behaviorId: number) => {
    setFrequencyEvents(prev => {
      const lastIndex = prev.map(e => e.behaviorId).lastIndexOf(behaviorId);
      return lastIndex === -1 ? prev : prev.filter((_, i) => i !== lastIndex);
    });
  };

  // --- Duration ---
  const runningEpisode = (behaviorId: number) =>
    durationEpisodes.find(e => e.behaviorId === behaviorId && e.end === null);

  const toggleDuration = (behaviorId: number) => {
    if (runningEpisode(behaviorId)) {
      const t = Date.now();
      setDurationEpisodes(prev => prev.map(e =>
        e.behaviorId === behaviorId && e.end === null ? { ...e, end: t } : e
      ));
      return;
    }
    if (!ensureSessionRunning()) return;
    setDurationEpisodes(prev => [...prev, { behaviorId, start: Date.now(), end: null }]);
  };

  // --- Behaviors ---
  const addBehavior = () => {
    setBehaviors(prev => [...prev, { id: nextId, name: `Behavior ${nextId}`, type: 'frequency' }]);
    setNextId(nextId + 1);
  };

  const updateBehavior = (id: number, changes: Partial<Behavior>) => {
    setBehaviors(prev => prev.map(b => (b.id === id ? { ...b, ...changes } : b)));
  };

  const behaviorHasData = (id: number) =>
    frequencyEvents.some(e => e.behaviorId === id) ||
    durationEpisodes.some(e => e.behaviorId === id) ||
    abcNotes.some(n => n.behaviorId === id);

  const removeBehavior = (id: number) => {
    setBehaviors(prev => prev.filter(b => b.id !== id));
  };

  const behaviorName = (id: number) => behaviors.find(b => b.id === id)?.name ?? '(removed)';

  // --- Session ---
  const startSession = () => ensureSessionRunning();

  const endSession = () => {
    const t = Date.now();
    // Close any running duration episodes at the session end.
    setDurationEpisodes(prev => prev.map(e => (e.end === null ? { ...e, end: t } : e)));
    setSessionEnd(t);
    setNow(t);
  };

  const newSession = () => {
    if (hasData && !window.confirm('Start a new session? Current data will be cleared - download the CSV first if you need it.')) {
      return;
    }
    setFrequencyEvents([]);
    setDurationEpisodes([]);
    setAbcNotes([]);
    setSessionStart(null);
    setSessionEnd(null);
  };

  // --- ABC ---
  const openAbcForm = (behaviorId?: number) => {
    setAbcDraft({ behaviorId: behaviorId ?? behaviors[0]?.id ?? 1, antecedent: '', consequence: '', notes: '' });
    setShowAbcForm(true);
  };

  const saveAbcNote = () => {
    if (!ensureSessionRunning()) return;
    setAbcNotes(prev => [...prev, { ...abcDraft, time: Date.now() }]);
    setShowAbcForm(false);
  };

  // --- Stats ---
  const countFor = (id: number) => frequencyEvents.filter(e => e.behaviorId === id).length;

  const ratePerHour = (id: number) => {
    const minutes = elapsedMs / 60000;
    return minutes > 0 ? (countFor(id) / minutes) * 60 : 0;
  };

  const totalDurationMs = (id: number) =>
    durationEpisodes
      .filter(e => e.behaviorId === id)
      .reduce((sum, e) => sum + ((e.end ?? clockEnd) - e.start), 0);

  const episodeCount = (id: number) => durationEpisodes.filter(e => e.behaviorId === id).length;

  const percentOfSession = (id: number) =>
    elapsedMs > 0 ? Math.round((totalDurationMs(id) / elapsedMs) * 100) : 0;

  // --- Export ---
  // One row per data point. No client name or identifying info - the RBT
  // files it under the client themselves.
  const exportCsv = () => {
    const sessionTime = (t: number) => (sessionStart !== null ? formatDuration(t - sessionStart) : '');
    const stamp = (t: number) => `${localDate(new Date(t))} ${localTime(new Date(t))}`;
    const headers = [
      'Timestamp', 'Session Time', 'Behavior', 'Measure', 'Value',
      'Antecedent', 'Consequence', 'Notes',
    ];
    const rows: { time: number; row: (string | number)[] }[] = [
      ...frequencyEvents.map(e => ({
        time: e.time,
        row: [stamp(e.time), sessionTime(e.time), behaviorName(e.behaviorId), 'Occurrence', 1, '', '', ''],
      })),
      ...durationEpisodes.map(e => ({
        time: e.start,
        row: [
          stamp(e.start), sessionTime(e.start), behaviorName(e.behaviorId), 'Duration (s)',
          Math.round(((e.end ?? clockEnd) - e.start) / 1000), '', '', e.end === null ? 'still running at export' : '',
        ],
      })),
      ...abcNotes.map(n => ({
        time: n.time,
        row: [stamp(n.time), sessionTime(n.time), behaviorName(n.behaviorId), 'ABC', '', n.antecedent, n.consequence, n.notes],
      })),
    ];
    rows.sort((a, b) => a.time - b.time);
    const start = new Date(sessionStart ?? Date.now());
    const fileStamp = `${localDate(start)}_${pad(start.getHours())}${pad(start.getMinutes())}`;
    downloadCsv(`behavior-data_${fileStamp}.csv`, toCsv(headers, rows.map(r => r.row)));
  };

  return (
    <div className="behavior-tracker">
      <h2>📊 Behavior Data</h2>

      <div className="session-bar">
        <div className="session-clock">
          ⏱️ {formatDuration(elapsedMs)}
          <span className="session-status">
            {sessionStart === null ? 'Not started' : sessionRunning ? 'Recording' : 'Ended'}
          </span>
        </div>
        {sessionStart === null && <button onClick={startSession}>▶️ Start Session</button>}
        {sessionRunning && <button onClick={endSession}>⏹️ End Session</button>}
        {sessionEnd !== null && <button onClick={newSession}>🆕 New Session</button>}
      </div>
      {sessionStart === null && (
        <p className="session-hint">The clock starts automatically on your first tap.</p>
      )}

      <div className="behavior-cards">
        {behaviors.map(b => {
          const running = runningEpisode(b.id);
          const locked = behaviorHasData(b.id);
          return (
            <div key={b.id} className={`behavior-card ${running ? 'running' : ''}`}>
              <input
                className="behavior-name"
                value={b.name}
                onChange={e => updateBehavior(b.id, { name: e.target.value })}
                aria-label="Behavior name"
              />

              {b.type === 'frequency' ? (
                <>
                  <button
                    className="tap-button"
                    onClick={() => recordOccurrence(b.id)}
                    disabled={sessionEnd !== null}
                  >
                    +1
                  </button>
                  <div className="behavior-stat">
                    <strong>{countFor(b.id)}</strong> times
                    {/* Rate over a few seconds is meaningless (1 tap in 4s = 900/hr), so wait a minute. */}
                    {elapsedMs >= 60000 && <span> · {ratePerHour(b.id).toFixed(1)}/hr</span>}
                  </div>
                  <button className="small-button" onClick={() => undoOccurrence(b.id)} disabled={countFor(b.id) === 0}>
                    ↩️ Undo
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`tap-button ${running ? 'stop' : ''}`}
                    onClick={() => toggleDuration(b.id)}
                    disabled={sessionEnd !== null && !running}
                  >
                    {running ? '⏹️ Stop' : '▶️ Start'}
                  </button>
                  <div className="behavior-stat">
                    <strong>{formatDuration(totalDurationMs(b.id))}</strong> total
                    {running && <span> · now {formatDuration(clockEnd - running.start)}</span>}
                  </div>
                  <div className="behavior-substat">
                    {episodeCount(b.id)} {episodeCount(b.id) === 1 ? 'episode' : 'episodes'} · {percentOfSession(b.id)}% of session
                  </div>
                </>
              )}

              <details className="behavior-options">
                <summary>Options</summary>
                <label>
                  Measure:{' '}
                  <select
                    value={b.type}
                    disabled={locked}
                    onChange={e => updateBehavior(b.id, { type: e.target.value as MeasureType })}
                  >
                    <option value="frequency">Frequency (count)</option>
                    <option value="duration">Duration (timed)</option>
                  </select>
                </label>
                {locked && <p className="option-note">Measure is locked once data is recorded.</p>}
                <button className="small-button" onClick={() => openAbcForm(b.id)}>📝 ABC note</button>
                {behaviors.length > 1 && !locked && (
                  <button className="small-button" onClick={() => removeBehavior(b.id)}>🗑️ Remove</button>
                )}
              </details>
            </div>
          );
        })}

        <button className="add-behavior-card" onClick={addBehavior}>
          ➕ Add Behavior
        </button>
      </div>

      <div className="abc-section">
        <button className="abc-toggle" onClick={() => (showAbcForm ? setShowAbcForm(false) : openAbcForm())}>
          📝 ABC Notes ({abcNotes.length})
        </button>

        {showAbcForm && (
          <div className="abc-form">
            <label>
              Behavior:{' '}
              <select
                value={abcDraft.behaviorId}
                onChange={e => setAbcDraft(d => ({ ...d, behaviorId: Number(e.target.value) }))}
              >
                {behaviors.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>

            <div className="abc-field">
              <span>Antecedent (what happened right before):</span>
              <div className="quick-picks">
                {ANTECEDENTS.map(a => (
                  <button
                    key={a}
                    className={`quick-pick ${abcDraft.antecedent === a ? 'active' : ''}`}
                    onClick={() => setAbcDraft(d => ({ ...d, antecedent: a }))}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <input
                value={abcDraft.antecedent}
                onChange={e => setAbcDraft(d => ({ ...d, antecedent: e.target.value }))}
                placeholder="or type your own"
              />
            </div>

            <div className="abc-field">
              <span>Consequence (what happened right after):</span>
              <div className="quick-picks">
                {CONSEQUENCES.map(c => (
                  <button
                    key={c}
                    className={`quick-pick ${abcDraft.consequence === c ? 'active' : ''}`}
                    onClick={() => setAbcDraft(d => ({ ...d, consequence: c }))}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                value={abcDraft.consequence}
                onChange={e => setAbcDraft(d => ({ ...d, consequence: e.target.value }))}
                placeholder="or type your own"
              />
            </div>

            <div className="abc-field">
              <span>Notes (optional):</span>
              <textarea
                value={abcDraft.notes}
                onChange={e => setAbcDraft(d => ({ ...d, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="abc-actions">
              <button onClick={saveAbcNote} disabled={sessionEnd !== null}>💾 Save Note</button>
              <button className="small-button" onClick={() => setShowAbcForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {abcNotes.length > 0 && (
          <table className="abc-table">
            <thead>
              <tr><th>Time</th><th>Behavior</th><th>Antecedent</th><th>Consequence</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {abcNotes.map((n, i) => (
                <tr key={i}>
                  <td>{sessionStart !== null ? formatDuration(n.time - sessionStart) : ''}</td>
                  <td>{behaviorName(n.behaviorId)}</td>
                  <td>{n.antecedent}</td>
                  <td>{n.consequence}</td>
                  <td>{n.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {hasData && (
        <div className="export-section">
          <button className="export-button" onClick={exportCsv}>⬇️ Download CSV</button>
          <p className="export-note">Data isn't saved yet - download before closing or starting a new session.</p>
        </div>
      )}
    </div>
  );
};

export default BehaviorTracker;
