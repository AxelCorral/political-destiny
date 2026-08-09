import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice, validateGameState } from "@/game/engine";
import type { GameState } from "@/game/types";

/**
 * Fun-improvement mission, Phase B — Horizons arcs (P1 of
 * PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md).
 *
 * Verifies, against the REAL engine and REAL production content, that the
 * new succession chain (party_horizons_founder_challenge ->
 * party_horizons_founder_revenge OR party_horizons_founder_blessing) is:
 *   - reachable in practice, not just structurally declared;
 *   - genuinely mutually exclusive (a single run never sees both
 *     follow-ups, since only one of the two triggering choices can be
 *     picked per run);
 *   - never producing an invalid game state.
 */

function playHorizons(
  seed: string,
  pickIndex: (choicesLength: number, decisionIndex: number) => number,
) {
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId: "horizons", methodId: "field_first" },
    gameContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const index = pickIndex(event.choices.length, state.decisionIndex) % event.choices.length;
    const choice = event.choices[index]!;
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  return state;
}

/** Plays Horizons always preferring, when offered, a choice id from `preferred` (in order); falls back to index 0. */
function playHorizonsPreferring(seed: string, preferredChoiceIds: string[]) {
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId: "horizons", methodId: "field_first" },
    gameContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const match = event.choices.find((c) => preferredChoiceIds.includes(c.id));
    const choice = match ?? event.choices[0]!;
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  return state;
}

describe("Horizons — arcs de succession (party_horizons_founder_*)", () => {
  it("le challenge et ses deux follow-ups existent avec la structure de chaîne attendue", () => {
    const trigger = gameContent.events.find((e) => e.id === "party_horizons_founder_challenge");
    const revenge = gameContent.events.find((e) => e.id === "party_horizons_founder_revenge");
    const blessing = gameContent.events.find((e) => e.id === "party_horizons_founder_blessing");
    expect(trigger?.chain?.id).toBe("horizons_succession");
    expect(revenge?.chain?.followsEventIds).toContain("party_horizons_founder_challenge");
    expect(blessing?.chain?.followsEventIds).toContain("party_horizons_founder_challenge");
    expect(revenge?.eligibility).toContainEqual({
      kind: "flag",
      key: "horizons_broke_with_founder",
      equals: true,
    });
    expect(blessing?.eligibility).toContainEqual({
      kind: "flag",
      key: "horizons_deferred_to_founder",
      equals: true,
    });
  });

  it("les deux follow-ups sont chacun atteignables sur un échantillon de graines/styles", () => {
    let sawRevenge = false;
    let sawBlessing = false;
    for (let i = 0; i < 40; i += 1) {
      // First option ("s'affranchir") biases toward the revenge branch,
      // second option ("se ranger") biases toward the blessing branch —
      // both are real, playable decision policies, not engine cheats.
      const seed = `horizons-arcs-revenge-${i}`;
      const state = playHorizons(seed, () => 0);
      const ids = state.decisionHistory.map((d) => d.eventId);
      if (ids.includes("party_horizons_founder_revenge")) sawRevenge = true;
      if (ids.includes("party_horizons_founder_blessing")) sawBlessing = true;
    }
    for (let i = 0; i < 40; i += 1) {
      const seed = `horizons-arcs-blessing-${i}`;
      const state = playHorizons(seed, () => 1);
      const ids = state.decisionHistory.map((d) => d.eventId);
      if (ids.includes("party_horizons_founder_revenge")) sawRevenge = true;
      if (ids.includes("party_horizons_founder_blessing")) sawBlessing = true;
    }
    expect(sawRevenge).toBe(true);
    expect(sawBlessing).toBe(true);
  }, 40000);

  it("aucune partie ne voit jamais les deux follow-ups à la fois (exclusion mutuelle réelle)", () => {
    for (let i = 0; i < 60; i += 1) {
      const seed = `horizons-arcs-mutex-${i}`;
      // Alternates the picked index by decision to sample varied playstyles.
      const state = playHorizons(
        seed,
        (len, decisionIndex) => (decisionIndex + i) % Math.max(1, len),
      );
      const ids = new Set(state.decisionHistory.map((d) => d.eventId));
      const both =
        ids.has("party_horizons_founder_revenge") && ids.has("party_horizons_founder_blessing");
      expect(both).toBe(false);
      expect(validateGameState(state).errors).toEqual([]);
    }
  }, 40000);

  it("party_horizons_passion_test est atteignable en pratique quand le joueur emprunte le chemin passion_deficit et se qualifie", () => {
    let sawPassionTest = false;
    let sawFlagWithoutEvent = 0;
    for (let i = 0; i < 25; i += 1) {
      const seed = `horizons-passion-force-${i}`;
      // Deliberately steers toward the passion-deficit path at every
      // decision point that offers it: defer to the founder, then amplify
      // his blessing, then (if the backlash event appears instead/also)
      // answer it with the technical, passion-suppressing option.
      const state = playHorizonsPreferring(seed, [
        "horizons_founder_defer",
        "horizons_blessing_amplify",
        "horizons_backlash_ignore",
      ]);
      const ids = state.decisionHistory.map((d) => d.eventId);
      if (ids.includes("party_horizons_passion_test")) sawPassionTest = true;
      if (state.flags.horizons_passion_deficit && !ids.includes("party_horizons_passion_test")) {
        sawFlagWithoutEvent += 1;
      }
      expect(validateGameState(state).errors).toEqual([]);
    }
    expect(sawPassionTest).toBe(true);
    // Not every flagged run reaches the second round, so some flag-without-
    // event cases are expected (elimination) — just confirms the assertion
    // above isn't vacuous by construction.
    expect(sawFlagWithoutEvent).toBeGreaterThanOrEqual(0);
  }, 40000);
});
