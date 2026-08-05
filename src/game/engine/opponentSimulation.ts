import type { ActorState, GameState, NewsItem, OpponentStrategy, PartyState } from "@/game/types";

import { clamp } from "./math";
import { random, randomBetween, weightedIndex } from "./rng";

const STRATEGIES: OpponentStrategy[] = [
  "consolidate_base",
  "look_presidential",
  "attack_favorite",
  "poach_neighbor",
  "media_momentum",
  "prepare_alliance",
  "limit_risk",
  "useful_vote",
  "prepare_runoff",
];

function chooseStrategy(
  party: PartyState,
  actor: ActorState | undefined,
  state: GameState,
): [OpponentStrategy, GameState] {
  const weights = STRATEGIES.map((strategy) => {
    switch (strategy) {
      case "consolidate_base":
        return Math.max(0.2, 100 - party.stats.mobilization);
      case "look_presidential":
        return Math.max(0.2, 100 - party.stats.credibility);
      case "attack_favorite":
        return Math.max(0.2, party.stats.rejection * 0.45 + (party.stats.polling < 15 ? 8 : 2));
      case "poach_neighbor":
        return Math.max(0.2, actor?.traits.tactics ?? 50);
      case "media_momentum":
        return Math.max(0.2, actor?.mediaSkill ?? 50);
      case "prepare_alliance":
        return Math.max(0.2, 100 - party.stats.cohesion + (actor?.traits.coalitionSkill ?? 50));
      case "limit_risk":
        return Math.max(0.2, party.hidden.scandalRisk + (100 - (actor?.traits.discipline ?? 50)));
      case "useful_vote":
        return state.decisionIndex > 16 ? Math.max(1, party.stats.polling) * 1.8 : 1;
      case "prepare_runoff":
        return state.phase === "between_rounds" ? 100 : Math.max(0.5, party.stats.polling - 12);
      default:
        return 1;
    }
  });
  const [index, , rng] = weightedIndex(state.rng, weights);
  return [STRATEGIES[index] ?? "consolidate_base", { ...state, rng }];
}

function applyStrategy(party: PartyState, strategy: OpponentStrategy, success: boolean): void {
  const factor = success ? 1 : -0.45;
  switch (strategy) {
    case "consolidate_base":
      party.stats.mobilization = clamp(party.stats.mobilization + 1.6 * factor);
      party.stats.mediaPresence = clamp(party.stats.mediaPresence - 0.3);
      break;
    case "look_presidential":
      party.stats.credibility = clamp(party.stats.credibility + 1.35 * factor);
      party.stats.popularity = clamp(party.stats.popularity + 0.55 * factor);
      break;
    case "attack_favorite":
      party.stats.mediaPresence = clamp(party.stats.mediaPresence + 1.25 * factor);
      party.stats.rejection = clamp(party.stats.rejection + (success ? 0.4 : 1.1));
      break;
    case "poach_neighbor":
      party.stats.momentum = clamp(party.stats.momentum + 1.45 * factor);
      party.hidden.potentialSupport = clamp(party.hidden.potentialSupport + 0.65 * factor);
      break;
    case "media_momentum":
      party.stats.mediaPresence = clamp(party.stats.mediaPresence + 1.7 * factor);
      party.stats.momentum = clamp(party.stats.momentum + 1.1 * factor);
      break;
    case "prepare_alliance":
      party.hidden.transferability = clamp(party.hidden.transferability + 1.2 * factor);
      party.stats.cohesion = clamp(party.stats.cohesion + 0.55 * factor);
      break;
    case "limit_risk":
      party.hidden.scandalRisk = clamp(party.hidden.scandalRisk - 1.4 * factor);
      party.stats.mediaPresence = clamp(party.stats.mediaPresence - 0.45);
      break;
    case "useful_vote":
      party.stats.momentum = clamp(party.stats.momentum + 1.8 * factor);
      party.stats.rejection = clamp(party.stats.rejection + (success ? 0.2 : 0.8));
      break;
    case "prepare_runoff":
      party.stats.credibility = clamp(party.stats.credibility + 1.25 * factor);
      party.hidden.transferability = clamp(party.hidden.transferability + 1.4 * factor);
      break;
  }
}

