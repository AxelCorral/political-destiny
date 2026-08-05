import type {
  AchievementDefinition,
  EndingDefinition,
  FinalResult,
  GameState,
  ScoreBreakdown,
} from "@/game/types";

import { evaluateAchievements } from "./achievements";
import { endingForState } from "./endings";
import { clamp, round } from "./math";

function strongestRegions(state: GameState): FinalResult["strongestRegions"] {
  const result = state.secondRoundResult ?? state.firstRoundResult;
  if (!result) return [];
  return [...result.regionalResults]
    .sort(
      (left, right) =>
        (right.results[state.playerPartyId] ?? 0) - (left.results[state.playerPartyId] ?? 0),
    )
    .slice(0, 3)
    .map((region) => region.regionId);
}

export function scoreGame(
  state: GameState,
  achievements: AchievementDefinition[],
  endings: EndingDefinition[],
): FinalResult {
  const party = state.parties[state.playerPartyId];
  const firstRound = state.firstRoundResult;
  if (!party || !firstRound)
    throw new Error("Le score final exige un parti joueur et un premier tour.");

  const playerRank = Math.max(1, firstRound.ranking.indexOf(state.playerPartyId) + 1);
  const qualified = Boolean(state.qualifiedPartyIds?.includes(state.playerPartyId));
  const won = state.secondRoundResult?.ranking[0] === state.playerPartyId;
  const finalVoteShare =
    state.secondRoundResult?.results[state.playerPartyId] ??
    firstRound.results[state.playerPartyId] ??
    0;
  const startingPolling = party.initialPolling;
  const pollingProgression = round(
    (firstRound.results[state.playerPartyId] ?? 0) - startingPolling,
    1,
  );
  const relativePerformance = finalVoteShare / Math.max(3, startingPolling);

  const breakdown: ScoreBreakdown = {
    electoralPerformance: round(
      clamp((firstRound.results[state.playerPartyId] ?? 0) * 1.05 + (qualified ? 5 : 0), 0, 30),
      1,
    ),
    progression: round(
      clamp(8 + pollingProgression * 1.45 + (relativePerformance - 1) * 3.5, 0, 20),
      1,
    ),
    qualificationAndVictory: won ? 15 : qualified ? 9 : playerRank <= 4 ? 3 : 0,
    partyGrowth: round(
      clamp((party.stats.mobilization + party.stats.localStrength) / 20, 0, 10),
      1,
    ),
    consistency: round(clamp(party.hidden.consistency / 10, 0, 10), 1),
    legacy: round(clamp((party.stats.credibility + party.stats.popularity) / 20, 0, 10), 1),
    specialAchievements: 0,
  };

  const provisional = {
    endingId: "",
    title: "",
    narrative: "",
    score: 0,
    breakdown,
    firstRound,
    ...(state.secondRoundResult ? { secondRound: state.secondRoundResult } : {}),
    playerRank,
    finalVoteShare,
    won,
    qualified,
    startingPolling,
    pollingProgression,
    strongestRegions: strongestRegions(state),
    highlightDecisionIds: state.decisionHistory.slice(-5).map((record) => record.decisionIndex),
    rivalPartyId:
      firstRound.ranking.find((partyId) => partyId !== state.playerPartyId) ?? state.playerPartyId,
    unlockedAchievementIds: [] as string[],
  } satisfies FinalResult;

  const unlockedAchievementIds = evaluateAchievements(state, achievements, provisional);
  breakdown.specialAchievements = round(clamp(unlockedAchievementIds.length * 0.5, 0, 5), 1);
  const score = round(
    clamp(
      Object.values(breakdown).reduce((sum, value) => sum + value, 0),
      0,
      100,
    ),
    0,
  );
  const ending = endingForState(state, endings);
  const best = state.decisionHistory
    .map((record) => ({
      index: record.decisionIndex,
      score: record.visibleEffects.filter((effect) => effect.tone === "positive").length,
    }))
    .sort((a, b) => b.score - a.score)[0];
  const costliest = state.decisionHistory
    .map((record) => ({
      index: record.decisionIndex,
      score: record.visibleEffects.filter((effect) => effect.tone === "negative").length,
    }))
    .sort((a, b) => b.score - a.score)[0];

  return {
    ...provisional,
    endingId: ending.id,
    title: ending.title,
    narrative: ending.narrative,
    score,
    breakdown,
    unlockedAchievementIds,
    ...(best?.score ? { bestDecisionIndex: best.index } : {}),
    ...(costliest?.score ? { costliestDecisionIndex: costliest.index } : {}),
  };
}
