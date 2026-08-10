import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice, validateGameState } from "@/game/engine";
import type { GameState } from "@/game/types";

/**
 * Passe ciblée post-fun (TARGETED_GAMEPLAY_PASS_REPORT.md), Phase C — deux
 * nouveaux axes narratifs Renaissance indépendants de l'arc héritage
 * (party_renaissance_legacy_*), diagnostiqué comme sous-représenté
 * (~21,5 % des campagnes, voir scripts/targeted-pass/renaissance-diagnostic.ts)
 * plutôt que sur-concentré. Vérifie, contre le moteur et le contenu réels,
 * que les deux nouveaux axes sont atteignables et n'interfèrent pas avec
 * l'arc héritage préexistant.
 */

function playRenaissancePreferring(seed: string, preferredChoiceIds: string[]) {
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId: "renaissance", methodId: "field_first" },
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

describe("Renaissance — axes de diversification (generation / network-autonomy)", () => {
  it("l'axe renouvellement consomme le drapeau renaissance_new_cycle déjà posé par party_renaissance_identity", () => {
    const generationTest = gameContent.events.find(
      (e) => e.id === "party_renaissance_generation_test",
    );
    expect(generationTest?.eligibility).toContainEqual({
      kind: "flag",
      key: "renaissance_new_cycle",
      equals: true,
    });
    const payoff = gameContent.events.find((e) => e.id === "party_renaissance_generation_payoff");
    expect(payoff?.chain?.followsEventIds).toContain("party_renaissance_generation_test");
    expect(payoff?.eligibility).toContainEqual({
      kind: "flag",
      key: "renaissance_generation_delivered",
      equals: true,
    });
  });

  it("l'axe réseau/autonomie est un événement indépendant, sans lien de drapeau avec l'héritage ou le renouvellement", () => {
    const networkEvent = gameContent.events.find(
      (e) => e.id === "party_renaissance_network_or_autonomy",
    );
    expect(networkEvent).toBeDefined();
    expect(networkEvent?.eligibility ?? []).toHaveLength(0);
    expect(networkEvent?.chain).toBeUndefined();
  });

  it("l'axe renouvellement est atteignable en pratique quand le joueur choisit new_cycle puis délègue", () => {
    let sawGenerationTest = false;
    let sawPayoff = false;
    for (let i = 0; i < 30; i += 1) {
      const state = playRenaissancePreferring(`renaissance-gen-${i}`, [
        "renaissance_identity_new_cycle",
        "renaissance_generation_delegate",
        "generation_payoff_back",
      ]);
      const ids = state.decisionHistory.map((d) => d.eventId);
      if (ids.includes("party_renaissance_generation_test")) sawGenerationTest = true;
      if (ids.includes("party_renaissance_generation_payoff")) sawPayoff = true;
      expect(validateGameState(state).errors).toEqual([]);
    }
    expect(sawGenerationTest).toBe(true);
    expect(sawPayoff).toBe(true);
  }, 40000);

  it("l'axe réseau/autonomie est atteignable indépendamment du choix fait à party_renaissance_identity", () => {
    let sawNetworkEvent = false;
    for (let i = 0; i < 30; i += 1) {
      const state = playRenaissancePreferring(`renaissance-network-${i}`, [
        "renaissance_identity_record",
        "renaissance_network_build_autonomous",
      ]);
      const ids = state.decisionHistory.map((d) => d.eventId);
      if (ids.includes("party_renaissance_network_or_autonomy")) sawNetworkEvent = true;
      expect(validateGameState(state).errors).toEqual([]);
    }
    expect(sawNetworkEvent).toBe(true);
  }, 40000);

  it("le drapeau renaissance_generation_cosmetic empêche party_renaissance_generation_payoff de se déclencher", () => {
    for (let i = 0; i < 25; i += 1) {
      const state = playRenaissancePreferring(`renaissance-cosmetic-${i}`, [
        "renaissance_identity_new_cycle",
        "renaissance_generation_keep_advisory",
      ]);
      const ids = new Set(state.decisionHistory.map((d) => d.eventId));
      if (ids.has("party_renaissance_generation_test")) {
        expect(state.flags.renaissance_generation_cosmetic).toBe(true);
        expect(ids.has("party_renaissance_generation_payoff")).toBe(false);
      }
      expect(validateGameState(state).errors).toEqual([]);
    }
  }, 40000);
});
