// Partial Mines multiplier table for a 25-tile board.
// Provided examples are included exactly. For entries not present here we
// fall back to a conservative formula (safe/(safe - diamonds)).
// If you have the full official chart, replace the `table` below with it.

const table = {
  // mines: { diamonds: multiplier }
  1: {
    1: 1.01,
    5: 1.24,
  },
  10: {
    1: 1.59,
  },
  20: {
    1: 4.95,
    5: 475,
  },
};

export function getMultiplierFromTable(mines, diamonds) {
  const m = table[mines];
  if (!m) return undefined;
  return m[diamonds];
}

export function fallbackMultiplier(totalTiles, mines, diamonds) {
  // conservative fallback: ratio of remaining safe tiles
  const safe = totalTiles - mines;
  const denom = safe - diamonds;
  if (denom <= 0) return Number.POSITIVE_INFINITY;
  return safe / denom;
}

export function getMultiplier(totalTiles, mines, diamonds) {
  const fromTable = getMultiplierFromTable(mines, diamonds);
  if (fromTable !== undefined) return fromTable;
  return fallbackMultiplier(totalTiles, mines, diamonds);
}

export default { getMultiplier };
