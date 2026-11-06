import React, { useState } from 'react';
import { Category, Difficulty, PhaseEvent, Program, ProgramTarget, TargetStatus } from '../types/session';
import { createId } from '../utils/sessionStore';
import { MIN_TRIALS_PER_TARGET } from '../utils/mastery';

// In-app program setup for one client and one category: which targets are being
// taught, how many trials a session runs, and what counts as mastery.

interface ProgramSettingsProps {
  clientId: string | null;
  clientCode: string | null;
  category: Category | null; // null in Mixed, which has no single program
  allTargets: string[];
  program: Program | null;
  currentDifficulty: Difficulty;
  onSave: (program: Program) => void;
  onRemove: (programId: string) => void;
}

const STATUS_LABELS: Record<TargetStatus, string> = {
  acquisition: 'Teaching',
  maintenance: 'Mastered (maintenance)',
  onHold: 'Not running',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value || min));

const ProgramSettings: React.FC<ProgramSettingsProps> = ({
  clientId, clientCode, category, allTargets, program, currentDifficulty, onSave, onRemove,
}) => {
  // Targets added to the game after this program was made show up as Not running.
  const [targets, setTargets] = useState<ProgramTarget[]>(() => allTargets.map(word => ({
    word,
    status: program
      ? program.targets.find(t => t.word === word)?.status ?? 'onHold'
      : 'acquisition',
  })));
  const [difficulty, setDifficulty] = useState<Difficulty>(program?.difficulty ?? currentDifficulty);
  const [trialsPerSession, setTrialsPerSession] = useState(program?.trialsPerSession ?? 10);
  const [percent, setPercent] = useState(program?.criterion.percent ?? 80);
  const [sessions, setSessions] = useState(program?.criterion.sessions ?? 3);

  if (!clientId || !category) {
    return (
      <div className="program-settings">
        <h3>⚙️ Program</h3>
        <p>
          {!clientId && 'Choose a client at the top of the page. '}
          {!category && 'Choose one category under "Sort by" (programs don\'t apply to Mixed). '}
          Then you can set which targets to teach and what counts as mastery.
        </p>
      </div>
    );
  }

  const running = targets.filter(t => t.status !== 'onHold').length;
  const tooFewTrials = running > 0 && trialsPerSession < running * MIN_TRIALS_PER_TARGET;

  // Every real change becomes a phase change line on the graph. A brand new
  // program gets one line marking where it started.
  const changeEvents = (): PhaseEvent[] => {
    const at = Date.now();
    if (!program) return [{ at, label: 'Program started' }];
    const events: PhaseEvent[] = targets
      .filter(t => (program.targets.find(old => old.word === t.word)?.status ?? 'onHold') !== t.status)
      .map(t => ({ at, label: `${t.word}: ${STATUS_LABELS[t.status]}`, target: t.word }));
    if (program.difficulty !== difficulty) events.push({ at, label: `Difficulty: ${difficulty}` });
    return events;
  };

  const handleSave = () => {
    onSave({
      id: program?.id ?? createId(),
      clientId,
      category,
      targets,
      difficulty,
      trialsPerSession,
      criterion: { percent, sessions },
      events: [...(program?.events ?? []), ...changeEvents()],
    });
  };

  return (
    <div className="program-settings">
      <h3>⚙️ {category[0].toUpperCase() + category.slice(1)} program for {clientCode}</h3>

      {targets.map(t => (
        <div key={t.word} className="program-target-row">
          <span>{t.word}</span>
          <select
            value={t.status}
            aria-label={`Status for ${t.word}`}
            onChange={e => setTargets(prev => prev.map(other =>
              other.word === t.word ? { ...other, status: e.target.value as TargetStatus } : other
            ))}
          >
            {(Object.keys(STATUS_LABELS) as TargetStatus[]).map(status => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
      ))}

      <hr />

      <label className="program-field">
        Difficulty
        <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>
      <label className="program-field">
        Trials per session
        <input
          type="number"
          min={1}
          max={50}
          value={trialsPerSession}
          onChange={e => setTrialsPerSession(clamp(Number(e.target.value), 1, 50))}
        />
      </label>
      <label className="program-field">
        Mastery: independent correct (%)
        <input
          type="number"
          min={1}
          max={100}
          value={percent}
          onChange={e => setPercent(clamp(Number(e.target.value), 1, 100))}
        />
      </label>
      <label className="program-field">
        Mastery: consecutive sessions
        <input
          type="number"
          min={1}
          max={20}
          value={sessions}
          onChange={e => setSessions(clamp(Number(e.target.value), 1, 20))}
        />
      </label>

      {running === 0 && <p className="program-warning">Choose at least one target to run.</p>}
      {tooFewTrials && (
        <p className="program-warning">
          ⚠️ {trialsPerSession} trials across {running} targets is under {MIN_TRIALS_PER_TARGET} trials per target,
          so some sessions won't count toward mastery. Run more trials or fewer targets.
        </p>
      )}

      <div className="program-actions">
        <button className="primary" onClick={handleSave} disabled={running === 0}>
          {program ? 'Save Program' : 'Start Program'}
        </button>
        {program && <button onClick={() => onRemove(program.id)}>Stop Program</button>}
      </div>
      <p className="prompt-note">
        Saving restarts the game. Only unprompted, correct first responses count, and text labels count as a prompt.
        A session needs at least {MIN_TRIALS_PER_TARGET} trials of a target to count for that target.
      </p>
    </div>
  );
};

export default ProgramSettings;
