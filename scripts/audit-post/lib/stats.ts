/** Small, dependency-free statistics helpers for the post-corrections audit. */

export function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
}

export function stddev(values: number[]): number {
  return Math.sqrt(variance(values));
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[index] ?? 0;
}

export function median(values: number[]): number {
  return percentile(values, 0.5);
}

/** One-way eta-squared: share of total sum-of-squares explained by a grouping factor. */
export function etaSquaredOneWay<T>(
  rows: T[],
  groupKey: (row: T) => string,
  value: (row: T) => number,
): number {
  const values = rows.map(value);
  const overall = mean(values);
  const totalSS = values.reduce((sum, v) => sum + (v - overall) ** 2, 0);
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const key = groupKey(row);
    groups.set(key, [...(groups.get(key) ?? []), value(row)]);
  }
  const betweenSS = [...groups.values()].reduce((sum, group) => {
    const groupMean = mean(group);
    return sum + group.length * (groupMean - overall) ** 2;
  }, 0);
  return totalSS === 0 ? 0 : betweenSS / totalSS;
}

export interface TwoWayAnova {
  ssTotal: number;
  ssFactorA: number;
  ssFactorB: number;
  ssInteraction: number;
  ssResidual: number;
  etaSquaredA: number;
  etaSquaredB: number;
  etaSquaredInteraction: number;
  etaSquaredResidual: number;
  partialEtaSquaredA: number;
  partialEtaSquaredB: number;
  /**
   * True when every observed (A,B) cell has the same number of rows. The
   * marginal-means decomposition below only guarantees
   * ssFactorA+ssFactorB+ssInteraction+ssResidual == ssTotal for balanced
   * designs: with unequal cell sizes, the marginal SS(A) and SS(B) are not
   * orthogonal and can jointly exceed ssCells, which would make the
   * "interaction" negative. That negative term is clamped to 0 below so the
   * function never reports a nonsensical negative sum of squares, but the
   * identity no longer holds exactly — callers should treat the four SS
   * components as approximate for any run where `balanced` is false.
   */
  balanced: boolean;
}

/**
 * Two-way ANOVA sum-of-squares decomposition (factor A, factor B, A*B
 * interaction, residual) via marginal-means (Type-I-like) sums of squares.
 * Exact (ssFactorA+ssFactorB+ssInteraction+ssResidual == ssTotal) only for
 * balanced designs (equal cell sizes) — see `balanced` on the result. This
 * is a descriptive decomposition, not a test of significance.
 */
export function twoWayAnova<T>(
  rows: T[],
  factorA: (row: T) => string,
  factorB: (row: T) => string,
  value: (row: T) => number,
): TwoWayAnova {
  const values = rows.map(value);
  const grand = mean(values);
  const ssTotal = values.reduce((sum, v) => sum + (v - grand) ** 2, 0);

  const groupsA = new Map<string, number[]>();
  const groupsB = new Map<string, number[]>();
  const groupsAB = new Map<string, number[]>();
  for (const row of rows) {
    const a = factorA(row);
    const b = factorB(row);
    const v = value(row);
    groupsA.set(a, [...(groupsA.get(a) ?? []), v]);
    groupsB.set(b, [...(groupsB.get(b) ?? []), v]);
    groupsAB.set(`${a}::${b}`, [...(groupsAB.get(`${a}::${b}`) ?? []), v]);
  }
  const ssFactorA = [...groupsA.values()].reduce(
    (sum, g) => sum + g.length * (mean(g) - grand) ** 2,
    0,
  );
  const ssFactorB = [...groupsB.values()].reduce(
    (sum, g) => sum + g.length * (mean(g) - grand) ** 2,
    0,
  );
  const ssCells = [...groupsAB.values()].reduce(
    (sum, g) => sum + g.length * (mean(g) - grand) ** 2,
    0,
  );
  const ssInteraction = Math.max(0, ssCells - ssFactorA - ssFactorB);
  const ssResidual = Math.max(0, ssTotal - ssCells);
  const cellSizes = [...groupsAB.values()].map((g) => g.length);
  const balanced = cellSizes.every((n) => n === cellSizes[0]);

  return {
    ssTotal,
    ssFactorA,
    ssFactorB,
    ssInteraction,
    ssResidual,
    etaSquaredA: ssTotal ? ssFactorA / ssTotal : 0,
    etaSquaredB: ssTotal ? ssFactorB / ssTotal : 0,
    etaSquaredInteraction: ssTotal ? ssInteraction / ssTotal : 0,
    etaSquaredResidual: ssTotal ? ssResidual / ssTotal : 0,
    partialEtaSquaredA: ssFactorA + ssResidual ? ssFactorA / (ssFactorA + ssResidual) : 0,
    partialEtaSquaredB: ssFactorB + ssResidual ? ssFactorB / (ssFactorB + ssResidual) : 0,
    balanced,
  };
}

/** Simple seeded PRNG (mulberry32) for reproducible bootstrap resampling. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bootstrap 95% CI for a scalar statistic computed over resampled rows. */
export function bootstrapCI<T>(
  rows: T[],
  statistic: (sample: T[]) => number,
  iterations: number,
  seed: number,
): { estimate: number; lower: number; upper: number; iterations: number } {
  const rng = mulberry32(seed);
  const estimate = statistic(rows);
  const samples: number[] = [];
  for (let i = 0; i < iterations; i += 1) {
    const resample: T[] = [];
    for (let j = 0; j < rows.length; j += 1) {
      resample.push(rows[Math.floor(rng() * rows.length)]!);
    }
    samples.push(statistic(resample));
  }
  return {
    estimate,
    lower: percentile(samples, 0.025),
    upper: percentile(samples, 0.975),
    iterations,
  };
}

/** Cramer's V: association strength between two categorical variables (0..1). */
export function cramersV<T>(rows: T[], keyA: (row: T) => string, keyB: (row: T) => string): number {
  const cats = new Map<string, Map<string, number>>();
  const totalsA = new Map<string, number>();
  const totalsB = new Map<string, number>();
  let total = 0;
  for (const row of rows) {
    const a = keyA(row);
    const b = keyB(row);
    if (!cats.has(a)) cats.set(a, new Map());
    const inner = cats.get(a)!;
    inner.set(b, (inner.get(b) ?? 0) + 1);
    totalsA.set(a, (totalsA.get(a) ?? 0) + 1);
    totalsB.set(b, (totalsB.get(b) ?? 0) + 1);
    total += 1;
  }
  if (total === 0) return 0;
  let chiSquare = 0;
  for (const [a, aTotal] of totalsA) {
    for (const [b, bTotal] of totalsB) {
      const observed = cats.get(a)?.get(b) ?? 0;
      const expected = (aTotal * bTotal) / total;
      if (expected > 0) chiSquare += (observed - expected) ** 2 / expected;
    }
  }
  const k = Math.min(totalsA.size, totalsB.size);
  if (k <= 1) return 0;
  return Math.sqrt(chiSquare / (total * (k - 1)));
}

export function frequency(values: string[]): Array<{ id: string; count: number }> {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => ({ id, count }));
}
