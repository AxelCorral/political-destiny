import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { isElectorallyActive, nationalLatentSupport } from "../electorate";
import { simulateFirstRound } from "../election";
import { createGame } from "../game";

/**
 * AUDIT_ELECTORAL_COHERENCE.md §4.1/§7 — régression : `simulateFirstRound`
 * marque les partis non qualifiés `actor.candidateStatus = "eliminated"`
 * mais ne touche jamais `party.active`, sur lequel reposait auparavant tout
 * le calcul de sondage continu. Résultat avant correctif : la barre
 * latérale, le tableau de bord et la carte de reprise continuaient
 * d'afficher un sondage recalculé comme si les partis éliminés étaient
 * toujours en course, pendant tout l'entre-deux-tours et le gouvernement.
 */
describe("isElectorallyActive / nationalLatentSupport — cohérence post-premier-tour", () => {
  it("un parti éliminé reste party.active mais n'est plus électoralement actif", () => {
    const state = createGame(
      { seed: "coherence-elim-1", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const { state: afterRound } = simulateFirstRound(state, testContent.electorateBlocs);
    const finalists = afterRound.qualifiedPartyIds!;
    const eliminatedId = Object.keys(afterRound.parties).find((id) => !finalists.includes(id));
    expect(eliminatedId).toBeDefined();

    const eliminatedParty = afterRound.parties[eliminatedId!]!;
    expect(eliminatedParty.active).toBe(true); // le bug historique : jamais désactivé
    const actor = afterRound.actors[eliminatedParty.candidateId];
    expect(actor?.candidateStatus).toBe("eliminated");
    expect(isElectorallyActive(afterRound, eliminatedId!)).toBe(false);

    for (const finalistId of finalists) {
      expect(isElectorallyActive(afterRound, finalistId)).toBe(true);
    }
  });

  it("le sondage national post-premier-tour ne redistribue plus de voix aux partis éliminés", () => {
    const state = createGame(
      { seed: "coherence-elim-2", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const { state: afterRound } = simulateFirstRound(state, testContent.electorateBlocs);
    const finalists = afterRound.qualifiedPartyIds!;

    const national = nationalLatentSupport(afterRound, testContent.electorateBlocs);
    const total = Object.values(national).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(100, 1);

    for (const [partyId, share] of Object.entries(national)) {
      if (finalists.includes(partyId)) continue;
      expect(share).toBe(0);
    }
    const finalistShareSum = finalists.reduce((sum, id) => sum + (national[id] ?? 0), 0);
    expect(finalistShareSum).toBeCloseTo(100, 1);
  });

  it("avant le premier tour, tous les partis actifs restent électoralement actifs", () => {
    const state = createGame(
      { seed: "coherence-preround", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    for (const partyId of Object.keys(state.parties)) {
      expect(isElectorallyActive(state, partyId)).toBe(true);
    }
    const national = nationalLatentSupport(state, testContent.electorateBlocs);
    const total = Object.values(national).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(100, 1);
  });
});

describe("nationalLatentSupport — invariants après amplification de la dispersion", () => {
  it("la somme reste 100 et l'ordre des partis est préservé", () => {
    const state = createGame(
      { seed: "coherence-dispersion", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const national = nationalLatentSupport(state, testContent.electorateBlocs);
    const values = Object.values(national);
    const total = values.reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(100, 1);
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});
