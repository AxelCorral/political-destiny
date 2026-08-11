import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import type { GameState } from "@/game/types";

import { computeBlocFragmentationPressure, computeElectoralViability } from "../viability";
import { createGame } from "../game";
import { simulateOpponentTurn } from "../opponentSimulation";
import { normalizePercentages } from "../math";

const BLOCS = gameContent.electorateBlocs;

/**
 * PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md §42 —
 * "Strategic withdrawal" : viable candidate can still remain, weak
 * non-viable candidate can negotiate, bloc fragmentation matters, relation
 * matters, ideological distance matters, failed negotiation possible.
 */
function freshState(seed: string, playerPartyId = "rn"): GameState {
  return createGame(
    { seed, mode: "existing_party", partyId: playerPartyId, methodId: "presidential" },
    gameContent,
  );
}

function forceUniformSupport(state: GameState, partyId: string, value: number): void {
  for (const bloc of BLOCS) {
    const support = state.electorate.latentSupport[bloc.id];
    if (!support) continue;
    support[partyId] = value;
    state.electorate.latentSupport[bloc.id] = normalizePercentages(support, 3);
  }
}

function makeWeakEcologistesWithBetterPlacedAlly(state: GameState): void {
  // Écologistes faibles, PS nettement mieux placé (naturalAllies = [ps, lfi]
  // dans src/game/data/parties.ts) : voie étroite + pression de bloc élevée.
  forceUniformSupport(state, "ecologistes", 3);
  forceUniformSupport(state, "ps", 22);
  state.parties.ecologistes!.stats.cohesion = 70;
  state.actors[state.parties.ecologistes!.candidateId]!.legitimacy = 70;
  // `maybeNegotiateStrategicWithdrawal` (comme `maybeWithdrawAndRally`)
  // n'est éligible qu'en phase "campaign"/"official_campaign" ; un état
  // fraîchement créé par `createGame` démarre en "pre_campaign", que la
  // boucle réelle ne quitte qu'après plusieurs décisions résolues via
  // `resolveCurrentChoice`. Ces tests appellent `simulateOpponentTurn`
  // isolément pour garder l'état entièrement contrôlé, donc la phase doit
  // être forcée explicitement plutôt que d'attendre la transition réelle.
  state.phase = "campaign";
}

describe("computeElectoralViability / computeBlocFragmentationPressure — sanity contre l'état réel", () => {
  it("une candidature en course ouverte (scores proches du top 2) a une viabilité nettement plus haute qu'une candidature très distancée", () => {
    const openRace = freshState("viability-open-1");
    forceUniformSupport(openRace, "ecologistes", 12);
    forceUniformSupport(openRace, "ps", 13);
    const openViability = computeElectoralViability(openRace, "ecologistes", BLOCS)!;

    const narrowPath = freshState("viability-narrow-1");
    makeWeakEcologistesWithBetterPlacedAlly(narrowPath);
    const narrowViability = computeElectoralViability(narrowPath, "ecologistes", BLOCS)!;

    expect(openViability.viability).toBeGreaterThan(narrowViability.viability);
  });

  it("la pression de fragmentation augmente quand un allié naturel est nettement mieux placé", () => {
    const state = freshState("fragmentation-1");
    makeWeakEcologistesWithBetterPlacedAlly(state);
    const fragmentation = computeBlocFragmentationPressure(state, "ecologistes", BLOCS)!;
    expect(fragmentation.bestPartnerId).toBe("ps");
    expect(fragmentation.partnerAheadMargin).toBeGreaterThan(0);
    expect(fragmentation.pressure).toBeGreaterThan(0);
  });
});

