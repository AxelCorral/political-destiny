import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { simulateFirstRound, simulateSecondRound } from "../election";
import { createGame } from "../game";

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
