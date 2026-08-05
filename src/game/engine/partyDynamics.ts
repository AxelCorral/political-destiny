import type { ActorState, GameState, PartyState } from "@/game/types";

import { clamp } from "./math";

export function applyPartySplit(
  state: GameState,
  partyId: string,
  preferredActorId?: string,
): string | undefined {
  const original = state.parties[partyId];
  if (!original) return undefined;
  const possibleActors = Object.values(state.actors)
    .filter(
      (actor) =>
        actor.partyId === partyId &&
        actor.id !== original.candidateId &&
        actor.identityKind === "fictional" &&
        actor.active,
    )
    .sort((left, right) => right.ambition - left.ambition || left.id.localeCompare(right.id));
  const leader = possibleActors.find((actor) => actor.id === preferredActorId) ?? possibleActors[0];
  if (!leader) return undefined;

  const splitId = `${partyId}_dissidence_${state.decisionIndex}`;
  if (state.parties[splitId]) return splitId;
  const dissidence: PartyState = {
    ...structuredClone(original),
    id: splitId,
    displayName: `Dissidence ${original.shortName}`,
    shortName: `D-${original.shortName}`.slice(0, 16),
    visual: {
      ...original.visual,
      monogram: `D${original.visual.monogram}`.slice(0, 4),
      symbol: "◇",
    },
    stats: {
      ...structuredClone(original.stats),
      polling: original.stats.polling * 0.2,
      cohesion: clamp(original.stats.cohesion + 18),
      members: Math.round(original.stats.members * 0.18),
      electedSupport: clamp(original.stats.electedSupport * 0.22),
      finances: clamp(original.stats.finances * 0.24),
      awareness: clamp(original.stats.awareness * 0.55),
      momentum: 58,
    },
    hidden: {
      ...structuredClone(original.hidden),
      baseSupport: clamp(original.hidden.baseSupport * 0.2),
      potentialSupport: clamp(original.hidden.potentialSupport * 0.42),
      rivalAmbition: 35,
    },
    candidateId: leader.id,
    alliedWith: [],
    initialPolling: original.initialPolling * 0.2,
  };
  original.stats.polling = clamp(original.stats.polling * 0.8);
  original.stats.cohesion = clamp(original.stats.cohesion - 16);
  original.stats.members = Math.round(original.stats.members * 0.82);
  original.hidden.baseSupport = clamp(original.hidden.baseSupport * 0.8);
  original.hidden.potentialSupport = clamp(original.hidden.potentialSupport * 0.84);

  leader.partyId = splitId;
  leader.role = "candidate";
  leader.candidateStatus = "official";
  leader.loyalty = clamp(leader.loyalty - 20);
  state.parties[splitId] = dissidence;
  state.partyRelations[splitId] = {};
  for (const otherPartyId of Object.keys(state.parties)) {
    const inherited = state.partyRelations[partyId]?.[otherPartyId] ?? 0;
    const relation =
      otherPartyId === splitId ? 100 : otherPartyId === partyId ? -35 : inherited * 0.7;
    state.partyRelations[splitId][otherPartyId] = relation;
    state.partyRelations[otherPartyId] ??= {};
    state.partyRelations[otherPartyId][splitId] = relation;
  }

  for (const blocId of Object.keys(state.electorate.latentSupport) as Array<
    keyof typeof state.electorate.latentSupport
  >) {
    const support = state.electorate.latentSupport[blocId];
    const originalSupport = support[partyId] ?? 0;
    support[partyId] = originalSupport * 0.8;
    support[splitId] = originalSupport * 0.2;
    state.electorate.trustModifiers[blocId][splitId] = -3;
  }
  return splitId;
}

export function splitParty(
  sourceState: GameState,
  partyId: string,
  preferredActorId?: string,
): { state: GameState; splitParty?: PartyState; leader?: ActorState } {
  const state = structuredClone(sourceState);
  const splitId = applyPartySplit(state, partyId, preferredActorId);
  if (!splitId) return { state };
  const split = state.parties[splitId];
  const leader = split ? state.actors[split.candidateId] : undefined;
  return { state, ...(split ? { splitParty: split } : {}), ...(leader ? { leader } : {}) };
}