describe("maybeNegotiateStrategicWithdrawal (via simulateOpponentTurn) — désistement stratégique", () => {
  it("une candidature encore viable (course ouverte) n'ouvre jamais de négociation stratégique sur 12 décisions", () => {
    for (let seedIndex = 0; seedIndex < 10; seedIndex += 1) {
      let state = freshState(`strategic-viable-remains-${seedIndex}`);
      forceUniformSupport(state, "ecologistes", 12);
      forceUniformSupport(state, "ps", 13);
      state.phase = "campaign";
      state.decisionIndex = 8;
      for (let step = 0; step < 12; step += 1) {
        state = simulateOpponentTurn(state, BLOCS);
        state.decisionIndex += 1;
      }
      expect(state.flags["negotiation:ecologistes"]).toBeUndefined();
      expect(
        state.opponentActions.some(
          (action) => action.partyId === "ecologistes" && action.kind === "strategic_withdrawal",
        ),
      ).toBe(false);
    }
  });

  it("une candidature faible avec un allié mieux placé ouvre une négociation stratégique dans une fenêtre de graines raisonnable", () => {
    let sawOpened = false;
    for (let seedIndex = 0; seedIndex < 40 && !sawOpened; seedIndex += 1) {
      let state = freshState(`strategic-weak-negotiates-${seedIndex}`);
      makeWeakEcologistesWithBetterPlacedAlly(state);
      state.decisionIndex = 8;
      for (let step = 0; step < 12 && !sawOpened; step += 1) {
        state = simulateOpponentTurn(state, BLOCS);
        if (typeof state.flags["negotiation:ecologistes"] === "string") sawOpened = true;
        state.decisionIndex += 1;
      }
    }
    expect(sawOpened).toBe(true);
  });

  it("une négociation ouverte peut échouer (refus) autant que réussir, sur un échantillon de graines", () => {
    let successes = 0;
    let failures = 0;
    for (let seedIndex = 0; seedIndex < 120 && successes + failures < 10; seedIndex += 1) {
      let state = freshState(`strategic-outcome-${seedIndex}`);
      makeWeakEcologistesWithBetterPlacedAlly(state);
      // Relation neutre : ni garantie de succès ni d'échec, pour observer les deux issues.
      state.partyRelations.ecologistes ??= {};
      state.partyRelations.ecologistes!.ps = 0;
      state.decisionIndex = 8;
      for (let step = 0; step < 16; step += 1) {
        state = simulateOpponentTurn(state, BLOCS);
        state.decisionIndex += 1;
        const strategic = state.opponentActions.find(
          (action) => action.partyId === "ecologistes" && action.kind === "strategic_withdrawal",
        );
        const failed = state.opponentActions.find(
          (action) => action.partyId === "ecologistes" && action.kind === "negotiation_failed",
        );
        if (strategic) {
          successes += 1;
          break;
        }
        if (failed) {
          failures += 1;
          break;
        }
      }
    }
    expect(successes).toBeGreaterThan(0);
    expect(failures).toBeGreaterThan(0);
  });

  /**
   * L'ouverture d'une négociation est volontairement rare (§11 : même ordre
   * de grandeur que le retrait par effondrement, plafond ~0,05 par
   * décision) pour que la fréquence totale reste plausible à l'échelle
   * d'une campagne. Pour isoler la sensibilité de la *résolution* (relation,
   * distance idéologique) sans être dilué par cette rareté de l'ouverture,
   * ces deux tests forcent directement l'état "négociation déjà ouverte,
   * prête à se résoudre au prochain tour" plutôt que d'attendre le tirage
   * d'ouverture.
   */
  function forceNegotiationReadyToResolve(state: GameState): void {
    state.flags["negotiation:ecologistes"] = "ps";
    state.flags["negotiation_opened_at:ecologistes"] = state.decisionIndex - 3;
  }

  it("une relation très positive avec le partenaire augmente la probabilité de succès par rapport à une relation très négative", () => {
    function successRate(relation: number, attempts: number): number {
      let successes = 0;
      for (let seedIndex = 0; seedIndex < attempts; seedIndex += 1) {
        let state = freshState(`strategic-relation-${relation}-${seedIndex}`);
        makeWeakEcologistesWithBetterPlacedAlly(state);
        state.partyRelations.ecologistes ??= {};
        state.partyRelations.ecologistes!.ps = relation;
        state.decisionIndex = 11;
        forceNegotiationReadyToResolve(state);
        state = simulateOpponentTurn(state, BLOCS);
        if (
          state.opponentActions.some(
            (action) => action.partyId === "ecologistes" && action.kind === "strategic_withdrawal",
          )
        ) {
          successes += 1;
        }
      }
      return successes / attempts;
    }

    const attempts = 150;
    const highRelationRate = successRate(80, attempts);
    const lowRelationRate = successRate(-80, attempts);
    expect(highRelationRate).toBeGreaterThan(lowRelationRate);
  });

  it("une distance idéologique très grande avec le partenaire réduit la probabilité de succès par rapport à une distance faible", () => {
    function successRate(partnerEconomy: number, attempts: number): number {
      let successes = 0;
      for (let seedIndex = 0; seedIndex < attempts; seedIndex += 1) {
        let state = freshState(`strategic-distance-${partnerEconomy}-${seedIndex}`);
        makeWeakEcologistesWithBetterPlacedAlly(state);
        state.parties.ps!.perceivedIdeology.economy = partnerEconomy;
        state.decisionIndex = 11;
        forceNegotiationReadyToResolve(state);
        state = simulateOpponentTurn(state, BLOCS);
        if (
          state.opponentActions.some(
            (action) => action.partyId === "ecologistes" && action.kind === "strategic_withdrawal",
          )
        ) {
          successes += 1;
        }
      }
      return successes / attempts;
    }

    const attempts = 150;
    const ecoEconomy = gameContent.parties.find((p) => p.id === "ecologistes")!.ideology.economy;
    const closeRate = successRate(ecoEconomy, attempts);
    const farRate = successRate(ecoEconomy + 180, attempts);
    expect(closeRate).toBeGreaterThanOrEqual(farRate);
  });
});
