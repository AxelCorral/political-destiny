import type {
  ActorState,
  GameState,
  NewsItem,
  OpponentActionRecord,
  OpponentStrategy,
  PartyState,
} from "@/game/types";

import { clamp, ideologyDistance } from "./math";
import { applyPartySplit } from "./partyDynamics";
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

function addOpponentAction(
  state: GameState,
  action: Omit<OpponentActionRecord, "decisionIndex" | "date">,
): void {
  state.opponentActions.push({
    decisionIndex: state.decisionIndex,
    date: state.currentDate,
    ...action,
  });
  state.opponentActions = state.opponentActions.slice(-80);
}

function setRelation(state: GameState, leftPartyId: string, rightPartyId: string, delta: number) {
  state.partyRelations[leftPartyId] ??= {};
  state.partyRelations[rightPartyId] ??= {};
  const next = clamp((state.partyRelations[leftPartyId][rightPartyId] ?? 0) + delta, -100, 100);
  state.partyRelations[leftPartyId][rightPartyId] = next;
  state.partyRelations[rightPartyId][leftPartyId] = next;
  return next;
}

function bestAlliancePartner(state: GameState, party: PartyState): PartyState | undefined {
  return Object.values(state.parties)
    .filter(
      (candidate) =>
        candidate.active &&
        candidate.id !== party.id &&
        candidate.id !== state.playerPartyId &&
        !party.alliedWith.includes(candidate.id),
    )
    .sort((left, right) => {
      const leftRelation = state.partyRelations[party.id]?.[left.id] ?? 0;
      const rightRelation = state.partyRelations[party.id]?.[right.id] ?? 0;
      const leftDistance = ideologyDistance(party.perceivedIdeology, left.perceivedIdeology);
      const rightDistance = ideologyDistance(party.perceivedIdeology, right.perceivedIdeology);
      return (
        rightRelation - leftRelation ||
        leftDistance - rightDistance ||
        left.id.localeCompare(right.id)
      );
    })[0];
}

function formAlliance(state: GameState, party: PartyState, partner: PartyState): void {
  if (!party.alliedWith.includes(partner.id)) party.alliedWith.push(partner.id);
  if (!partner.alliedWith.includes(party.id)) partner.alliedWith.push(party.id);
  setRelation(state, party.id, partner.id, 12);
  party.hidden.transferability = clamp(party.hidden.transferability + 3);
  partner.hidden.transferability = clamp(partner.hidden.transferability + 2);
}

function handleRunoffEndorsement(
  state: GameState,
  party: PartyState,
  actor: ActorState,
  news: NewsItem[],
): boolean {
  if (
    state.phase !== "between_rounds" ||
    state.qualifiedPartyIds?.includes(party.id) ||
    state.flags[`endorsement:${party.id}`] !== undefined
  )
    return false;
  const finalists = (state.qualifiedPartyIds ?? [])
    .map((partyId) => state.parties[partyId])
    .filter((candidate): candidate is PartyState => Boolean(candidate));
  if (finalists.length !== 2) return false;
  const ranked = finalists
    .map((finalist) => ({
      finalist,
      score:
        (state.partyRelations[party.id]?.[finalist.id] ?? 0) * 0.7 -
        ideologyDistance(party.perceivedIdeology, finalist.perceivedIdeology) * 0.55 -
        finalist.stats.rejection * 0.12,
    }))
    .sort(
      (left, right) =>
        right.score - left.score || left.finalist.id.localeCompare(right.finalist.id),
    );
  const preferred = ranked[0];
  if (!preferred) return false;
  let roll: number;
  [roll, state.rng] = random(state.rng);
  const supports = preferred.score > -30 && roll < clamp(0.45 + preferred.score / 180, 0.18, 0.82);
  state.flags[`endorsement:${party.id}`] = supports ? preferred.finalist.id : "neutral";
  actor.candidateStatus = "eliminated";
  if (!supports) return true;
  setRelation(state, party.id, preferred.finalist.id, 8);
  addOpponentAction(state, {
    actorId: actor.id,
    partyId: party.id,
    kind: "endorsement",
    summary: `${party.shortName} appelle à soutenir ${preferred.finalist.shortName} au second tour simulé.`,
  });
  if (news.length < 2)
    news.push({
      id: `news-${state.runId}-${state.decisionIndex}-${party.id}-endorsement`,
      date: state.currentDate,
      headline: `${party.shortName} choisit son camp pour le second tour`,
      body: `La candidature fictive éliminée apporte son soutien à ${preferred.finalist.shortName}. Cette consigne pèsera sur les reports sans les garantir.`,
      tone: "neutral",
      partyId: party.id,
    });
  return true;
}

