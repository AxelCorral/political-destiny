import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { createGame } from "../game";
import {
  narrativeChainMatches,
  recordNarrativeProgress,
  releaseDueScheduledEvents,
  scheduleEventFollowUps,
} from "../narrativeThreads";

function stateForThreads() {
  return createGame(
    { seed: "chaînes", mode: "existing_party", partyId: "alpha", methodId: "field" },
    testContent,
  );
}

describe("chaînes narratives", () => {
  it("libère une suite au bon index et respecte sa probabilité", () => {
    const state = scheduleEventFollowUps(stateForThreads(), "origine", [
      { eventId: "fixture_program", afterDecisions: 2, probability: 1 },
      { eventId: "fixture_debate", afterDecisions: 2, probability: 0 },
    ]);
    state.decisionIndex = 1;
    expect(releaseDueScheduledEvents(state).queuedEventIds).not.toContain("fixture_program");
    state.decisionIndex = 2;
    const released = releaseDueScheduledEvents(state);
    expect(released.queuedEventIds).toContain("fixture_program");
    expect(released.queuedEventIds).not.toContain("fixture_debate");
    expect(released.scheduledEvents).toEqual([]);
  });

  it("bloque une étape tant que son antécédent et son délai manquent", () => {
    const event = structuredClone(testContent.events[1]!);
    event.chain = {
      id: "crise_interne",
      step: 2,
      followsEventIds: ["fixture_campaign"],
      minimumDelay: 2,
      maximumDelay: 5,
    };
    const state = stateForThreads();
    expect(narrativeChainMatches(state, event)).toBe(false);
    state.decisionIndex = 3;
    state.decisionHistory.push({
      decisionIndex: 2,
      date: state.currentDate,
      eventId: "fixture_campaign",
      eventTitle: "Origine",
      eventCategory: "campaign",
      choiceId: "action",
      choiceLabel: "Publier une première réponse complète",
      outcomeId: "effet",
      outcomeTitle: "Réponse publiée",
      narrative: "La première étape de la chaîne est désormais inscrite dans la campagne.",
      visibleEffects: [],
      internalRoll: 0.5,
      internalProbabilities: { effet: 1 },
    });
    expect(narrativeChainMatches(state, event)).toBe(false);
    state.decisionIndex = 4;
    expect(narrativeChainMatches(state, event)).toBe(true);
  });

  it("conserve la progression et résout la dernière étape", () => {
    const first = structuredClone(testContent.events[0]!);
    const second = structuredClone(testContent.events[1]!);
    first.chain = { id: "fil_test", step: 1 };
    second.chain = { id: "fil_test", step: 2, followsEventIds: [first.id] };
    let state = recordNarrativeProgress(stateForThreads(), first, [first, second]);
    expect(state.narrativeThreads.fil_test?.status).toBe("active");
    state = recordNarrativeProgress(state, second, [first, second]);
    expect(state.narrativeThreads.fil_test?.status).toBe("resolved");
    expect(state.narrativeThreads.fil_test?.history).toEqual([first.id, second.id]);
  });
});
