// The trial-by-trial columns shared by the single-session and whole-client CSV exports.

import { Trial } from '../types/session';
import { isIndependentCorrect } from './mastery';

const pad = (n: number) => String(n).padStart(2, '0');

// Local time, not UTC, so it matches the session clock when opened in Excel.
export const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
export const fileStamp = (d: Date) => `${localDate(d)}_${pad(d.getHours())}${pad(d.getMinutes())}`;

export const TRIAL_CSV_HEADERS = [
  'Timestamp', 'Trial', 'Category', 'Target', 'Prompt Level',
  'First Response', 'Correct', 'Independent', 'Attempts', 'Latency (ms)', 'Difficulty',
  'Labels Shown', 'Choices', 'Instruction Spoken', 'In Program',
];

export function trialCsvRow(t: Trial): (string | number)[] {
  const when = new Date(t.timestamp);
  return [
    `${localDate(when)} ${localTime(when)}`,
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
    t.programId ? 'Y' : 'N',
  ];
}
