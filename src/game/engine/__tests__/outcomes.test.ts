import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { createGame, currentEvent } from "../game";
import { outcomeProbabilities, resolveWeightedOutcome } from "../outcomeResolver";

describe("résolution d’issue", () => {
  it("normalise les probabilités et journalise un tirage borné", () => {
    const state = createGame(
      { seed: "issues", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const event = currentEvent(state, testContent.events);
    const choice = event.choices[0];
    expect(choice).toBeDefined();
    const probabilities = outcomeProbabilities(state, choice!);
    expect(probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12);
    const resolved = resolveWeightedOutcome(state, event, choice!.id);
    expect(choice!.outcomeGroups).toContain(resolved.outcome);
    expect(resolved.roll).toBeGreaterThanOrEqual(0);
    expect(resolved.roll).toBeLessThan(1);
  });

  it("favorise réellement une issue grâce aux statistiques", () => {
    const low = createGame(
      { seed: "modificateur", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const high = structuredClone(low);
    const lowParty = low.parties.alpha;
    const highParty = high.parties.alpha;
    expect(lowParty && highParty).toBeTruthy();
    lowParty!.stats.credibility = 0;
    highParty!.stats.credibility = 100;
    const event = currentEvent(low, testContent.events);
    const choice = event.choices[0]!;
    expect(outcomeProbabilities(high, choice)[0]).toBeGreaterThan(
      outcomeProbabilities(low, choice)[0]!,
    );
  });
});
