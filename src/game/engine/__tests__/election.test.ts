import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { diminishingRejectionPenalty, simulateFirstRound, simulateSecondRound } from "../election";
import { createGame } from "../game";

describe("diminishingRejectionPenalty (P5)", () => {
  it("matches the previous linear penalty (rejection * 0.34) exactly at the calibration midpoint", () => {
    expect(diminishingRejectionPenalty(50)).toBeCloseTo(50 * 0.34, 6);
  });

  it("is monotonically increasing (higher rejection is still always worse)", () => {
    const samples = [0, 10, 25, 40, 50, 65, 80, 87, 100];
    for (let i = 1; i < samples.length; i += 1) {
      expect(diminishingRejectionPenalty(samples[i]!)).toBeGreaterThan(
        diminishingRejectionPenalty(samples[i - 1]!),
      );
    }
  });

  it("compresses the gap between a low- and a high-rejection party relative to the old linear term", () => {
    // Regression test for P5: with a flat rejection*0.34 term, a party near
    // ~87 rejection paid roughly +16 appeal points more than one near ~40 —
    // large enough that even a strong campaign for the high-rejection party
    // rarely closed the gap. The new curve must narrow it.
    const oldLinearGap = 87 * 0.34 - 40 * 0.34;
    const newGap = diminishingRejectionPenalty(87) - diminishingRejectionPenalty(40);
    expect(newGap).toBeLessThan(oldLinearGap);
    expect(newGap).toBeGreaterThan(0);
  });

  it("returns 0 at rejection 0", () => {
    expect(diminishingRejectionPenalty(0)).toBe(0);
  });
});

describe("élections", () => {
  it("produit un premier tour à 100 et deux finalistes distincts", () => {
    const state = createGame(
      { seed: "premier-tour", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const simulation = simulateFirstRound(state, testContent.electorateBlocs);
    expect(
      Object.values(simulation.result.results).reduce((sum, value) => sum + value, 0),
    ).toBeCloseTo(100, 8);
    expect(new Set(simulation.finalists).size).toBe(2);
    expect(simulation.result.regionalResults).toHaveLength(8);
  });

  it("produit un second tour valide et déterministe", () => {
    const state = createGame(
      { seed: "second-tour", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const first = simulateFirstRound(state, testContent.electorateBlocs).state;
    const left = simulateSecondRound(first, testContent.electorateBlocs);
    const right = simulateSecondRound(first, testContent.electorateBlocs);
    expect(left.result).toEqual(right.result);
    expect(Object.values(left.result.results).reduce((sum, value) => sum + value, 0)).toBeCloseTo(
      100,
      8,
    );
    expect(left.result.ranking).toHaveLength(2);
  });

  it("fait peser une consigne de vote sur les reports du second tour", () => {
    const initial = createGame(
      { seed: "reports-consigne", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const first = simulateFirstRound(initial, testContent.electorateBlocs).state;
    first.qualifiedPartyIds = ["alpha", "beta"];
    if (!first.firstRoundResult) throw new Error("Premier tour absent de la fixture.");
    first.firstRoundResult.results = { alpha: 35, beta: 34, gamma: 31 };
    first.firstRoundResult.ranking = ["alpha", "beta", "gamma"];

    const supportingAlpha = structuredClone(first);
    supportingAlpha.flags["endorsement:gamma"] = "alpha";
    const supportingBeta = structuredClone(first);
    supportingBeta.flags["endorsement:gamma"] = "beta";

    const alphaShare = simulateSecondRound(supportingAlpha, testContent.electorateBlocs).result
      .results.alpha;
    const betaEndorsementAlphaShare = simulateSecondRound(
      supportingBeta,
      testContent.electorateBlocs,
    ).result.results.alpha;
    expect(alphaShare).toBeGreaterThan(betaEndorsementAlphaShare ?? 0);
  });
});
