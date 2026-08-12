import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { testContent } from "@/game/fixtures/testContent";
import { createGame, currentEvent, resolveCurrentChoice } from "@/game/engine";
import type { GameState } from "@/game/types";

import { track } from "../client";
import { setAnalyticsConsent } from "../consent";

/**
 * Mission-mandated non-regression test: "same seed + same choices" must
 * produce an identical GameState whether the analytics layer is active or
 * not. track() (src/analytics/client.ts) never touches GameState, never
 * consumes state.rng, and never runs synchronously inside the engine call —
 * this test asserts that guarantee end-to-end rather than just by
 * inspection of the source.
 */
function autoplay(seed: string, onStep?: (state: GameState) => void): GameState {
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
    onStep?.(state);
    guard += 1;
  }
  return state;
}

describe("isolation moteur / analytics (test de non-régression déterministe)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("produit le même GameState final avec et sans la couche analytics active", async () => {
    const seed = "determinism-check";

    const withoutAnalytics = autoplay(seed);

    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_MODE", "opt-in");
    await setAnalyticsConsent("granted");
    let stepIndex = 0;
    const withAnalytics = autoplay(seed, (state) => {
      stepIndex += 1;
      track("decision_resolved", state.runId, {
        decisionIndex: stepIndex,
        phase: state.phase,
        eventId: "fixture-event",
        eventCategory: "campaign",
        choiceId: "fixture-choice",
        outcomeId: "fixture-outcome",
        internalRoll: 0.5,
      });
    });

    expect(JSON.stringify(withAnalytics)).toBe(JSON.stringify(withoutAnalytics));
  });

  it("ne consomme jamais le RNG du moteur", () => {
    const seed = "rng-isolation-check";
    const state = createGame(
      { seed, mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const rngBefore = JSON.stringify(state.rng);
    track("decision_resolved", state.runId, {
      decisionIndex: 0,
      phase: state.phase,
      eventId: "fixture-event",
      eventCategory: "campaign",
      choiceId: "fixture-choice",
      outcomeId: "fixture-outcome",
      internalRoll: 0.5,
    });
    expect(JSON.stringify(state.rng)).toBe(rngBefore);
  });
});