function maybeWithdrawAndRally(
  state: GameState,
  party: PartyState,
  actor: ActorState,
  news: NewsItem[],
): boolean {
  if (
    state.decisionIndex < 18 ||
    !["campaign", "official_campaign"].includes(state.phase) ||
    party.stats.polling >= 2 ||
    actor.legitimacy >= 35
  )
    return false;
  let roll: number;
  [roll, state.rng] = random(state.rng);
  const chance = clamp(
    0.008 + (2 - party.stats.polling) * 0.018 + (35 - actor.legitimacy) * 0.0012,
    0.008,
    0.08,
  );
  if (roll >= chance) return false;
  const partner = bestAlliancePartner(state, party);
  actor.candidateStatus = "withdrawn";
  actor.active = false;
  party.active = false;
  addOpponentAction(state, {
    actorId: actor.id,
    partyId: party.id,
    kind: "withdrawal",
    summary: `${party.shortName} retire sa candidature fictive après une campagne devenue sans issue.`,
  });
  if (partner && (state.partyRelations[party.id]?.[partner.id] ?? 0) > 0) {
    state.flags[`rallying:${party.id}`] = partner.id;
    actor.partyId = partner.id;
    actor.role = "ally";
    setRelation(state, party.id, partner.id, 10);
    addOpponentAction(state, {
      actorId: actor.id,
      partyId: party.id,
      kind: "rallying",
      summary: `L’ancienne tête de liste fictive de ${party.shortName} rejoint la campagne ${partner.shortName}.`,
    });
  }
  if (news.length < 2)
    news.push({
      id: `news-${state.runId}-${state.decisionIndex}-${party.id}-withdrawal`,
      date: state.currentDate,
      headline: `${party.shortName} retire sa candidature simulée`,
      body: partner
        ? `Son candidat fictif se rapproche désormais de ${partner.shortName}.`
        : "Son équipe fictive ne donne aucune consigne immédiate.",
      tone: "neutral",
      partyId: party.id,
    });
  return true;
}

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
    if (handleRunoffEndorsement(state, party, actor, news)) continue;
    if (maybeWithdrawAndRally(state, party, actor, news)) continue;

    const previousStrategy = actor.strategy;
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

    if (strategy !== previousStrategy && state.decisionIndex % 3 === 0) {
      addOpponentAction(state, {
        actorId: actor.id,
        partyId: party.id,
        kind: "strategy",
        summary: `${party.shortName} réoriente sa campagne vers la stratégie « ${strategy.replaceAll("_", " ")} ».`,
      });
    }

    if (strategy === "prepare_alliance" && success) {
      const partner = bestAlliancePartner(state, party);
      if (partner) {
        const relation = setRelation(
          state,
          party.id,
          partner.id,
          1.5 + actor.traits.coalitionSkill / 50,
        );
        let allianceRoll: number;
        [allianceRoll, state.rng] = random(state.rng);
        if (relation >= 42 && allianceRoll < 0.18) {
          formAlliance(state, party, partner);
          addOpponentAction(state, {
            actorId: actor.id,
            partyId: party.id,
            kind: "alliance",
            summary: `${party.shortName} et ${partner.shortName} concluent un accord de campagne simulé.`,
          });
          if (news.length < 2)
            news.push({
              id: `news-${state.runId}-${state.decisionIndex}-${party.id}-alliance`,
              date: state.currentDate,
              headline: `${party.shortName} et ${partner.shortName} trouvent un accord`,
              body: "Les deux équipes fictives coordonnent une partie de leur campagne et préparent leurs reports de voix.",
              tone: "neutral",
              partyId: party.id,
            });
        }
      }
    }

    let crisisRoll: number;
    [crisisRoll, state.rng] = random(state.rng);
    const crisisChance = Math.max(
      0.001,
      (party.hidden.scandalRisk + (100 - party.stats.cohesion)) / 6_000,
    );
    if (crisisRoll < crisisChance && actor.identityKind === "fictional") {
      let severity: number;
      [severity, state.rng] = randomBetween(state.rng, 8, 20);
      actor.legitimacy = clamp(actor.legitimacy - severity);
      party.stats.cohesion = clamp(party.stats.cohesion - severity * 0.45);
      addOpponentAction(state, {
        actorId: actor.id,
        partyId: party.id,
        kind: "crisis",
        summary: `Une crise interne fictive fragilise la légitimité de la candidature ${party.shortName}.`,
      });
      let replacementRoll: number;
      [replacementRoll, state.rng] = random(state.rng);
      if (actor.legitimacy < 30 || (state.decisionIndex >= 5 && replacementRoll < 0.025)) {
        const replaced = replaceCandidate(state, party.id);
        state = replaced.state;
        addOpponentAction(state, {
          actorId: replaced.replacement?.id ?? actor.id,
          partyId: party.id,
          kind: replaced.replacement
            ? state.decisionIndex < 8
              ? "primary"
              : "replacement"
            : "withdrawal",
          summary: replaced.replacement
            ? `${replaced.replacement.displayName}, personnage fictif, remplace la tête de campagne ${party.shortName}.`
            : `${party.shortName} retire sa candidature simulée faute de remplaçant disponible.`,
        });
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
      } else if (party.stats.cohesion < 28 && party.hidden.rivalAmbition > 68) {
        let splitRoll: number;
        [splitRoll, state.rng] = random(state.rng);
        if (splitRoll < 0.08) {
          const splitId = applyPartySplit(state, party.id);
          if (splitId) {
            addOpponentAction(state, {
              actorId: state.parties[splitId]!.candidateId,
              partyId: party.id,
              kind: "dissidence",
              summary: `Une aile fictive de ${party.shortName} lance une candidature dissidente.`,
            });
          }
        }
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

  if (state.decisionIndex % 4 === 0 && news.length === 0) {
    const latest = [...state.opponentActions]
      .reverse()
      .filter((action) => action.decisionIndex >= state.decisionIndex - 3)
      .slice(0, 2);
    if (latest.length > 0) {
      news.push({
        id: `news-${state.runId}-${state.decisionIndex}-opponent-brief`,
        date: state.currentDate,
        headline: "Les campagnes adverses ajustent leur ligne",
        body: latest.map((action) => action.summary).join(" "),
        tone: "neutral",
      });
    }
  }

  state.publicNews = [...news, ...state.publicNews].slice(0, 30);
  return state;
}
