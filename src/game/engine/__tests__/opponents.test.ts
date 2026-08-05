import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { createGame } from "../game";
import { replaceCandidate, simulateOpponentTurn } from "../opponentSimulation";
import { splitParty } from "../partyDynamics";

describe("adversaires", () => {
  it("agit sans modifier le parti joueur", () => {
    const state = createGame(
      { seed: "adversaires", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const playerBefore = structuredClone(state.parties.alpha);
    const after = simulateOpponentTurn(state);
    expect(after.parties.alpha).toEqual(playerBefore);
    expect(after.rng.draws).toBeGreaterThan(state.rng.draws);
  });

  it("remplace un candidat retiré par un cadre fictif", () => {
    const state = createGame(
      { seed: "remplacement", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const formerId = state.parties.beta!.candidateId;
    const result = replaceCandidate(state, "beta");
    expect(result.replacement?.identityKind).toBe("fictional");
    expect(result.state.parties.beta?.candidateId).not.toBe(formerId);
    expect(result.state.actors[formerId]?.candidateStatus).toBe("withdrawn");
  });

  it("crée une dissidence conduite par un acteur fictif", () => {
    const state = createGame(
      { seed: "scission", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const result = splitParty(state, "beta");
    expect(result.splitParty?.id).toContain("beta_dissidence");
    expect(result.leader?.identityKind).toBe("fictional");
    expect(result.state.parties.beta?.stats.cohesion).toBeLessThan(
      state.parties.beta!.stats.cohesion,
    );
  });
});
