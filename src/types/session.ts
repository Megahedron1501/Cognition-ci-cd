// Saved-data model: clients, sessions, and treatment programs. Everything here
// is stored on the device (see utils/sessionStore.ts). Clients are identified
// only by a short code, never a name.

import { PromptLevel } from './promptLevel';

export type Category = 'color' | 'shape' | 'animal' | 'size';
export type Difficulty = 'easy' | 'medium' | 'hard';

// One DTT-style trial per round, scored on the FIRST response only. Clicks
// after an error are error correction, not new trials - they're counted in
// `attempts` but never change `correct`.
export interface Trial {
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
  programId?: string; // set when this trial ran under a program; only these count toward mastery
}

export interface Client {
  id: string;
  code: string;
}

export interface SavedSession {
  id: string;
  clientId: string;
  tool: 'sortByCategories';
  startedAt: number;
  endedAt: number;
  completed: boolean; // false if it ended before all planned trials ran
  trials: Trial[];
}

// Teaching = acquisition. Mastered targets stay in rotation as maintenance.
export type TargetStatus = 'acquisition' | 'maintenance' | 'onHold';

export interface ProgramTarget {
  word: string;
  status: TargetStatus;
}

export interface MasteryCriterion {
  percent: number; // minimum independent correct, 0-100
  sessions: number; // consecutive sessions at or above `percent`
}

// A change to the program, drawn as a phase change line on the graph.
export interface PhaseEvent {
  at: number;
  label: string;
  target?: string; // only applies to this target; absent means the whole program
}

export interface Program {
  id: string;
  clientId: string;
  category: Category;
  targets: ProgramTarget[];
  difficulty: Difficulty;
  trialsPerSession: number;
  criterion: MasteryCriterion;
  events: PhaseEvent[];
}

export interface CognitionData {
  version: 1;
  clients: Client[];
  sessions: SavedSession[];
  programs: Program[];
}
