import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { createGame, currentEvent, resolveCurrentChoice } from "../game";
import { validateGameState } from "../validation";

function autoplay(seed: string) {
  let state = createGame(
    { seed, mode: "existing_party", partyId: "alpha", methodId: "field" },
    testContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 40) {
    const event = currentEvent(state, testContent.events);
    state = resolveCurrentChoice(
      state,
      event.choices[guard % event.choices.length]!.id,
      testContent,
    ).state;
    guard += 1;
  }
  return state;
}

describe("pipeline complet", () => {
  it("rejoue la même campagne avec la même graine et les mêmes choix", () => {
    const left = autoplay("campagne-reproductible");
    const right = autoplay("campagne-reproductible");
    expect(left).toEqual(right);
    expect(left.phase).toBe("finished");
    expect(left.finalResult?.score).toBeGreaterThanOrEqual(0);
    expect(left.finalResult?.score).toBeLessThanOrEqual(100);
  });

  it("sépare les identifiants de partie sans modifier la trajectoire aléatoire", () => {
    const first = createGame(
      {
        seed: "identité-partagée",
        mode: "existing_party",
        partyId: "alpha",
        methodId: "field",
        runInstanceId: "première-instance",
      },
      testContent,
    );
    const second = createGame(
      {
        seed: "identité-partagée",
        mode: "existing_party",
        partyId: "alpha",
        methodId: "field",
        runInstanceId: "seconde-instance",
      },
      testContent,
    );
    const otherParty = createGame(
      {
        seed: "identité-partagée",
        mode: "existing_party",
        partyId: "gamma",
        methodId: "field",
        runInstanceId: "première-instance",
      },
      testContent,
    );

    expect(new Set([first.runId, second.runId, otherParty.runId])).toHaveLength(3);
    expect(first.rng).toEqual(second.rng);
    expect(first.currentEventId).toBe(second.currentEventId);
  });

  it("termine des campagnes variées sans état invalide", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 24 }), (seed) => {
        const state = autoplay(seed);
        const validation = validateGameState(state);
        expect(state.phase).toBe("finished");
        expect(state.decisionIndex).toBeGreaterThanOrEqual(25);
        expect(state.decisionIndex).toBeLessThanOrEqual(31);
        expect(validation.errors).toEqual([]);
      }),
      { numRuns: 120 },
    );
  });
});
