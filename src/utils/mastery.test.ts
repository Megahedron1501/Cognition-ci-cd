import { Program, SavedSession, Trial } from '../types/session';
import { currentStreak, isIndependentCorrect, percentIndependent, targetsMeetingCriterion } from './mastery';

const trial = (overrides: Partial<Trial> = {}): Trial => ({
  round: 1,
  category: 'color',
  target: 'red',
  itemClicked: 'Red Circle',
  correct: true,
  promptLevel: 'I',
  difficulty: 'easy',
  responseTimeMs: 500,
  attempts: 1,
  timestamp: 0,
  labelsShown: false,
  fieldSize: 4,
  instructionSpoken: true,
  programId: 'p1',
  ...overrides,
});

const session = (startedAt: number, trials: Trial[]): SavedSession => ({
  id: `s${startedAt}`,
  clientId: 'c1',
  tool: 'sortByCategories',
  startedAt,
  endedAt: startedAt,
  completed: true,
  trials,
});

const program: Program = {
  id: 'p1',
  clientId: 'c1',
  category: 'color',
  targets: [{ word: 'red', status: 'acquisition' }],
  difficulty: 'easy',
  trialsPerSession: 10,
  criterion: { percent: 80, sessions: 3 },
  events: [],
};

// A session with `correct` of `total` independent correct trials of red.
const redSession = (startedAt: number, correct: number, total: number, overrides: Partial<Trial> = {}) =>
  session(startedAt, Array.from({ length: total }, (_, i) => trial({ correct: i < correct, ...overrides })));

describe('isIndependentCorrect', () => {
  test('requires correct, no prompt, and no text labels', () => {
    expect(isIndependentCorrect(trial())).toBe(true);
    expect(isIndependentCorrect(trial({ correct: false }))).toBe(false);
    expect(isIndependentCorrect(trial({ promptLevel: 'G' }))).toBe(false);
    expect(isIndependentCorrect(trial({ labelsShown: true }))).toBe(false);
  });
});

describe('percentIndependent', () => {
  test('handles no trials and rounds', () => {
    expect(percentIndependent([])).toBe(0);
    expect(percentIndependent([trial(), trial(), trial({ correct: false })])).toBe(67);
  });
});

describe('targetsMeetingCriterion', () => {
  test('flags a target only after the full number of sessions', () => {
    const two = [redSession(1, 5, 5), redSession(2, 5, 5)];
    expect(targetsMeetingCriterion(program, two)).toEqual([]);
    expect(targetsMeetingCriterion(program, [...two, redSession(3, 4, 5)])).toEqual(['red']);
  });

  test('a session below criterion breaks the streak', () => {
    const sessions = [redSession(1, 5, 5), redSession(2, 2, 5), redSession(3, 5, 5), redSession(4, 5, 5)];
    expect(targetsMeetingCriterion(program, sessions)).toEqual([]);
    expect(currentStreak(program, sessions, 'red')).toBe(2);
  });

  test('sessions with too few trials of the target neither count nor break the streak', () => {
    const sessions = [redSession(1, 5, 5), redSession(2, 0, 1), redSession(3, 5, 5)];
    expect(currentStreak(program, sessions, 'red')).toBe(2);
    expect(targetsMeetingCriterion(program, sessions)).toEqual([]);
  });

  test('prompted, labeled, off-program, and other-difficulty trials do not count', () => {
    const count = (overrides: Partial<Trial>) =>
      targetsMeetingCriterion(program, [1, 2, 3].map(t => redSession(t, 5, 5, overrides)));
    expect(count({})).toEqual(['red']);
    expect(count({ promptLevel: 'V' })).toEqual([]);
    expect(count({ labelsShown: true })).toEqual([]);
    expect(count({ programId: undefined })).toEqual([]);
    expect(count({ difficulty: 'hard' })).toEqual([]);
  });

  test('uses session order, not array order', () => {
    const sessions = [redSession(3, 0, 5), redSession(1, 5, 5), redSession(2, 5, 5)];
    expect(currentStreak(program, sessions, 'red')).toBe(0);
  });

  test('only flags targets still in acquisition', () => {
    const inMaintenance: Program = { ...program, targets: [{ word: 'red', status: 'maintenance' }] };
    expect(targetsMeetingCriterion(inMaintenance, [1, 2, 3].map(t => redSession(t, 5, 5)))).toEqual([]);
  });
});
