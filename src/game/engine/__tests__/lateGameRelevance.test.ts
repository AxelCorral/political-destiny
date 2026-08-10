import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";
import type { GameEventDefinition, GameState } from "@/game/types";

import { createGame } from "../game";
import { eventWeight, lateGameRelevanceMultiplier } from "../eventSelector";

/**
 * Passe ciblée post-fun (TARGETED_GAMEPLAY_PASS_REPORT.md), Phase D — le
 * facteur de pertinence tardive ajouté à eventSelector.ts. Vérifie qu'il ne
 * s'applique qu'en fin de campagne, qu'il favorise réellement les chaînes
 * actives / débats / crises internes décisives / enjeux de qualification
 * proches, et qu'il reste borné (jamais de multiplicateur démesuré, jamais
 * de suppression totale des événements de routine — les « breathers »
 * restent sélectionnables, juste relativement moins souvent tirés).
 */

function baseState(): GameState {
  const state = createGame(
    { seed: "late-game", mode: "existing_party", partyId: "alpha", methodId: "field" },
    testContent,
  );
  state.phase = "campaign";
  state.maxTargetDecisions = 24;
  return state;
}

function routineEvent(overrides: Partial<GameEventDefinition> = {}): GameEventDefinition {
  return {
    ...structuredClone(testContent.events[0]!),
    id: "test_routine_event",
    category: "campaign",
    importance: "notable",
    chain: undefined,
    ...overrides,
  };
}

describe("lateGameRelevanceMultiplier", () => {
  it("ne s'applique pas hors des phases de campagne", () => {
    const state = baseState();
    state.phase = "between_rounds";
    state.decisionIndex = 23;
    expect(lateGameRelevanceMultiplier(state, routineEvent({ category: "debate" }))).toBe(1);
  });

  it("ne s'applique pas avant le dernier tiers de la campagne", () => {
    const state = baseState();
    state.decisionIndex = 5;
    expect(lateGameRelevanceMultiplier(state, routineEvent({ category: "debate" }))).toBe(1);
  });

  it("favorise un débat en fin de campagne", () => {
    const state = baseState();
    state.decisionIndex = 20;
    const debateWeight = lateGameRelevanceMultiplier(state, routineEvent({ category: "debate" }));
    const campaignWeight = lateGameRelevanceMultiplier(
      state,
      routineEvent({ category: "campaign" }),
    );
    expect(debateWeight).toBeGreaterThan(campaignWeight);
    expect(debateWeight).toBeGreaterThan(1);
  });

  it("favorise une chaîne narrative active mais pas une chaîne déjà résolue", () => {
    const state = baseState();
    state.decisionIndex = 20;
    state.narrativeThreads.test_chain = {
      id: "test_chain",
      currentStep: 1,
      status: "active",
      startedAtDecisionIndex: 10,
      lastEventId: "some_event",
      history: ["some_event"],
    };
    const activeEvent = routineEvent({ chain: { id: "test_chain", step: 2 } });
    const resolvedEvent = routineEvent({ chain: { id: "test_chain_resolved", step: 2 } });
    expect(lateGameRelevanceMultiplier(state, activeEvent)).toBeGreaterThan(
      lateGameRelevanceMultiplier(state, resolvedEvent),
    );
  });

  it("favorise une crise interne décisive/majeure mais pas une crise interne notable", () => {
    const state = baseState();
    state.decisionIndex = 20;
    const decisive = routineEvent({ category: "internal", importance: "decisive" });
    const notable = routineEvent({ category: "internal", importance: "notable" });
    expect(lateGameRelevanceMultiplier(state, decisive)).toBeGreaterThan(
      lateGameRelevanceMultiplier(state, notable),
    );
  });

  it("favorise un événement décisif quand le joueur est à moins de 3 points du seuil de qualification", () => {
    const state = baseState();
    state.decisionIndex = 20;
    state.pollHistory = [
      {
        id: "poll-1",
        date: state.currentDate,
        decisionIndex: 19,
        instituteLabel: "Institut de test",
        results: { alpha: 20, beta: 21, gamma: 19, delta: 15 },
        playerRank: 2,
        playerTrend: 0,
      },
    ];
    const decisive = routineEvent({ importance: "decisive" });
    const notable = routineEvent({ importance: "notable" });
    expect(lateGameRelevanceMultiplier(state, decisive)).toBeGreaterThan(1);
    // Un événement non decisive/major ne profite pas de ce terme de qualification.
    expect(lateGameRelevanceMultiplier(state, notable)).toBe(1);
  });

  it("n'avantage pas un enjeu de qualification quand l'écart est large (> 3 points)", () => {
    const state = baseState();
    state.decisionIndex = 20;
    state.pollHistory = [
      {
        id: "poll-1",
        date: state.currentDate,
        decisionIndex: 19,
        instituteLabel: "Institut de test",
        results: { alpha: 10, beta: 30, gamma: 25, delta: 15 },
        playerRank: 3,
        playerTrend: 0,
      },
    ];
    const decisive = routineEvent({ importance: "decisive" });
    expect(lateGameRelevanceMultiplier(state, decisive)).toBe(1);
  });

  it("reste borné : le cumul de tous les facteurs ne dépasse jamais x4", () => {
    const state = baseState();
    state.decisionIndex = 20;
    state.narrativeThreads.test_chain = {
      id: "test_chain",
      currentStep: 1,
      status: "active",
      startedAtDecisionIndex: 10,
      lastEventId: "some_event",
      history: ["some_event"],
    };
    state.pollHistory = [
      {
        id: "poll-1",
        date: state.currentDate,
        decisionIndex: 19,
        instituteLabel: "Institut de test",
        results: { alpha: 20, beta: 21, gamma: 19, delta: 15 },
        playerRank: 2,
        playerTrend: 0,
      },
    ];
    const maximal = routineEvent({
      category: "debate",
      importance: "decisive",
      chain: { id: "test_chain", step: 2 },
    });
    expect(lateGameRelevanceMultiplier(state, maximal)).toBeLessThan(4);
  });

  it("ne supprime jamais un événement de routine du pool pondéré (multiplicateur > 0)", () => {
    const state = baseState();
    state.decisionIndex = 22;
    const routine = routineEvent({ category: "media", importance: "notable" });
    expect(lateGameRelevanceMultiplier(state, routine)).toBeGreaterThan(0);
  });

  it("eventWeight() intègre bien ce facteur (le poids total augmente en fin de course pour un débat)", () => {
    const state = baseState();
    const debate = routineEvent({ category: "debate", baseWeight: 1 });
    state.decisionIndex = 5;
    const earlyWeight = eventWeight(state, debate);
    state.decisionIndex = 21;
    const lateWeight = eventWeight(state, debate);
    expect(lateWeight).toBeGreaterThan(earlyWeight);
  });
});
