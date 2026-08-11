import type { ElectorateBlocDefinition, GameState, PollSnapshot } from "@/game/types";

import { normalizePercentages, round } from "./math";
import { isElectorallyActive, nationalLatentSupport } from "./electorate";
import { randomBetween, randomInt } from "./rng";

const FICTIONAL_INSTITUTES = [
  "Observatoire Hexagone",
  "Baromètre Civique",
  "Institut Agora",
  "Panel République",
];

export function generatePoll(
  sourceState: GameState,
  blocs: ElectorateBlocDefinition[],
): { state: GameState; poll: PollSnapshot } {
  const state = structuredClone(sourceState);
  const truth = nationalLatentSupport(state, blocs);
  const previousPoll = state.pollHistory.at(-1);
  const noisy: Record<string, number> = {};
  let rng = state.rng;

  for (const party of Object.values(state.parties)) {
    if (!isElectorallyActive(state, party.id)) {
      noisy[party.id] = 0;
      continue;
    }
    let noise: number;
    [noise, rng] = randomBetween(rng, -3.8, 3.8);
    const lagged = previousPoll?.results[party.id] ?? truth[party.id] ?? 0;
    noisy[party.id] = Math.max(0, (truth[party.id] ?? 0) * 0.72 + lagged * 0.28 + noise);
  }

  const results = normalizePercentages(noisy, 1);
  const ranking = Object.keys(results).sort(
    (left, right) => (results[right] ?? 0) - (results[left] ?? 0) || left.localeCompare(right),
  );
  const [instituteIndex, nextRng] = randomInt(rng, 0, FICTIONAL_INSTITUTES.length - 1);
  rng = nextRng;
  const previousPlayerScore =
    previousPoll?.results[state.playerPartyId] ?? results[state.playerPartyId] ?? 0;
  const currentPlayerScore = results[state.playerPartyId] ?? 0;
  const poll: PollSnapshot = {
    id: `poll-${state.runId}-${state.decisionIndex}`,
    date: state.currentDate,
    decisionIndex: state.decisionIndex,
    instituteLabel:
      FICTIONAL_INSTITUTES[instituteIndex] ?? FICTIONAL_INSTITUTES[0] ?? "Panel d’opinion",
    results,
    playerRank: Math.max(1, ranking.indexOf(state.playerPartyId) + 1),
    playerTrend: round(currentPlayerScore - previousPlayerScore, 1),
  };

  state.rng = rng;
  state.pollHistory.push(poll);
  const playerParty = state.parties[state.playerPartyId];
  if (playerParty) playerParty.stats.polling = currentPlayerScore;
  return { state, poll };
}
