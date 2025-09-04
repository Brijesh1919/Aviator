let roundCounter = 0;

// Generates a pseudo-random crash point with a heavy tail (common in crash games)
// Distribution is arbitrary here for demo purposes.
export function generateCrashPoint() {
  roundCounter++;
  const r = Math.random();
  // heavier tail: invert some probability; clamp to max 100x for sanity
  const value = Math.min(100, (1 / (1 - r)) ** 0.35 + 0.9); // >1
  return { value: +value.toFixed(2), roundId: roundCounter };
}
