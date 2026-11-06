import { buildTargetBag } from './targetRotation';

// Runs the rotation the way the game does, keeping the last two targets.
const sequence = (pool: string[], length: number): string[] => {
  const result: string[] = [];
  while (result.length < length) result.push(...buildTargetBag(pool, result.slice(-2)));
  return result.slice(0, length);
};

test('two targets are not strictly alternating, never run three in a row, and stay balanced', () => {
  let sawRepeat = false;
  for (let run = 0; run < 200; run++) {
    const s = sequence(['a', 'b'], 40);
    s.forEach((t, i) => {
      if (i > 0 && s[i - 1] === t) sawRepeat = true;
      if (i > 1) expect(s[i - 2] === t && s[i - 1] === t).toBe(false);
    });
    expect(s.filter(t => t === 'a')).toHaveLength(20);
  }
  expect(sawRepeat).toBe(true);
});

test('session orders vary with two targets', () => {
  const orders = new Set(Array.from({ length: 100 }, () => sequence(['a', 'b'], 6).join('')));
  expect(orders.size).toBeGreaterThan(3);
});

test('three or more targets come up once per cycle and never back to back', () => {
  const pool = ['a', 'b', 'c', 'd'];
  for (let run = 0; run < 200; run++) {
    const s = sequence(pool, 40);
    s.forEach((t, i) => { if (i > 0) expect(s[i - 1]).not.toBe(t); });
    for (let cycle = 0; cycle < 40; cycle += 4) {
      expect(new Set(s.slice(cycle, cycle + 4)).size).toBe(4);
    }
  }
});

test('a single target just repeats', () => {
  expect(sequence(['a'], 3)).toEqual(['a', 'a', 'a']);
});
