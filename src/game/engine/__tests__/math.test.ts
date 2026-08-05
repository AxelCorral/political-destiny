import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { normalizePercentages, softmax } from "../math";

describe("outils probabilistes", () => {
  it("normalise softmax à 1", () => {
    const probabilities = softmax([-3, 0, 4, 900]);
    expect(probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12);
    expect(probabilities.every((value) => Number.isFinite(value) && value >= 0)).toBe(true);
  });

  it("corrige l’arrondi électoral à exactement 100", () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0, max: 1_000, noNaN: true }), { minLength: 2, maxLength: 20 }),
        (values) => {
          const normalized = normalizePercentages(
            Object.fromEntries(values.map((value, index) => [`p${index}`, value])),
            1,
          );
          expect(Object.values(normalized).reduce((sum, value) => sum + value, 0)).toBeCloseTo(
            100,
            8,
          );
          expect(Object.values(normalized).every((value) => value >= 0 && value <= 100)).toBe(true);
        },
      ),
      { numRuns: 300 },
    );
  });
});
