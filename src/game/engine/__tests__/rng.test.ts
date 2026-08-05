import { describe, expect, it } from "vitest";

import { createRngState, random, weightedIndex } from "../rng";

describe("PRNG déterministe", () => {
  it("rejoue exactement la même suite avec la même graine", () => {
    let left = createRngState("même-graine");
    let right = createRngState("même-graine");
    const leftValues: number[] = [];
    const rightValues: number[] = [];
    for (let index = 0; index < 100; index += 1) {
      let value: number;
      [value, left] = random(left);
      leftValues.push(value);
      [value, right] = random(right);
      rightValues.push(value);
    }
    expect(leftValues).toEqual(rightValues);
    expect(left.draws).toBe(100);
  });

  it("produit une autre suite pour une autre graine", () => {
    const [left] = random(createRngState("graine-a"));
    const [right] = random(createRngState("graine-b"));
    expect(left).not.toBe(right);
  });

  it("ignore les poids invalides sans sortir des bornes", () => {
    const [index, roll] = weightedIndex(createRngState("poids"), [Number.NaN, -2, 4]);
    expect(index).toBe(2);
    expect(roll).toBeGreaterThanOrEqual(0);
    expect(roll).toBeLessThan(1);
  });
});
