import { describe, expect, it } from "vitest";

import {
  bootstrapCI,
  cramersV,
  etaSquaredOneWay,
  mean,
  median,
  mulberry32,
  percentile,
  twoWayAnova,
  variance,
} from "../stats";

describe("mean/variance/percentile — no division by zero", () => {
  it("returns 0 for empty input instead of NaN", () => {
    expect(mean([])).toBe(0);
    expect(variance([])).toBe(0);
    expect(percentile([], 0.5)).toBe(0);
    expect(median([])).toBe(0);
  });

  it("computes correctly for a known sample", () => {
    expect(mean([1, 2, 3])).toBe(2);
    // median() is percentile(0.5) using nearest-rank selection (Math.round),
    // not linear interpolation between the two middle values — that's the
    // real, intentional behavior already relied upon throughout analyze.ts
    // (medianFinalScoreRange, medianPlus0Range, etc. in the published audit).
    // For [1,2,3,4]: index = round((4-1)*0.5) = round(1.5) = 2 -> value 3.
    expect(median([1, 2, 3, 4])).toBe(3);
  });
});

describe("etaSquaredOneWay", () => {
  it("is 0 when the grouping explains none of the variance", () => {
    const rows = [
      { group: "a", value: 5 },
      { group: "b", value: 5 },
      { group: "a", value: 5 },
      { group: "b", value: 5 },
    ];
    expect(
      etaSquaredOneWay(
        rows,
        (r) => r.group,
        (r) => r.value,
      ),
    ).toBe(0);
  });

  it("is 1 when the grouping explains all of the variance", () => {
    const rows = [
      { group: "a", value: 0 },
      { group: "a", value: 0 },
      { group: "b", value: 10 },
      { group: "b", value: 10 },
    ];
    expect(
      etaSquaredOneWay(
        rows,
        (r) => r.group,
        (r) => r.value,
      ),
    ).toBeCloseTo(1, 10);
  });

  it("does not throw or divide by zero on a single-row input", () => {
    const rows = [{ group: "a", value: 5 }];
    expect(
      etaSquaredOneWay(
        rows,
        (r) => r.group,
        (r) => r.value,
      ),
    ).toBe(0);
  });
});

describe("twoWayAnova", () => {
  it("decomposes sums of squares that add up to the total for a balanced design", () => {
    // This is the shape of the real audit grid (9 parties x 8 agents x 60
    // seeds, every cell equal-sized) — the case the published eta-squared
    // figures in AUDIT_POST_CORRECTIONS.md actually rely on.
    const rows = [
      { a: "x", b: "1", value: 1 },
      { a: "x", b: "1", value: 3 },
      { a: "x", b: "2", value: 2 },
      { a: "x", b: "2", value: 4 },
      { a: "y", b: "1", value: 5 },
      { a: "y", b: "1", value: 7 },
      { a: "y", b: "2", value: 8 },
      { a: "y", b: "2", value: 10 },
    ];
    const result = twoWayAnova(
      rows,
      (r) => r.a,
      (r) => r.b,
      (r) => r.value,
    );
    expect(result.balanced).toBe(true);
    const reconstructed =
      result.ssFactorA + result.ssFactorB + result.ssInteraction + result.ssResidual;
    expect(reconstructed).toBeCloseTo(result.ssTotal, 6);
    expect(
      result.etaSquaredA +
        result.etaSquaredB +
        result.etaSquaredInteraction +
        result.etaSquaredResidual,
    ).toBeCloseTo(1, 6);
  });

  it("flags an unbalanced design instead of silently reporting a broken decomposition", () => {
    // Unequal cell sizes: the marginal SS(A) and SS(B) are not orthogonal
    // and can jointly exceed ssCells, which would make a naive "interaction"
    // negative. The function clamps that to 0 (never reports negative SS)
    // but must report `balanced: false` so callers know the four SS
    // components no longer sum exactly to ssTotal.
    const rows = [
      { a: "x", b: "1", value: 1 },
      { a: "x", b: "1", value: 2 },
      { a: "x", b: "2", value: 3 },
      { a: "y", b: "1", value: 4 },
      { a: "y", b: "2", value: 5 },
      { a: "y", b: "2", value: 9 },
    ];
    const result = twoWayAnova(
      rows,
      (r) => r.a,
      (r) => r.b,
      (r) => r.value,
    );
    expect(result.balanced).toBe(false);
    expect(result.ssInteraction).toBeGreaterThanOrEqual(0);
    expect(result.ssResidual).toBeGreaterThanOrEqual(0);
  });
});

describe("cramersV", () => {
  it("is 0 for independent categorical variables", () => {
    const rows = [
      { a: "x", b: "1" },
      { a: "x", b: "2" },
      { a: "y", b: "1" },
      { a: "y", b: "2" },
    ];
    expect(
      cramersV(
        rows,
        (r) => r.a,
        (r) => r.b,
      ),
    ).toBeCloseTo(0, 6);
  });

  it("does not throw on a single-category input (division-by-zero guard)", () => {
    const rows = [
      { a: "x", b: "1" },
      { a: "x", b: "1" },
    ];
    expect(() =>
      cramersV(
        rows,
        (r) => r.a,
        (r) => r.b,
      ),
    ).not.toThrow();
  });

  it("approaches 1 for a fully deterministic relationship", () => {
    const rows = [
      { a: "x", b: "1" },
      { a: "x", b: "1" },
      { a: "y", b: "2" },
      { a: "y", b: "2" },
    ];
    expect(
      cramersV(
        rows,
        (r) => r.a,
        (r) => r.b,
      ),
    ).toBeCloseTo(1, 6);
  });
});

describe("bootstrapCI", () => {
  it("is deterministic for a fixed seed (same seed -> same interval)", () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ value: i % 5 }));
    const statistic = (sample: typeof rows) => mean(sample.map((r) => r.value));
    const a = bootstrapCI(rows, statistic, 100, 7);
    const b = bootstrapCI(rows, statistic, 100, 7);
    expect(a).toEqual(b);
  });

  it("brackets the point estimate within a reasonable range", () => {
    const rows = Array.from({ length: 200 }, (_, i) => ({ value: i % 2 === 0 ? 0 : 10 }));
    const statistic = (sample: typeof rows) => mean(sample.map((r) => r.value));
    const result = bootstrapCI(rows, statistic, 300, 1);
    expect(result.lower).toBeLessThanOrEqual(result.estimate + 1e-9);
    expect(result.upper).toBeGreaterThanOrEqual(result.estimate - 1e-9);
  });
});

describe("mulberry32", () => {
  it("is a deterministic seeded generator producing values in [0, 1)", () => {
    const rngA = mulberry32(42);
    const rngB = mulberry32(42);
    const sequenceA = [rngA(), rngA(), rngA()];
    const sequenceB = [rngB(), rngB(), rngB()];
    expect(sequenceA).toEqual(sequenceB);
    for (const value of sequenceA) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
