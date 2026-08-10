import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, isEventEligible } from "@/game/engine";
import type { GameState } from "@/game/types";

/**
 * AUDIT_ELECTORAL_COHERENCE.md §6/Annexe B — régression : dix des treize
 * événements de second tour spécifiques à un parti proposaient une alliance
 * ou évoquaient un tiers précis (ex. « LFI reçoit des soutiens socialistes
 * et écologistes ») sans jamais vérifier que ce tiers n'était pas, dans
 * cette partie précise, l'adversaire réellement qualifié du joueur —
 * reproduisant le scénario « Horizons » remonté en playtest (proposer une
 * alliance avec le finaliste adverse).
 */
function stateQualifiedAs(playerPartyId: string, opponentId: string): GameState {
  const state = createGame(
    { seed: `runoff-coherence-${playerPartyId}-${opponentId}`, mode: "existing_party", partyId: playerPartyId, methodId: "presidential" },
    gameContent,
  );
  state.phase = "between_rounds";
  state.qualifiedPartyIds = [playerPartyId, opponentId];
  return state;
}

const CASES: Array<{ eventId: string; playerPartyId: string; opponentId: string; referencedThird: string }> = [
  { eventId: "party_lfi_runoff", playerPartyId: "lfi", opponentId: "ps", referencedThird: "ps" },
  { eventId: "party_ps_runoff", playerPartyId: "ps", opponentId: "renaissance", referencedThird: "renaissance" },
  { eventId: "party_horizons_runoff", playerPartyId: "horizons", opponentId: "lr", referencedThird: "lr" },
  { eventId: "party_lr_runoff", playerPartyId: "lr", opponentId: "rn", referencedThird: "rn" },
];

describe("Cohérence second tour — l'adversaire qualifié n'est jamais traité comme un tiers disponible", () => {
  it.each(CASES)(
    "$eventId devient inéligible quand $referencedThird est l'adversaire qualifié",
    ({ eventId, playerPartyId, opponentId }) => {
      const event = gameContent.events.find((e) => e.id === eventId);
      expect(event).toBeDefined();

      const stateWithOpponentAsThird = stateQualifiedAs(playerPartyId, opponentId);
      expect(isEventEligible(stateWithOpponentAsThird, event!)).toBe(false);
    },
  );

  it("party_lfi_runoff reste éligible quand l'adversaire n'est pas un tiers référencé (rn)", () => {
    const event = gameContent.events.find((e) => e.id === "party_lfi_runoff");
    const state = stateQualifiedAs("lfi", "rn");
    expect(isEventEligible(state, event!)).toBe(true);
  });

  it("party_rn_runoff (aucun tiers référencé) reste éligible quel que soit l'adversaire", () => {
    const event = gameContent.events.find((e) => e.id === "party_rn_runoff");
    const state = stateQualifiedAs("rn", "ps");
    expect(isEventEligible(state, event!)).toBe(true);
  });
});
