import React, { useEffect, useRef, useState } from 'react';
import './Progress.css';
import ProgressGraph, { GraphPhaseLine, GraphPoint } from './ProgressGraph';
import { Category, PhaseEvent, Program, SavedSession, Trial } from '../../types/session';
import {
  deleteClient, deleteSession, exportBackup, getPrograms, getSessions, importBackup, markTargetMastered,
} from '../../utils/sessionStore';
import {
  currentStreak, isIndependentCorrect, MIN_TRIALS_PER_TARGET, percentIndependent, targetsMeetingCriterion,
} from '../../utils/mastery';
import { downloadCsv, toCsv } from '../../utils/csv';
import { fileStamp, localDate, localTime, TRIAL_CSV_HEADERS, trialCsvRow } from '../../utils/sessionCsv';

// Saved sessions for the selected client: the graph BCBAs read, progress toward
// mastery, the session list, and the backup that protects data on this device.

interface ProgressProps {
  clientId: string | null;
  clientCode: string | null;
  onDataChanged: () => void; // clients may have been deleted or restored
}

const CATEGORY_LABELS: Record<Category, string> = {
  color: 'Colors',
  shape: 'Shapes',
  animal: 'Animals',
  size: 'Sizes',
};

const formatWhen = (time: number) => `${localDate(new Date(time))} ${localTime(new Date(time)).slice(0, 5)}`;