export function replaceCandidate(
  sourceState: GameState,
  partyId: string,
): { state: GameState; replacement?: ActorState } {
  const state = structuredClone(sourceState);
  const party = state.parties[partyId];
  if (!party) return { state };

  const candidates = Object.values(state.actors).filter(
    (actor) =>
      actor.partyId === partyId &&
      actor.id !== party.candidateId &&
      actor.identityKind === "fictional" &&
      actor.active &&
      !["withdrawn", "disqualified", "eliminated"].includes(actor.candidateStatus),
  );
  if (candidates.length === 0) {
    party.active = false;
    return { state };
  }

  const weights = candidates.map((actor) => {
    const ideologicalFit = Math.max(
      0,
      100 - Math.abs(actor.ideology.economy - party.ideology.economy),
    );
    return Math.max(
      0.1,
      actor.legitimacy * 0.32 +
        actor.ambition * 0.18 +
        actor.loyalty * 0.14 +
        actor.governingCredibility * 0.2 +
        ideologicalFit * 0.16,
    );
  });
  const [index, , rng] = weightedIndex(state.rng, weights);
  const replacement = candidates[index];
  if (!replacement) return { state: { ...state, rng } };

  const former = state.actors[party.candidateId];
  if (former) {
    former.candidateStatus = "withdrawn";
    former.active = false;
  }
  replacement.candidateStatus = "official";
  replacement.role = "candidate";
  party.candidateId = replacement.id;
  party.stats.cohesion = clamp(party.stats.cohesion - 5);
  party.stats.mediaPresence = clamp(party.stats.mediaPresence + 4);
  state.rng = rng;
  return { state, replacement };
}

export function simulateOpponentTurn(sourceState: GameState): GameState {
  let state = structuredClone(sourceState);
  const news: NewsItem[] = [];

  for (const party of Object.values(state.parties)) {
    if (!party.active || party.id === state.playerPartyId) continue;
    const actor = state.actors[party.candidateId];
    if (!actor?.active) continue;

    let strategy: OpponentStrategy;
    [strategy, state] = chooseStrategy(party, actor, state);
    actor.strategy = strategy;
    let successRoll: number;
    [successRoll, state.rng] = random(state.rng);
    const skill =
      (actor.traits.tactics +
        actor.mediaSkill +
        actor.governingCredibility +
        actor.traits.discipline) /
      400;
    const success = successRoll < 0.44 + skill * 0.35;
    applyStrategy(party, strategy, success);

    let crisisRoll: number;
    [crisisRoll, state.rng] = random(state.rng);
    const crisisChance = Math.max(
      0.001,
      (party.hidden.scandalRisk + (100 - party.stats.cohesion)) / 5_000,
    );
    if (crisisRoll < crisisChance && actor.identityKind === "fictional") {
      actor.legitimacy = clamp(actor.legitimacy - 12);
      party.stats.cohesion = clamp(party.stats.cohesion - 7);
      if (actor.legitimacy < 24) {
        const replaced = replaceCandidate(state, party.id);
        state = replaced.state;
        news.push({
          id: `news-${state.runId}-${state.decisionIndex}-${party.id}-replacement`,
          date: state.currentDate,
          headline: `${party.shortName} change de candidat`,
          body: replaced.replacement
            ? `${replaced.replacement.displayName}, personnalité fictive du mouvement, reprend une campagne fragilisée.`
            : "Le mouvement fictif suspend sa candidature faute de solution consensuelle.",
          tone: "neutral",
          partyId: party.id,
        });
      }
    }

    let headlineRoll: number;
    [headlineRoll, state.rng] = randomBetween(state.rng, 0, 1);
    if (headlineRoll < 0.055 && news.length < 2) {
      news.push({
        id: `news-${state.runId}-${state.decisionIndex}-${party.id}`,
        date: state.currentDate,
        headline: success
          ? `${party.shortName} gagne en rythme`
          : `${party.shortName} cherche son second souffle`,
        body: success
          ? "Une initiative de campagne de son candidat fictif améliore sa dynamique dans la course."
          : "Une séquence préparée par son équipe fictive peine à déplacer le rapport de force.",
        tone: success ? "positive" : "negative",
        partyId: party.id,
      });
    }
  }

  state.publicNews = [...news, ...state.publicNews].slice(0, 30);
  return state;
}
