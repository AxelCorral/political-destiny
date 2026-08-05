import type { EventCategory, GameEventDefinition, GameState } from "@/game/types";

import { allConditionsMatch } from "./conditions";
import { narrativeChainMatches } from "./narrativeThreads";
import { weightedIndex } from "./rng";

const RARITY_WEIGHT = {
  common: 1,
  uncommon: 0.64,
  rare: 0.24,
  legendary: 0.07,
  secret: 0.012,
} as const;

const CATEGORY_TARGETS: Partial<Record<EventCategory, number>> = {
  campaign: 5,
  media: 4,
  debate: 2,
  program: 3,
  internal: 3,
  alliance: 2,
  world: 2,
  scandal: 1,
  party: 5,
};

export function isEventEligible(state: GameState, event: GameEventDefinition): boolean {
  const playerParty = state.parties[state.playerPartyId];
  if ((event.phaseWeights[state.phase] ?? 0) <= 0) return false;
  if (event.minDecisionIndex !== undefined && state.decisionIndex < event.minDecisionIndex)
    return false;
  if (event.maxDecisionIndex !== undefined && state.decisionIndex > event.maxDecisionIndex)
    return false;
  if (event.oncePerRun && state.seenEventIds.includes(event.id)) return false;
  if ((state.eventAppearanceCounts[event.id] ?? 0) >= (event.maxAppearances ?? Infinity))
    return false;
  if ((state.eventCooldowns[event.id] ?? -1) > state.decisionIndex) return false;
  if (event.eligibleParties && !event.eligibleParties.includes(state.playerPartyId)) return false;
  if (
    event.eligibleIdeologyFamilies &&
    (!playerParty?.ideologyFamily ||
      !event.eligibleIdeologyFamilies.includes(playerParty.ideologyFamily))
  )
    return false;
  if (event.excludedParties?.includes(state.playerPartyId)) return false;
  if (event.incompatibleEventIds?.some((eventId) => state.seenEventIds.includes(eventId)))
    return false;
  if (!narrativeChainMatches(state, event)) return false;
  if (event.forbiddenFlags?.some((flag) => Boolean(state.flags[flag]))) return false;
  if (event.requiredTags?.some((tag) => !Boolean(state.flags[`tag:${tag}`]))) return false;
  return allConditionsMatch(state, event.eligibility);
}

function repetitionPenalty(state: GameState, event: GameEventDefinition): number {
  const recent = state.recentCategories;
  const last = recent.at(-1);
  const beforeLast = recent.at(-2);
  if (event.category === "scandal" && last === "scandal") return 0;
  if (event.category === "media" && last === "media" && beforeLast === "media") return 0;
  if (last === event.category && beforeLast === event.category) return 0.15;
  if (last === event.category) return 0.55;
  return 1;
}

function quotaMultiplier(state: GameState, category: EventCategory): number {
  const current = state.categoryCounts[category] ?? 0;
  const target = CATEGORY_TARGETS[category] ?? 1;
  let multiplier = current < target ? 1 + (target - current) * 0.18 : 0.72;

  if (category === "debate" && state.decisionIndex >= 16 && current === 0) multiplier *= 8;
  if (category === "program" && state.decisionIndex >= 12 && current === 0) multiplier *= 6;
  if (category === "party" && current < 5) multiplier *= 1.7;
  if (category === "party" && state.decisionIndex >= 10 && current < 2) multiplier *= 4;
  return multiplier;
}

export function eventWeight(state: GameState, event: GameEventDefinition): number {
  const phaseWeight = event.phaseWeights[state.phase] ?? 0;
  return (
    event.baseWeight *
    phaseWeight *
    RARITY_WEIGHT[event.rarity] *
    quotaMultiplier(state, event.category) *
    repetitionPenalty(state, event)
  );
}

export function selectNextEvent(
  sourceState: GameState,
  events: GameEventDefinition[],
): { event: GameEventDefinition; state: GameState } {
  const queued = sourceState.queuedEventIds
    .map((id) => events.find((event) => event.id === id))
    .find((event): event is GameEventDefinition =>
      Boolean(event && isEventEligible(sourceState, event)),
    );

  if (queued) {
    return {
      event: queued,
      state: {
        ...sourceState,
        queuedEventIds: sourceState.queuedEventIds.filter((id) => id !== queued.id),
      },
    };
  }

  const eligible = events.filter((event) => isEventEligible(sourceState, event));
  if (eligible.length === 0) {
    throw new Error(
      `Aucun événement éligible pour la phase « ${sourceState.phase} » à la décision ${sourceState.decisionIndex}.`,
    );
  }

  const weights = eligible.map((event) => eventWeight(sourceState, event));
  const [index, , rng] = weightedIndex(sourceState.rng, weights);
  const event = eligible[index];
  if (!event) throw new Error("Le sélecteur pondéré n’a retourné aucun événement.");
  return { event, state: { ...sourceState, rng } };
}