const Progress: React.FC<ProgressProps> = ({ clientId, clientCode, onDataChanged }) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    setSessions(clientId ? getSessions(clientId) : []);
    setPrograms(clientId ? getPrograms(clientId) : []);
  };

  // In an effect, not during render: a game closing to open this page saves
  // its trials as it unmounts, and that has to happen before this reads them.
  useEffect(() => {
    reload();
    setCategoryFilter('all');
    setTargetFilter('all');
    setNotice('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const matches = (t: Trial) =>
    (categoryFilter === 'all' || t.category === categoryFilter)
    && (targetFilter === 'all' || t.target === targetFilter);

  const allTrials = sessions.flatMap(s => s.trials);
  const categories = (Object.keys(CATEGORY_LABELS) as Category[]).filter(c => allTrials.some(t => t.category === c));
  const targetOptions = categoryFilter === 'all'
    ? []
    : Array.from(new Set(allTrials.filter(t => t.category === categoryFilter).map(t => t.target))).sort();

  // Sessions with no trials matching the filter drop off the graph entirely,
  // so "Session" on the x-axis means sessions where this was actually run.
  const shownSessions = sessions
    .map(session => ({ session, trials: session.trials.filter(matches) }))
    .filter(row => row.trials.length > 0);

  const points: GraphPoint[] = shownSessions.map((row, i) => ({
    session: i + 1,
    percent: percentIndependent(row.trials),
    independent: row.trials.filter(isIndependentCorrect).length,
    total: row.trials.length,
    date: formatWhen(row.session.startedAt),
  }));

  const filteredProgram = categoryFilter === 'all' ? undefined : programs.find(p => p.category === categoryFilter);

  // Phase lines for the programs in view, grouped when several changes fell
  // between the same two sessions.
  const events: PhaseEvent[] = programs
    .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
    .flatMap(p => p.events)
    .filter(e => targetFilter === 'all' || !e.target || e.target === targetFilter)
    .sort((a, b) => a.at - b.at);

  const afterSessionFor = (at: number) => shownSessions.filter(row => row.session.startedAt < at).length;
  const phaseGroups = new Map<number, PhaseEvent[]>();
  events.forEach(event => {
    const after = afterSessionFor(event.at);
    phaseGroups.set(after, [...(phaseGroups.get(after) ?? []), event]);
  });
  const phaseLines: GraphPhaseLine[] = Array.from(phaseGroups.keys()).map((afterSession, i) => ({
    afterSession,
    number: i + 1,
  }));

  const handleMarkMastered = (program: Program, word: string) => {
    if (markTargetMastered(program, word)) reload();
    else setNotice('That change couldn\'t be saved on this device.');
  };

  const handleDeleteSession = (session: SavedSession) => {
    if (!window.confirm(`Delete the session from ${formatWhen(session.startedAt)}? This can't be undone.`)) return;
    if (deleteSession(session.id)) reload();
  };

  const handleDeleteClient = () => {
    if (!clientId) return;
    const message = `Delete client ${clientCode} and all of their saved sessions and programs? This can't be undone.`;
    if (!window.confirm(message)) return;
    if (deleteClient(clientId)) onDataChanged();
  };

  const handleClientCsv = () => {
    const headers = ['Client', 'Session', ...TRIAL_CSV_HEADERS];
    const rows = sessions.flatMap((session, i) =>
      session.trials.map(t => [clientCode ?? '', i + 1, ...trialCsvRow(t)])
    );
    downloadCsv(`cognition_${clientCode}_${fileStamp(new Date())}.csv`, toCsv(headers, rows));
  };

  const handleBackup = () => {
    const blob = new Blob([exportBackup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cognition-backup_${fileStamp(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // so choosing the same file again still fires
    if (!file) return;
    if (!window.confirm('Restoring replaces ALL clients and sessions on this device with the backup file. Continue?')) return;
    if (importBackup(await file.text())) {
      setNotice('Backup restored.');
      onDataChanged();
      reload();
    } else {
      setNotice('That file isn\'t a valid Cognition backup. Nothing was changed.');
    }
  };

  return (
    <div className="progress-page">
      <h2>📈 Progress{clientCode ? `: ${clientCode}` : ''}</h2>
      {notice && <p className="progress-notice">{notice}</p>}

      {!clientId && (
        <p className="progress-empty">
          Choose or add a client at the top of the page. Sessions in Sort By Categories save to that client and show up here.
        </p>
      )}

      {clientId && sessions.length === 0 && (
        <p className="progress-empty">No saved sessions yet. Play Sort By Categories with this client selected.</p>
      )}

      {sessions.length > 0 && (
        <>
          <div className="progress-filters">
            <label>
              Category:{' '}
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value as Category | 'all'); setTargetFilter('all'); }}
              >
                <option value="all">All</option>
                {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </label>
            {categoryFilter !== 'all' && (
              <label>
                Target:{' '}
                <select value={targetFilter} onChange={e => setTargetFilter(e.target.value)}>
                  <option value="all">All targets</option>
                  {targetOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            )}
          </div>

          <h3 className="progress-graph-title">
            Independent correct: {categoryFilter === 'all' ? 'all categories' : CATEGORY_LABELS[categoryFilter]}
            {targetFilter !== 'all' && `, ${targetFilter}`}
          </h3>
          <ProgressGraph points={points} phaseLines={phaseLines} criterionPercent={filteredProgram?.criterion.percent} />
          {phaseLines.length > 0 && (
            <ol className="phase-legend">
              {Array.from(phaseGroups.values()).map((group, i) => (
                <li key={i}>{group.map(e => e.label).join('; ')} ({formatWhen(group[0].at)})</li>
              ))}
            </ol>
          )}
        </>
      )}

      {programs.length > 0 && (
        <div className="progress-section">
          <h3>Programs</h3>
          {programs.map(program => {
            const ready = targetsMeetingCriterion(program, sessions);
            return (
              <div key={program.id} className="program-summary">
                <h4>
                  {CATEGORY_LABELS[program.category]}: mastery at {program.criterion.percent}% across {program.criterion.sessions} sessions ({program.difficulty})
                </h4>
                <table className="progress-table">
                  <thead><tr><th>Target</th><th>Status</th><th>Sessions in a row</th><th /></tr></thead>
                  <tbody>
                    {program.targets.filter(t => t.status !== 'onHold').map(t => (
                      <tr key={t.word}>
                        <td className="capitalize">{t.word}</td>
                        <td>{t.status === 'acquisition' ? 'Teaching' : 'Mastered (maintenance)'}</td>
                        <td>{t.status === 'acquisition' ? `${Math.min(currentStreak(program, sessions, t.word), program.criterion.sessions)} of ${program.criterion.sessions}` : ''}</td>
                        <td>
                          {ready.includes(t.word) && (
                            <button onClick={() => handleMarkMastered(program, t.word)}>🌟 Mark mastered</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
          <p className="progress-note">
            A session counts toward a target with at least {MIN_TRIALS_PER_TARGET} trials of it, run under the program at its current difficulty.
          </p>
        </div>
      )}

      {shownSessions.length > 0 && (
        <div className="progress-section">
          <h3>Sessions</h3>
          <div className="progress-table-scroll">
            <table className="progress-table">
              <thead>
                <tr><th>#</th><th>Started</th><th>Trials</th><th>Independent</th><th>Prompted</th><th>Incorrect</th><th>Ended early</th><th /></tr>
              </thead>
              <tbody>
                {shownSessions.map((row, i) => (
                  <tr key={row.session.id}>
                    <td>{i + 1}</td>
                    <td>{formatWhen(row.session.startedAt)}</td>
                    <td>{row.trials.length}</td>
                    <td>{percentIndependent(row.trials)}%</td>
                    <td>{row.trials.filter(t => t.correct && !isIndependentCorrect(t)).length}</td>
                    <td>{row.trials.filter(t => !t.correct).length}</td>
                    <td>{row.session.completed ? '' : 'Yes'}</td>
                    <td><button onClick={() => handleDeleteSession(row.session)} aria-label={`Delete session ${i + 1}`}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="progress-section">
        <h3>Your data</h3>
        <p className="progress-note">
          Everything is stored only in this browser on this device. Clearing browser data erases it, so download a backup regularly.
        </p>
        <div className="progress-actions">
          {sessions.length > 0 && <button onClick={handleClientCsv}>⬇️ All of {clientCode}'s trials (CSV)</button>}
          <button onClick={handleBackup}>💾 Back up everything</button>
          <button onClick={() => fileInputRef.current?.click()}>♻️ Restore a backup</button>
          {clientId && <button className="danger" onClick={handleDeleteClient}>🗑️ Delete client {clientCode}</button>}
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleRestore} hidden />
        </div>
      </div>
    </div>
  );
};

export default Progress;
