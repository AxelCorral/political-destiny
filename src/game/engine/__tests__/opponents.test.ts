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
    const after = simulateOpponentTurn(state, testContent.electorateBlocs);
    expect(after.parties.alpha).toEqual(playerBefore);
    expect(after.rng.draws).toBeGreaterThan(state.rng.draws);
  });

  it("remplace un candidat retiré par un cadre fictif", () => {
    const state = createGame(
      { seed: "remplacement", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const formerId = state.parties.beta!.candidateId;
    const result = replaceCandidate(state, "beta", testContent.electorateBlocs);
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

  it("rend les remplacements rares mais observables dans une série déterministe", () => {
    let observed = false;
    for (let index = 0; index < 240 && !observed; index += 1) {
      const state = createGame(
        {
          seed: `crise-observable-${index}`,
          mode: "existing_party",
          partyId: "alpha",
          methodId: "field",
        },
        testContent,
      );
      state.decisionIndex = 10;
      state.parties.beta!.hidden.scandalRisk = 100;
      state.parties.beta!.stats.cohesion = 0;
      state.actors[state.parties.beta!.candidateId]!.legitimacy = 0;
      observed = simulateOpponentTurn(state, testContent.electorateBlocs).opponentActions.some(
        (action) => action.kind === "replacement" && action.partyId === "beta",
      );
    }
    expect(observed).toBe(true);
  });

  it("permet aux adversaires proches de former une alliance", () => {
    let observed = false;
    for (let index = 0; index < 180 && !observed; index += 1) {
      const state = createGame(
        {
          seed: `alliance-observable-${index}`,
          mode: "existing_party",
          partyId: "alpha",
          methodId: "field",
        },
        testContent,
      );
      state.partyRelations.beta!.gamma = 50;
      state.partyRelations.gamma!.beta = 50;
      observed = simulateOpponentTurn(state, testContent.electorateBlocs).opponentActions.some(
        (action) => action.kind === "alliance",
      );
    }
    expect(observed).toBe(true);
  });

  it("fait choisir aux candidats éliminés un soutien ou la neutralité", () => {
    const state = createGame(
      { seed: "consigne-second-tour", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    state.phase = "between_rounds";
    state.qualifiedPartyIds = ["alpha", "gamma"];

    const after = simulateOpponentTurn(state, testContent.electorateBlocs);

    expect(after.flags["endorsement:beta"]).toBeDefined();
    expect(after.actors.beta_candidate?.candidateStatus).toBe("eliminated");
  });

  it("autorise le retrait et le ralliement d’une candidature marginalisée", () => {
    let observed = false;
    for (let index = 0; index < 120 && !observed; index += 1) {
      const state = createGame(
        {
          seed: `retrait-observable-${index}`,
          mode: "existing_party",
          partyId: "alpha",
          methodId: "field",
        },
        testContent,
      );
      state.decisionIndex = 20;
      state.phase = "official_campaign";
      state.parties.beta!.stats.polling = 0.5;
      state.actors.beta_candidate!.legitimacy = 0;
      const after = simulateOpponentTurn(state, testContent.electorateBlocs);
      observed = after.opponentActions.some(
        (action) => action.kind === "withdrawal" && action.partyId === "beta",
      );
      if (observed) {
        expect(after.parties.beta?.active).toBe(false);
        expect(after.actors.beta_candidate?.candidateStatus).toBe("withdrawn");
      }
    }
    expect(observed).toBe(true);
  });
});
