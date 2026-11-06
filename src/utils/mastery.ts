// Scoring and mastery rules, in one place so the session summary, the graphs,
// the CSV, and the mastery flags can never disagree.

import { Program, SavedSession, Trial } from '../types/session';

// A session with fewer trials of a target than this neither counts toward nor
// breaks that target's streak: 1/1 isn't evidence of 100%.
export const MIN_TRIALS_PER_TARGET = 2;

// Correct first response with no prompt. Text labels are a textual prompt
// (the learner can match words), so a labeled trial is never independent.
export function isIndependentCorrect(trial: Trial): boolean {
  return trial.correct && trial.promptLevel === 'I' && !trial.labelsShown;
}

export function percentIndependent(trials: Trial[]): number {
  if (trials.length === 0) return 0;
  return Math.round((trials.filter(isIndependentCorrect).length / trials.length) * 100);
}

// Only trials run under this program at its current difficulty count: mastery
// at an easier level says nothing about the level now being taught.
function targetPercentsBySession(program: Program, sessions: SavedSession[], word: string): number[] {
  return [...sessions]
    .sort((a, b) => a.startedAt - b.startedAt)
    .map(session => session.trials.filter(t =>
      t.programId === program.id && t.target === word && t.difficulty === program.difficulty
    ))
    .filter(trials => trials.length >= MIN_TRIALS_PER_TARGET)
    .map(percentIndependent);
}

// Targets still in acquisition that have met the criterion. This only flags
// them - moving a target to maintenance is always the clinician's decision.
export function targetsMeetingCriterion(program: Program, sessions: SavedSession[]): string[] {
  const { percent, sessions: required } = program.criterion;
  return program.targets
    .filter(t => t.status === 'acquisition')
    .map(t => t.word)
    .filter(word => {
      const recent = targetPercentsBySession(program, sessions, word).slice(-required);
      return recent.length === required && recent.every(p => p >= percent);
    });
}

// How far along the current streak is, for showing progress toward mastery.
export function currentStreak(program: Program, sessions: SavedSession[], word: string): number {
  const percents = targetPercentsBySession(program, sessions, word);
  let streak = 0;
  for (let i = percents.length - 1; i >= 0 && percents[i] >= program.criterion.percent; i--) streak++;
  return streak;
}
