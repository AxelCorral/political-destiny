import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice, validateGameState } from "@/game/engine";
import type { GameState } from "@/game/types";

/**
 * Passe ciblée post-fun (TARGETED_GAMEPLAY_PASS_REPORT.md), Phase B —
 * Horizons : trois trajectoires réellement distinctes et mutuellement
 * exclusives, émergeant de party_horizons_founder_challenge (jamais un menu
 * explicite). Vérifie contre le moteur et le contenu de production réels que
 * chaque branche est atteignable, que l'exclusion mutuelle est réelle, et
 * qu'un run qualifié ne voit jamais qu'une seule variante de second tour.
 */

const CONTINUITY_ONLY = [
  "party_horizons_continuity_elders_dividend",
  "party_horizons_continuity_late_test",
  "party_horizons_runoff_continuity",
];
const RUPTURE_ONLY = [
  "party_horizons_rupture_old_guard_distances",
  "party_horizons_rupture_new_courtship",
  "party_horizons_runoff_rupture",
];
const COALITION_ONLY = [
  "party_horizons_coalition_outreach",
  "party_horizons_coalition_stretch_test",
  "party_horizons_runoff_coalition",
];
const RUNOFF_VARIANTS = [
  "party_horizons_runoff_continuity",
  "party_horizons_runoff_rupture",
  "party_horizons_runoff_coalition",
  "party_horizons_runoff",
];

function playHorizonsPreferring(seed: string, preferredChoiceIds: string[]) {
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId: "horizons", methodId: "field_first" },
    gameContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const match = event.choices.find((choice) => preferredChoiceIds.includes(choice.id));
    const choice = match ?? event.choices[0]!;
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  return state;
}

