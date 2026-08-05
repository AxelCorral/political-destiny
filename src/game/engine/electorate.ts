import type {
  ElectorateBlocDefinition,
  ElectorateBlocId,
  ElectorateState,
  GameState,
  PartyState,
} from "@/game/types";

import { ideologyDistance, normalizePercentages } from "./math";

function partyAppeal(
  party: PartyState,
  bloc: ElectorateBlocDefinition,
  trustModifier: number,
  usefulVoteBoost: number,
): number {
  const distance = ideologyDistance(party.perceivedIdeology, bloc.ideology);
  const ideologicalFit = Math.max(0.08, 1 - distance / 175);
  const affinity = Math.max(0.2, (party.electorateAffinity[bloc.id] ?? 50) / 50);
  // Le socle doit rester structurant : sans ce terme, un positionnement central
  // devient mécaniquement dominant dans tous les blocs, quelle que soit la partie.
  const competence =
    party.stats.credibility * 0.12 + party.stats.popularity * 0.1 + party.stats.mobilization * 0.06;
  const rejectionPenalty = party.stats.rejection * 0.09;
  const momentum = party.stats.momentum * (bloc.volatility / 100) * 0.12;
  const underdogLeverage =
    Math.max(0, 15 - party.hidden.baseSupport) * Math.max(0, party.stats.momentum - 50) * 0.03;
  const base = Math.max(0.2, party.hidden.baseSupport * 1.5 + party.stats.awareness * 0.025);

  return Math.max(
    0.01,
    base * ideologicalFit * affinity +
      competence -
      rejectionPenalty +
      momentum +
      underdogLeverage +
      trustModifier +
      usefulVoteBoost,
  );
}

export function initializeElectorate(
  parties: Record<string, PartyState>,
  blocs: ElectorateBlocDefinition[],
): ElectorateState {
  const latentSupport = {} as ElectorateState["latentSupport"];
  const turnoutByBloc = {} as Record<ElectorateBlocId, number>;
  const undecidedByBloc = {} as Record<ElectorateBlocId, number>;
  const trustModifiers = {} as ElectorateState["trustModifiers"];

  for (const bloc of blocs) {
    const raw: Record<string, number> = {};
    const trust: Record<string, number> = {};
    for (const party of Object.values(parties)) {
      trust[party.id] = 0;
      raw[party.id] = partyAppeal(party, bloc, 0, 0);
    }
    latentSupport[bloc.id] = normalizePercentages(raw, 3);
    trustModifiers[bloc.id] = trust;
    turnoutByBloc[bloc.id] = bloc.turnout;
    undecidedByBloc[bloc.id] = Math.min(30, 8 + bloc.volatility * 0.16);
  }

  return { latentSupport, turnoutByBloc, undecidedByBloc, trustModifiers };
}

export function nationalLatentSupport(
  state: GameState,
  blocs: ElectorateBlocDefinition[],
): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(
    Object.keys(state.parties).map((partyId) => [partyId, 0]),
  );

  for (const bloc of blocs) {
    const turnout = (state.electorate.turnoutByBloc[bloc.id] ?? bloc.turnout) / 100;
    const undecided = (state.electorate.undecidedByBloc[bloc.id] ?? 0) / 100;
    const expressedWeight = bloc.weight * turnout * (1 - undecided);
    const supports = state.electorate.latentSupport[bloc.id];
    for (const partyId of Object.keys(totals)) {
      const party = state.parties[partyId];
      if (!party?.active) continue;
      totals[partyId] =
        (totals[partyId] ?? 0) + ((supports?.[partyId] ?? 0) / 100) * expressedWeight;
    }
  }
  return normalizePercentages(totals, 3);
}

export function recalculateElectorate(
  sourceState: GameState,
  blocs: ElectorateBlocDefinition[],
  usefulVote = false,
): GameState {
  const state = structuredClone(sourceState);
  const currentNational = nationalLatentSupport(state, blocs);
  const leaders = Object.entries(currentNational)
    .filter(([partyId]) => state.parties[partyId]?.active)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([partyId]) => partyId);

  for (const bloc of blocs) {
    const raw: Record<string, number> = {};
    for (const party of Object.values(state.parties)) {
      if (!party.active) {
        raw[party.id] = 0;
        continue;
      }
      const usefulVoteBoost =
        usefulVote && leaders.includes(party.id)
          ? (bloc.usefulVoteSensitivity / 100) * (currentNational[party.id] ?? 0) * 0.55
          : 0;
      const trust = state.electorate.trustModifiers[bloc.id]?.[party.id] ?? 0;
      const freshAppeal = partyAppeal(party, bloc, trust, usefulVoteBoost);
      const previous = state.electorate.latentSupport[bloc.id]?.[party.id] ?? 0;
      raw[party.id] = previous * 0.62 + freshAppeal * 0.38;
    }
    state.electorate.latentSupport[bloc.id] = normalizePercentages(raw, 3);
    state.electorate.undecidedByBloc[bloc.id] = Math.max(
      2,
      (state.electorate.undecidedByBloc[bloc.id] ?? 10) - (usefulVote ? 2.8 : 0.42),
    );
  }

  const national = nationalLatentSupport(state, blocs);
  for (const party of Object.values(state.parties)) {
    party.stats.polling = national[party.id] ?? 0;
  }
  return state;
}
