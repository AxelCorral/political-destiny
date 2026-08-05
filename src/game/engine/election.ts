import type {
  ElectionRoundResult,
  ElectorateBlocDefinition,
  GameState,
  RegionId,
  RegionalResult,
} from "@/game/types";

import { nationalLatentSupport, recalculateElectorate } from "./electorate";
import { clamp, ideologyDistance, normalizePercentages, round } from "./math";
import { randomBetween } from "./rng";

const REGIONS: RegionId[] = [
  "ile_de_france",
  "north",
  "east",
  "west",
  "south_west",
  "south_east",
  "central",
  "overseas",
];

function ranking(results: Record<string, number>): string[] {
  return Object.keys(results).sort(
    (left, right) => (results[right] ?? 0) - (results[left] ?? 0) || left.localeCompare(right),
  );
}

function regionalResults(state: GameState, national: Record<string, number>): RegionalResult[] {
  return REGIONS.map((regionId) => {
    const raw: Record<string, number> = {};
    for (const party of Object.values(state.parties)) {
      if (!party.active || (national[party.id] ?? 0) <= 0) continue;
      const affinity = party.regionalAffinity[regionId] ?? 50;
      raw[party.id] = (national[party.id] ?? 0) * (0.68 + affinity / 160);
    }
    const results = normalizePercentages(raw, 1);
    return { regionId, winnerPartyId: ranking(results)[0] ?? state.playerPartyId, results };
  });
}

export function simulateFirstRound(
  sourceState: GameState,
  blocs: ElectorateBlocDefinition[],
): { state: GameState; result: ElectionRoundResult; finalists: [string, string] } {
  const state = recalculateElectorate(sourceState, blocs, true);
  const latent = nationalLatentSupport(state, blocs);
  const raw: Record<string, number> = {};
  let rng = state.rng;

  for (const party of Object.values(state.parties)) {
    if (!party.active) continue;
    const actor = state.actors[party.candidateId];
    if (actor && ["withdrawn", "disqualified", "eliminated"].includes(actor.candidateStatus))
      continue;
    let noise: number;
    // Le bruit du scrutin reste inférieur au bruit maximal des sondages et
    // représente surtout mobilisation et indécision de dernière heure.
    [noise, rng] = randomBetween(rng, -3.2, 3.2);
    const mobilizationFactor = 0.9 + party.stats.mobilization / 500;
    raw[party.id] = Math.max(0.01, (latent[party.id] ?? 0) * mobilizationFactor + noise);
  }

  const results = normalizePercentages(raw, 1);
  const ordered = ranking(results);
  const first = ordered[0];
  const second = ordered[1];
  if (!first || !second || first === second)
    throw new Error("Le premier tour n’a pas produit deux finalistes distincts.");

  const turnout = round(
    clamp(
      blocs.reduce(
        (sum, bloc) =>
          sum + (state.electorate.turnoutByBloc[bloc.id] ?? bloc.turnout) * (bloc.weight / 100),
        0,
      ) +
        state.world.turnoutMood * 0.04,
      52,
      88,
    ),
    1,
  );
  const result: ElectionRoundResult = {
    round: 1,
    date: state.electionDate,
    results,
    ranking: ordered,
    regionalResults: regionalResults(state, results),
    turnout,
  };
  state.rng = rng;
  state.firstRoundResult = result;
  state.qualifiedPartyIds = [first, second];
  for (const partyId of ordered.slice(2)) {
    const actor = state.actors[state.parties[partyId]?.candidateId ?? ""];
    if (actor) actor.candidateStatus = "eliminated";
  }
  return { state, result, finalists: [first, second] };
}

export function simulateSecondRound(
  sourceState: GameState,
  blocs: ElectorateBlocDefinition[],
): { state: GameState; result: ElectionRoundResult; winnerPartyId: string } {
  const state = structuredClone(sourceState);
  const finalists = state.qualifiedPartyIds;
  if (!finalists || finalists[0] === finalists[1])
    throw new Error("Deux finalistes distincts sont requis pour le second tour.");
  const [leftId, rightId] = finalists;
  const left = state.parties[leftId];
  const right = state.parties[rightId];
  if (!left || !right) throw new Error("Un finaliste est absent de l’état de partie.");

  let leftTotal = 0;
  let rightTotal = 0;
  for (const bloc of blocs) {
    const leftDistance = ideologyDistance(left.perceivedIdeology, bloc.ideology);
    const rightDistance = ideologyDistance(right.perceivedIdeology, bloc.ideology);
    const leftAlliance = left.alliedWith.reduce(
      (sum, id) => sum + (state.firstRoundResult?.results[id] ?? 0),
      0,
    );
    const rightAlliance = right.alliedWith.reduce(
      (sum, id) => sum + (state.firstRoundResult?.results[id] ?? 0),
      0,
    );
    const leftFirstRound = state.firstRoundResult?.results[leftId] ?? 0;
    const rightFirstRound = state.firstRoundResult?.results[rightId] ?? 0;
    const leftAppeal = Math.max(
      0.05,
      60 +
        leftFirstRound * 2.2 -
        leftDistance * 0.3 -
        left.stats.rejection * 0.14 +
        left.stats.credibility * 0.25 +
        left.stats.mobilization * 0.15 +
        left.hidden.transferability * 0.25 +
        leftAlliance * 0.25,
    );
    const rightAppeal = Math.max(
      0.05,
      60 +
        rightFirstRound * 2.2 -
        rightDistance * 0.3 -
        right.stats.rejection * 0.14 +
        right.stats.credibility * 0.25 +
        right.stats.mobilization * 0.15 +
        right.hidden.transferability * 0.25 +
        rightAlliance * 0.25,
    );
    const total = leftAppeal + rightAppeal;
    const participation = (state.electorate.turnoutByBloc[bloc.id] ?? bloc.turnout) / 100;
    leftTotal += (leftAppeal / total) * bloc.weight * participation;
    rightTotal += (rightAppeal / total) * bloc.weight * participation;
  }

  let rng = state.rng;
  // Au duel final, l'incertitude porte sur les reports et l'abstention : ces
  // valeurs sont des masses de blocs avant normalisation, pas des points publiés.
  const [leftNoise, nextRng] = randomBetween(rng, -6.5, 6.5);
  rng = nextRng;
  const results = normalizePercentages(
    {
      [leftId]: Math.max(0.1, leftTotal + leftNoise),
      [rightId]: Math.max(0.1, rightTotal - leftNoise),
    },
    1,
  );
  const ordered = ranking(results);
  const winnerPartyId = ordered[0];
  if (!winnerPartyId) throw new Error("Le second tour n’a produit aucun vainqueur.");

  const result: ElectionRoundResult = {
    round: 2,
    date: state.electionDate,
    results,
    ranking: ordered,
    regionalResults: regionalResults(state, results),
    turnout: round(clamp((state.firstRoundResult?.turnout ?? 70) + 2.4, 55, 90), 1),
  };
  state.rng = rng;
  state.secondRoundResult = result;
  return { state, result, winnerPartyId };
}
