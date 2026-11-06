// Target rotation for discrimination trials. Every target comes up equally per
// cycle, but the order must not be predictable: a learner who can guess the next
// target from the last one can score well without discriminating anything.

export function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const MAX_TRIES = 50;

// `recent` is the targets just presented, oldest first. With 3+ targets, each
// comes up once per bag and none repeats back to back. With exactly 2, forbidding
// repeats would force strict alternation (A B A B), so the bag holds each target
// twice and allows up to two in a row, but never three.
export function buildTargetBag(pool: string[], recent: string[]): string[] {
  if (pool.length <= 1) return [...pool];
  const items = pool.length === 2 ? [...pool, ...pool] : pool;
  const maxRun = pool.length === 2 ? 2 : 1;

  const isValid = (bag: string[]) => {
    const sequence = [...recent.slice(-maxRun), ...bag];
    for (let i = maxRun; i < sequence.length; i++) {
      if (sequence.slice(i - maxRun, i + 1).every(t => t === sequence[i])) return false;
    }
    return true;
  };

  let bag = shuffle(items);
  for (let tries = 0; tries < MAX_TRIES && !isValid(bag); tries++) bag = shuffle(items);
  return bag;
}