describe("Horizons — trajectoires A/B/C (party_horizons_trajectory)", () => {
  it("les trois choix de party_horizons_founder_challenge posent chacun un drapeau de trajectoire distinct", () => {
    const trigger = gameContent.events.find((e) => e.id === "party_horizons_founder_challenge");
    expect(trigger).toBeDefined();
    const breakFree = trigger?.choices.find((c) => c.id === "horizons_founder_break_free");
    const defer = trigger?.choices.find((c) => c.id === "horizons_founder_defer");
    const roleSplit = trigger?.choices.find((c) => c.id === "horizons_founder_role_split");
    expect(breakFree?.outcomeGroups[0]?.setFlags?.horizons_trajectory).toBe("rupture");
    expect(defer?.outcomeGroups[0]?.setFlags?.horizons_trajectory).toBe("continuity");
    expect(roleSplit?.outcomeGroups[0]?.setFlags?.horizons_trajectory).toBe("coalition");
  });

  it("chaque événement de trajectoire n'est éligible que pour son propre drapeau", () => {
    for (const id of CONTINUITY_ONLY) {
      const def = gameContent.events.find((e) => e.id === id);
      expect(def?.eligibility, id).toContainEqual({
        kind: "flag",
        key: "horizons_trajectory",
        equals: "continuity",
      });
    }
    for (const id of RUPTURE_ONLY) {
      const def = gameContent.events.find((e) => e.id === id);
      expect(def?.eligibility, id).toContainEqual({
        kind: "flag",
        key: "horizons_trajectory",
        equals: "rupture",
      });
    }
    for (const id of COALITION_ONLY) {
      const def = gameContent.events.find((e) => e.id === id);
      expect(def?.eligibility, id).toContainEqual({
        kind: "flag",
        key: "horizons_trajectory",
        equals: "coalition",
      });
    }
    const fallback = gameContent.events.find((e) => e.id === "party_horizons_runoff");
    expect(fallback?.eligibility).toContainEqual({ kind: "not_flag", key: "horizons_trajectory" });
  });

  it("les trois trajectoires sont chacune atteignables en pratique sur un échantillon de graines", () => {
    let sawContinuity = false;
    let sawRupture = false;
    let sawCoalition = false;
    for (let i = 0; i < 30; i += 1) {
      const state = playHorizonsPreferring(`horizons-traj-continuity-${i}`, [
        "horizons_founder_defer",
        "horizons_continuity_grant_seats",
        "horizons_continuity_own_the_label",
        "horizons_runoff_continuity_formalize",
      ]);
      const ids = new Set(state.decisionHistory.map((d) => d.eventId));
      if (CONTINUITY_ONLY.some((id) => ids.has(id))) sawContinuity = true;
      expect(validateGameState(state).errors).toEqual([]);
    }
    for (let i = 0; i < 30; i += 1) {
      const state = playHorizonsPreferring(`horizons-traj-rupture-${i}`, [
        "horizons_founder_break_free",
        "horizons_rupture_claim_it",
        "horizons_rupture_open_talks",
        "horizons_runoff_rupture_go_alone",
      ]);
      const ids = new Set(state.decisionHistory.map((d) => d.eventId));
      if (RUPTURE_ONLY.some((id) => ids.has(id))) sawRupture = true;
      expect(validateGameState(state).errors).toEqual([]);
    }
    for (let i = 0; i < 30; i += 1) {
      const state = playHorizonsPreferring(`horizons-traj-coalition-${i}`, [
        "horizons_founder_role_split",
        "horizons_coalition_accept_broad",
        "horizons_coalition_ambiguous_text",
        "horizons_runoff_coalition_full_display",
      ]);
      const ids = new Set(state.decisionHistory.map((d) => d.eventId));
      if (COALITION_ONLY.some((id) => ids.has(id))) sawCoalition = true;
      expect(validateGameState(state).errors).toEqual([]);
    }
    expect(sawContinuity).toBe(true);
    expect(sawRupture).toBe(true);
    expect(sawCoalition).toBe(true);
  }, 60000);

  it("aucun run ne mélange jamais des événements de deux trajectoires différentes", () => {
    const preferenceSets = [
      ["horizons_founder_defer", "horizons_continuity_grant_seats"],
      ["horizons_founder_break_free", "horizons_rupture_claim_it"],
      ["horizons_founder_role_split", "horizons_coalition_accept_broad"],
    ];
    for (let i = 0; i < 45; i += 1) {
      const preferred = preferenceSets[i % preferenceSets.length]!;
      const state = playHorizonsPreferring(`horizons-traj-mutex-${i}`, preferred);
      const ids = new Set(state.decisionHistory.map((d) => d.eventId));
      const families = [
        CONTINUITY_ONLY.some((id) => ids.has(id)),
        RUPTURE_ONLY.some((id) => ids.has(id)),
        COALITION_ONLY.some((id) => ids.has(id)),
      ].filter(Boolean).length;
      expect(families, `seed horizons-traj-mutex-${i}`).toBeLessThanOrEqual(1);
      expect(validateGameState(state).errors).toEqual([]);
    }
  }, 60000);

  it("un run qualifié ne voit jamais qu'une seule variante de party_horizons_runoff*", () => {
    const preferenceSets = [
      ["horizons_founder_defer"],
      ["horizons_founder_break_free"],
      ["horizons_founder_role_split"],
    ];
    let sawAnyRunoff = false;
    for (let i = 0; i < 45; i += 1) {
      const preferred = preferenceSets[i % preferenceSets.length]!;
      const state = playHorizonsPreferring(`horizons-traj-runoff-${i}`, preferred);
      const ids = state.decisionHistory.map((d) => d.eventId);
      const seenRunoffVariants = RUNOFF_VARIANTS.filter((id) => ids.includes(id));
      expect(seenRunoffVariants.length, `seed horizons-traj-runoff-${i}`).toBeLessThanOrEqual(1);
      if (seenRunoffVariants.length === 1) sawAnyRunoff = true;
    }
    expect(sawAnyRunoff).toBe(true);
  }, 60000);
});
