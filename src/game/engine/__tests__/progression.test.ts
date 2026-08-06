import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { computeProgressionMetrics } from "../progression";

describe("computeProgressionMetrics", () => {
  it("gives raw as the plain point delta regardless of margins", () => {
    const { raw } = computeProgressionMetrics({
      startingPolling: 13,
      firstRoundShare: 18.4,
      potentialSupport: 28,
    });
    expect(raw).toBeCloseTo(5.4, 6);
  });

  it("normalizes a full-margin gain to 1 (party reaches exactly its potential)", () => {
    const { normalized } = computeProgressionMetrics({
      startingPolling: 13,
      firstRoundShare: 28,
      potentialSupport: 28,
    });
    expect(normalized).toBeCloseTo(1, 6);
  });

  it("normalizes a half-margin gain to 0.5", () => {
    const { normalized } = computeProgressionMetrics({
      startingPolling: 4.5,
      firstRoundShare: 4.5 + (25 - 4.5) / 2,
      potentialSupport: 25,
    });
    expect(normalized).toBeCloseTo(0.5, 6);
  });

  it("normalizes a full collapse to zero as -1 (downside margin is the starting point itself)", () => {
    const { normalized } = computeProgressionMetrics({
      startingPolling: 13,
      firstRoundShare: 0,
      potentialSupport: 28,
    });
    expect(normalized).toBeCloseTo(-1, 6);
  });

  it("gives a comparable normalized score to two structurally different parties that each captured half their achievable margin", () => {
    // A strong party (large starting base, modest margin) and a weak outsider
    // (small starting base, large margin) each convert half their realistic
    // upside — this is the whole point of P1: the raw delta would show the
    // strong party's absolute point gain as much larger, but the normalized
    // metric should treat "captured half of what was realistically
    // achievable" the same way for both.
    const strongParty = computeProgressionMetrics({
      startingPolling: 14,
      firstRoundShare: 14 + (31 - 14) / 2,
      potentialSupport: 31,
    });
    const outsider = computeProgressionMetrics({
      startingPolling: 4.5,
      firstRoundShare: 4.5 + (25 - 4.5) / 2,
      potentialSupport: 25,
    });
    expect(strongParty.normalized).toBeCloseTo(outsider.normalized, 6);
  });

  it("does not divide by (near) zero when startingPolling equals potentialSupport", () => {
    const { normalized } = computeProgressionMetrics({
      startingPolling: 20,
      firstRoundShare: 25,
      potentialSupport: 20,
    });
    expect(Number.isFinite(normalized)).toBe(true);
  });

  it("clamps extreme overshoot instead of returning an unbounded value", () => {
    const { normalized } = computeProgressionMetrics({
      startingPolling: 5,
      firstRoundShare: 90,
      potentialSupport: 6,
    });
    expect(normalized).toBe(2);
  });

  it("is always finite and within [-2, 2] for arbitrary realistic inputs", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 40, noNaN: true }),
        fc.double({ min: 0, max: 100, noNaN: true }),
        fc.double({ min: 0, max: 60, noNaN: true }),
        (startingPolling, firstRoundShare, potentialSupport) => {
          const { normalized, raw } = computeProgressionMetrics({
            startingPolling,
            firstRoundShare,
            potentialSupport,
          });
          expect(Number.isFinite(normalized)).toBe(true);
          expect(normalized).toBeGreaterThanOrEqual(-2);
          expect(normalized).toBeLessThanOrEqual(2);
          expect(Number.isFinite(raw)).toBe(true);
        },
      ),
      { numRuns: 500 },
    );
  });
});
