import type {
  ElectorateBlocDefinition,
  ElectorateBlocId,
  ElectorateState,
  GameState,
  PartyState,
} from "@/game/types";

import { clamp, ideologyDistance, normalizePercentages } from "./math";

export function partyAppeal(
  party: PartyState,
  bloc: ElectorateBlocDefinition,
  trustModifier: number,
  usefulVoteBoost: number,
): number {
  const distance = ideologyDistance(party.perceivedIdeology, bloc.ideology);
  const ideologicalFit = Math.max(0.08, 1 - distance / 175);
  const affinity = Math.max(0.2, (party.electorateAffinity[bloc.id] ?? 50) / 50);
  // Le socle fixe la difficulté, mais il est volontairement compressé : les
  // statistiques et la confiance gagnées pendant la campagne doivent pouvoir
  // déplacer le rapport de forces sans uniformiser les affinités idéologiques.
  const competence =
    party.stats.credibility * 0.18 +
    party.stats.popularity * 0.15 +
    party.stats.mobilization * 0.09;
  // P1 (chantier ciblé, voir P1_P5_FINAL_FIXES.md section 3) : cohesion (221
  // effets dans le catalogue) et hidden.consistency (mis à jour à chaque
  // déclaration/contradiction) étaient authentiquement différenciés par la
  // stratégie de décision mais n'avaient jamais d'effet électoral — deux
  // campagnes identiques sauf sur ces deux stats produisaient le même appel.
  // Centrés sur 50 (leur valeur de calibration usuelle) pour ne rien changer
  // à la difficulté d'un parti resté neutre sur ces axes.
  const cohesionBonus = (party.stats.cohesion - 50) * 0.16;
  const consistencyBonus = (party.hidden.consistency - 50) * 0.14;
  const rejectionPenalty = party.stats.rejection * 0.15;
  const momentum = party.stats.momentum * (bloc.volatility / 100) * 0.16;
  const underdogLeverage =
    Math.max(0, 15 - party.hidden.baseSupport) * Math.max(0, party.stats.momentum - 50) * 0.06;
  const base = Math.max(0.2, 8.2 + party.hidden.baseSupport * 0.58 + party.stats.awareness * 0.02);
  const electoralReadiness = clamp(
    0.5 +
      party.stats.awareness * 0.0025 +
      party.stats.localStrength * 0.0015 +
      party.stats.electedSupport * 0.001,
    0.68,
    1,
  );

  return Math.max(
    0.01,
    base * ideologicalFit * affinity * electoralReadiness +
      competence +
      cohesionBonus +
      consistencyBonus -
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
          ? (bloc.usefulVoteSensitivity / 100) * (currentNational[party.id] ?? 0) * 0.15
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
