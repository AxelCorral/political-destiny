import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import {
  centralityCost,
  diminishingRejectionPenalty,
  runoffShareSplit,
  simulateFirstRound,
  simulateSecondRound,
} from "../election";
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

describe("runoffShareSplit — P5 (chantier ciblé)", () => {
  it("régression : un écart d'appel extrême ne doit plus produire un partage quasi total (100/0)", () => {
    // Reproduit le défaut diagnostié le 06/08/2026 (P1_P5_FINAL_FIXES.md
    // section 7) : avant la correction, la part de voix était le ratio brut
    // leftAppeal/(leftAppeal+rightAppeal), sans plafond — un avantage
    // structurel modeste mais systématique (centralité idéologique) pouvait
    // se traduire en quasi-monopole d'un électorat éliminé.
    const split = runoffShareSplit(1000, 1);
    expect(split.left).toBeLessThan(0.95);
    expect(split.left).toBeGreaterThan(0.5);
  });

  it("conserve la masse : gauche + droite = 1 dans tous les cas", () => {
    for (const [left, right] of [
      [10, 10],
      [1, 100],
      [100, 1],
      [0, 5],
      [5, 0],
      [0, 0],
    ]) {
      const split = runoffShareSplit(left!, right!);
      expect(split.left + split.right).toBeCloseTo(1, 8);
    }
  });

  it("ne change rien à un duel déjà équilibré (50/50 reste 50/50)", () => {
    const split = runoffShareSplit(50, 50);
    expect(split.left).toBeCloseTo(0.5, 6);
  });

  it("préserve l'ordre (le camp avec le plus d'appel reste majoritaire)", () => {
    const split = runoffShareSplit(70, 30);
    expect(split.left).toBeGreaterThan(0.5);
    expect(split.left).toBeGreaterThan(0.5 + (70 / 100 - 0.5) * 0.3);
  });

  it("ne divise jamais par zéro (deux appels nuls -> 50/50)", () => {
    const split = runoffShareSplit(0, 0);
    expect(split.left).toBe(0.5);
    expect(Number.isFinite(split.left)).toBe(true);
  });
});

describe("centralityCost — P5 (chantier ciblé)", () => {
  it("régression : un parti structurellement central (faible distance moyenne aux autres partis actifs) paie un coût strictement positif", () => {
    const state = createGame(
      { seed: "p5-centrality", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    // gamma (position 0, testContent) est au centre exact entre alpha (-35)
    // et beta (+35) : sa distance moyenne aux deux autres partis actifs est
    // structurellement faible (sous la référence de calibration).
    expect(centralityCost(state, "gamma")).toBeGreaterThan(0);
  });

  it("un parti au centre exact paie un coût strictement supérieur à un parti à l'extrémité, dans le même champ de partis actifs", () => {
    const state = createGame(
      {
        seed: "p5-centrality-ordering",
        mode: "existing_party",
        partyId: "alpha",
        methodId: "field",
      },
      testContent,
    );
    // gamma (position 0) est équidistant d'alpha (-35) et beta (+35) : sa
    // distance moyenne aux deux autres partis actifs est structurellement
    // la plus faible des trois. alpha et beta, à une extrémité, ont chacun
    // un voisin proche (gamma) et un voisin lointain (l'autre extrême) — une
    // distance moyenne plus élevée que celle de gamma.
    const centerCost = centralityCost(state, "gamma");
    const alphaCost = centralityCost(state, "alpha");
    const betaCost = centralityCost(state, "beta");
    expect(centerCost).toBeGreaterThan(alphaCost);
    expect(centerCost).toBeGreaterThan(betaCost);
  });

  it("un parti largement en dehors du champ politique actif (bien au-delà de la référence de calibration) ne paie aucun coût", () => {
    const state = createGame(
      {
        seed: "p5-no-cost-when-extreme",
        mode: "existing_party",
        partyId: "alpha",
        methodId: "field",
      },
      testContent,
    );
    const farOutlier = {
      ...state.parties.alpha!,
      perceivedIdeology: {
        economy: 100,
        society: 100,
        europe: 100,
        ecology: -100,
        authority: 100,
        immigration: 100,
      },
    };
    const withOutlier = { ...state, parties: { ...state.parties, alpha: farOutlier } };
    expect(centralityCost(withOutlier, "alpha")).toBe(0);
  });

  it("ne dépend jamais de l'identifiant du parti, seulement de sa position géométrique (aucun coefficient par parti)", () => {
    const state = createGame(
      {
        seed: "p5-no-party-coefficient",
        mode: "existing_party",
        partyId: "alpha",
        methodId: "field",
      },
      testContent,
    );
    // Un parti "gamma-jumeau" avec un autre identifiant mais la même
    // position perçue doit payer exactement le même coût.
    const twinState = {
      ...state,
      parties: {
        ...state.parties,
        zeta: { ...state.parties.gamma!, id: "zeta" },
      },
    };
    expect(centralityCost(twinState, "zeta")).toBeCloseTo(centralityCost(twinState, "gamma"), 6);
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
