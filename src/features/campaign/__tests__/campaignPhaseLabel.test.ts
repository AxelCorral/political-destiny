import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame } from "@/game/engine";
import type { GameState } from "@/game/types";

import { campaignPhaseLabel } from "../campaign-phase-label";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase J (§23) — le libellé de phase
 * du calendrier ne doit dériver que de `state.phase`/`state.decisionIndex`
 * déjà existants (jamais des dates elles-mêmes) et rester borné aux cinq
 * libellés prévus par le prompt (+ Gouvernement).
 */
function baseState(overrides: Partial<GameState>): GameState {
  const method = gameContent.methods[0]!;
  const state = createGame(
    { seed: "phase-label-test", mode: "existing_party", partyId: "ps", methodId: method.id },
    gameContent,
  );
  return { ...state, ...overrides };
}

describe("campaignPhaseLabel", () => {
  it("Pré-campagne", () => {
    expect(campaignPhaseLabel(baseState({ phase: "pre_campaign" }))).toBe("Pré-campagne");
  });

  it("Campagne avant le seuil de 0.72 de progression", () => {
    const state = baseState({ phase: "campaign", decisionIndex: 5 });
    expect(campaignPhaseLabel(state)).toBe("Campagne");
  });

  it("Dernière ligne droite à partir de 0.72 de progression (targetDecisionsBeforeFirstRound = 24)", () => {
    const state = baseState({ phase: "campaign", decisionIndex: 18 });
    expect(campaignPhaseLabel(state)).toBe("Dernière ligne droite");
  });

  it("Entre-deux-tours", () => {
    expect(campaignPhaseLabel(baseState({ phase: "between_rounds" }))).toBe("Entre-deux-tours");
  });

  it("Gouvernement", () => {
    expect(campaignPhaseLabel(baseState({ phase: "government_epilogue" }))).toBe("Gouvernement");
  });

  it("ne modifie jamais currentDate/electionDate", () => {
    const state = baseState({ phase: "campaign", decisionIndex: 20 });
    const before = { currentDate: state.currentDate, electionDate: state.electionDate };
    campaignPhaseLabel(state);
    expect(state.currentDate).toBe(before.currentDate);
    expect(state.electionDate).toBe(before.electionDate);
  });
});
