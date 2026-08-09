import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice, validateGameState } from "@/game/engine";
import type { GameState } from "@/game/types";

/**
 * Fun-improvement mission, Phase E — Renaissance identity content (P3/P4 of
 * PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md).
 *
 * Verifies the two new chains (renaissance_legacy_arc, with two mutually
 * exclusive follow-ups, and renaissance_manifesto_arc, attached to the
 * pre-existing party_renaissance_rare event) against the real engine.
 */

function playRenaissancePreferring(seed: string, preferredChoiceIds: string[]) {
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId: "renaissance", methodId: "field_first" },
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

describe("Renaissance — chaîne de l'héritage (party_renaissance_legacy_*)", () => {
  it("le déclencheur et ses deux follow-ups ont la structure de chaîne attendue", () => {
    const trigger = gameContent.events.find((e) => e.id === "party_renaissance_legacy_test");
    const confronted = gameContent.events.find(
      (e) => e.id === "party_renaissance_legacy_confronted",
    );
    const credited = gameContent.events.find((e) => e.id === "party_renaissance_legacy_credited");
    expect(trigger?.chain?.id).toBe("renaissance_legacy_arc");
    expect(confronted?.chain?.followsEventIds).toContain("party_renaissance_legacy_test");
    expect(credited?.chain?.followsEventIds).toContain("party_renaissance_legacy_test");
    expect(confronted?.eligibility).toContainEqual({
      kind: "flag",
      key: "renaissance_legacy_defended_fully",
      equals: true,
    });
    expect(credited?.eligibility).toContainEqual({
      kind: "flag",
      key: "renaissance_legacy_gaps_owned",
      equals: true,
    });
  });

  it("les deux branches sont atteignables et mutuellement exclusives", () => {
    let sawConfronted = false;
    let sawCredited = false;
    for (let i = 0; i < 30; i += 1) {
      const state = playRenaissancePreferring(`renaissance-legacy-defend-${i}`, [
        "renaissance_legacy_defend_all",
      ]);
      const ids = new Set(state.decisionHistory.map((d) => d.eventId));
      if (ids.has("party_renaissance_legacy_confronted")) sawConfronted = true;
      if (ids.has("party_renaissance_legacy_credited")) sawCredited = true;
      expect(
        ids.has("party_renaissance_legacy_confronted") &&
          ids.has("party_renaissance_legacy_credited"),
      ).toBe(false);
      expect(validateGameState(state).errors).toEqual([]);
    }
    for (let i = 0; i < 30; i += 1) {
      const state = playRenaissancePreferring(`renaissance-legacy-own-${i}`, [
        "renaissance_legacy_own_gaps",
      ]);
      const ids = new Set(state.decisionHistory.map((d) => d.eventId));
      if (ids.has("party_renaissance_legacy_confronted")) sawConfronted = true;
      if (ids.has("party_renaissance_legacy_credited")) sawCredited = true;
      expect(
        ids.has("party_renaissance_legacy_confronted") &&
          ids.has("party_renaissance_legacy_credited"),
      ).toBe(false);
      expect(validateGameState(state).errors).toEqual([]);
    }
    expect(sawConfronted).toBe(true);
    expect(sawCredited).toBe(true);
  }, 40000);
});

describe("Renaissance — suite du manifeste (party_renaissance_manifesto_aftermath)", () => {
  it("est raccroché à l'événement rare existant avec le bon flag", () => {
    const followUp = gameContent.events.find(
      (e) => e.id === "party_renaissance_manifesto_aftermath",
    );
    expect(followUp?.chain?.followsEventIds).toContain("party_renaissance_rare");
    expect(followUp?.eligibility).toContainEqual({
      kind: "flag",
      key: "renaissance_manifesto_debated",
      equals: true,
    });
  });
});
