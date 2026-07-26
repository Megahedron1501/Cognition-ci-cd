// Reinforcement schedule data model.
//
// Ratio schedules trigger reinforcement based on number of responses;
// interval schedules trigger it based on elapsed time. Fixed schedules use
// one constant value. Variable schedules are defined by an explicit list of
// values whose mean equals the nominal schedule (e.g. VR5 = [3,4,5,6,7]),
// matching how VR/VI are formally defined in ABA practice — this guarantees
// the true average over a full cycle, rather than approximating it with
// pure random draws that could drift within a short session.

export type FixedRatioSchedule = {
  type: 'FR';
  count: number; // reinforce every `count` responses
};

export type VariableRatioSchedule = {
  type: 'VR';
  values: number[]; // response counts to cycle through unpredictably, e.g. [3,4,5,6,7] averages to 5
};

export type FixedIntervalSchedule = {
  type: 'FI';
  durationSeconds: number; // reinforce the first response after this much time
};

export type VariableIntervalSchedule = {
  type: 'VI';
  durationsSeconds: number[]; // durations to cycle through unpredictably, e.g. [15,25,30,35,45] averages to 30s
};

export type ReinforcementSchedule =
  | FixedRatioSchedule
  | VariableRatioSchedule
  | FixedIntervalSchedule
  | VariableIntervalSchedule;

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Returns a function that yields the next schedule threshold each time it's called.
// For fixed schedules this always returns the same value. For variable schedules
// it shuffles the full value list into a queue and works through it before
// reshuffling, so every value in the set is used exactly once per cycle -
// guaranteeing the schedule's true average rather than approximating it.
function createSequence(values: number[]): () => number {
  let queue: number[] = [];
  return () => {
    if (queue.length === 0) {
      queue = shuffle(values);
    }
    return queue.shift()!;
  };
}

export function createRatioSequence(schedule: FixedRatioSchedule | VariableRatioSchedule): () => number {
  return schedule.type === 'FR' ? () => schedule.count : createSequence(schedule.values);
}

export function createIntervalSequence(
  schedule: FixedIntervalSchedule | VariableIntervalSchedule
): () => number {
  return schedule.type === 'FI' ? () => schedule.durationSeconds : createSequence(schedule.durationsSeconds);
}

export function describeSchedule(schedule: ReinforcementSchedule): string {
  switch (schedule.type) {
    case 'FR':
      return schedule.count === 1 ? 'Every response (continuous)' : `Every ${schedule.count} responses`;
    case 'VR':
      return `Cycles ${schedule.values.join(', ')} responses (averages ${average(schedule.values).toFixed(1)})`;
    case 'FI':
      return `First response after ${schedule.durationSeconds}s`;
    case 'VI':
      return `Cycles ${schedule.durationsSeconds.join(', ')}s (averages ${average(
        schedule.durationsSeconds
      ).toFixed(1)}s)`;
  }
}
