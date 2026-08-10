import { GAME_CONFIG } from "@/config/game";
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

// Passe ciblée post-fun (TARGETED_GAMEPLAY_PASS_REPORT.md), Phase D — le
// premier essai de tension de fin de campagne (Phase G de la mission
// précédente) se limitait à des ajustements de valeurs sur des événements
// isolés et n'a pas déplacé la tension agrégée (intensité dernier décile
// 4,897 -> 4,909, retournements 0,133 -> 0,120 : quasiment plat). Lecture du
// sélecteur : eventWeight() ne contient ici aucun terme sensible ni à la
// proximité de la fin de campagne, ni à la proximité du seuil de
// qualification — un événement de routine et un duel décisif rivalisent à
// poids égal (hors quota/répétition) que la course soit à ±0,5 pt ou à
// ±8 pts. C'est ce déséquilibre structurel, pas un manque de points
// d'intensité sur quelques cartes, que ce facteur corrige.
const LATE_GAME_PROGRESS_THRESHOLD = 0.72;
const CLOSE_RACE_MARGIN_POINTS = 3;

export function lateGameRelevanceMultiplier(state: GameState, event: GameEventDefinition): number {
  if (state.phase !== "campaign" && state.phase !== "official_campaign") return 1;
  // Proportion parcourue du budget de décisions AVANT le premier tour
  // spécifiquement (pas du total sur toute la partie, qui inclurait
  // l'entre-deux-tours et le gouvernement et rendrait ce seuil quasi
  // inatteignable pendant la phase de campagne elle-même).
  const progress = state.decisionIndex / GAME_CONFIG.targetDecisionsBeforeFirstRound;
  if (progress < LATE_GAME_PROGRESS_THRESHOLD) return 1;

  let multiplier = 1;

  // Résolution d'une chaîne narrative active : les follow-ups programmés
  // (queuedEventIds) passent déjà devant le pool pondéré, ce facteur porte
  // sur les AUTRES événements qui partagent une chaîne encore active.
  if (event.chain) {
    const thread = state.narrativeThreads[event.chain.id];
    if (thread && thread.status === "active") multiplier *= 1.55;
  }

  // Duel direct avec un adversaire (débat) : le format le plus explicitement
  // confrontationnel du jeu, sous-représenté en fin de course sans ce terme.
  if (event.category === "debate") multiplier *= 1.35;

  // Crise interne non résolue à enjeu réel, plutôt qu'un simple breather.
  if (
    event.category === "internal" &&
    (event.importance === "decisive" || event.importance === "major")
  ) {
    multiplier *= 1.3;
  }

  // Enjeu de qualification : le joueur se trouve à proximité immédiate du
  // seuil de qualification (2e/3e position dans le dernier sondage connu).
  const latestPoll = state.pollHistory.at(-1);
  if (latestPoll) {
    const ranked = Object.entries(latestPoll.results).sort((a, b) => b[1] - a[1]);
    const playerRankIndex = ranked.findIndex(([partyId]) => partyId === state.playerPartyId);
    if (playerRankIndex === 1 || playerRankIndex === 2) {
      const boundaryScore = ranked[1]?.[1] ?? 0;
      const playerScore = ranked[playerRankIndex]?.[1] ?? 0;
      const gap =
        playerRankIndex === 1 ? boundaryScore - (ranked[2]?.[1] ?? 0) : boundaryScore - playerScore;
      if (
        Math.abs(gap) <= CLOSE_RACE_MARGIN_POINTS &&
        (event.importance === "decisive" || event.importance === "major")
      ) {
        multiplier *= 1.25;
      }
    }
  }

  // Note sur « conséquence différée arrivée à maturité » (§9.3 du prompt) :
  // les follow-ups de chaîne programmés (outcome.followUps) passent déjà en
  // priorité absolue par queuedEventIds dans selectNextEvent(), avant même
  // d'atteindre ce pool pondéré — ils n'ont donc pas besoin d'un facteur
  // supplémentaire ici. Les delayedEffects (DelayedEffectDefinition) ne sont
  // en revanche pas des événements sélectionnables : ce sont des effets de
  // jauge appliqués automatiquement, sans carte associée à pondérer.

  return multiplier;
}

export function eventWeight(state: GameState, event: GameEventDefinition): number {
  const phaseWeight = event.phaseWeights[state.phase] ?? 0;
  return (
    event.baseWeight *
    phaseWeight *
    RARITY_WEIGHT[event.rarity] *
    quotaMultiplier(state, event.category) *
    repetitionPenalty(state, event) *
    lateGameRelevanceMultiplier(state, event)
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
