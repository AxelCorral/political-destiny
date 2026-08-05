import type {
  AchievementDefinition,
  DecisionRecord,
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

function decisionSignal(record: DecisionRecord): { net: number; intensity: number } {
  const positive = record.visibleEffects.filter((effect) => effect.tone === "positive").length;
  const negative = record.visibleEffects.filter((effect) => effect.tone === "negative").length;
  const narrativeWeight = ["debate", "alliance", "scandal", "party"].includes(record.eventCategory)
    ? 1
    : 0;
  const memoryWeight = record.statementEvolution ? 1 : 0;
  return {
    net: positive - negative,
    intensity: positive + negative + narrativeWeight + memoryWeight,
  };
}

function campaignHighlights(state: GameState): number[] {
  return state.decisionHistory
    .map((record) => ({ record, ...decisionSignal(record) }))
    .sort(
      (left, right) =>
        right.intensity - left.intensity ||
        Math.abs(right.net) - Math.abs(left.net) ||
        left.record.decisionIndex - right.record.decisionIndex,
    )
    .slice(0, 5)
    .map(({ record }) => record.decisionIndex)
    .sort((left, right) => left - right);
}

function buildCampaignNarrative(
  state: GameState,
  endingNarrative: string,
  firstRoundShare: number,
  pollingProgression: number,
): string {
  const party = state.parties[state.playerPartyId];
  if (!party) return endingNarrative;
  const direction =
    pollingProgression >= 2
      ? `progresse de ${pollingProgression.toFixed(1)} points`
      : pollingProgression <= -2
        ? `recule de ${Math.abs(pollingProgression).toFixed(1)} points`
        : "reste proche de son point de départ";
  const contradictions = state.statementLedger.filter((statement) =>
    ["contradiction", "abrupt_reversal"].includes(statement.evolution ?? ""),
  ).length;
  const positions = new Set(
    state.statementLedger.map((statement) => statement.policyTopic).filter(Boolean),
  ).size;
  const alliances = party.alliedWith.length;
  const turningPoint = state.decisionHistory
    .map((record) => ({ record, ...decisionSignal(record) }))
    .sort((left, right) => right.intensity - left.intensity)[0]?.record;
  const trajectory = `${party.shortName} obtient ${firstRoundShare.toFixed(1)} % au premier tour et ${direction}.`;
  const legacy = `${positions} positions programmatiques, ${alliances} alliance${alliances > 1 ? "s" : ""} et ${contradictions} contradiction${contradictions > 1 ? "s" : ""} restent inscrites dans le bilan.`;
  const turning = turningPoint
    ? `Le tournant retenu est « ${turningPoint.eventTitle} », après votre décision de ${turningPoint.choiceLabel.charAt(0).toLocaleLowerCase("fr")}${turningPoint.choiceLabel.slice(1)}.`
    : "";
  return [endingNarrative, trajectory, legacy, turning].filter(Boolean).join(" ");
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
  const firstRoundShare = firstRound.results[state.playerPartyId] ?? 0;
  const relativePerformance = firstRoundShare / Math.max(3, startingPolling);
  const initialMembers = Number(state.flags.initialMembers ?? party.stats.members);
  const initialLocalStrength = Number(
    state.flags.initialLocalStrength ?? party.stats.localStrength,
  );
  const initialPopularity = Number(state.flags.initialPopularity ?? party.stats.popularity);
  const memberGrowthRate =
    (party.stats.members - initialMembers) / Math.max(10_000, initialMembers);
  const localGrowth = party.stats.localStrength - initialLocalStrength;
  const popularityGrowth = party.stats.popularity - initialPopularity;
  const contradictionCount = state.statementLedger.filter((statement) =>
    ["contradiction", "abrupt_reversal"].includes(statement.evolution ?? ""),
  ).length;
  const statementTopics = new Set(
    state.statementLedger.map((statement) => statement.policyTopic).filter(Boolean),
  ).size;

  const breakdown: ScoreBreakdown = {
    electoralPerformance: round(clamp(firstRoundShare * 1.05 + (qualified ? 5 : 0), 0, 30), 1),
    progression: round(
      clamp(8 + pollingProgression * 1.45 + (relativePerformance - 1) * 3.5, 0, 20),
      1,
    ),
    qualificationAndVictory: won ? 15 : qualified ? 9 : playerRank <= 4 ? 3 : 0,
    partyGrowth: round(
      clamp(
        4 + memberGrowthRate * 4 + localGrowth * 0.22 + (party.stats.mobilization - 50) * 0.05,
        0,
        10,
      ),
      1,
    ),
    consistency: round(clamp(party.hidden.consistency / 10 - contradictionCount * 0.7, 0, 10), 1),
    legacy: round(
      clamp(
        2 +
          statementTopics * 0.6 +
          party.alliedWith.length * 0.8 +
          popularityGrowth * 0.12 +
          (party.stats.credibility - 50) * 0.05,
        0,
        10,
      ),
      1,
    ),
    specialAchievements: 0,
  };

  const ending = endingForState(state, endings);
  const best = state.decisionHistory
    .map((record) => ({ record, ...decisionSignal(record) }))
    .sort(
      (left, right) =>
        right.net - left.net ||
        right.intensity - left.intensity ||
        left.record.decisionIndex - right.record.decisionIndex,
    )[0];
  const costliest = state.decisionHistory
    .map((record) => ({ record, ...decisionSignal(record) }))
    .sort(
      (left, right) =>
        left.net - right.net ||
        right.intensity - left.intensity ||
        left.record.decisionIndex - right.record.decisionIndex,
    )[0];
  const baseScore = round(
    clamp(
      Object.values(breakdown).reduce((sum, value) => sum + value, 0),
      0,
      100,
    ),
    0,
  );
  const provisional = {
    endingId: ending.id,
    title: ending.title,
    narrative: buildCampaignNarrative(state, ending.narrative, firstRoundShare, pollingProgression),
    score: baseScore,
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
    highlightDecisionIds: campaignHighlights(state),
    ...(best && best.net > 0 ? { bestDecisionIndex: best.record.decisionIndex } : {}),
    ...(costliest && costliest.net < 0
      ? { costliestDecisionIndex: costliest.record.decisionIndex }
      : {}),
    rivalPartyId:
      firstRound.ranking.find((partyId) => partyId !== state.playerPartyId) ?? state.playerPartyId,
    unlockedAchievementIds: [] as string[],
  } satisfies FinalResult;

  let unlockedAchievementIds = evaluateAchievements(state, achievements, provisional);
  breakdown.specialAchievements = round(clamp(unlockedAchievementIds.length * 0.5, 0, 5), 1);
  let score = round(
    clamp(
      Object.values(breakdown).reduce((sum, value) => sum + value, 0),
      0,
      100,
    ),
    0,
  );
  unlockedAchievementIds = evaluateAchievements(state, achievements, {
    ...provisional,
    score,
    breakdown,
    unlockedAchievementIds,
  });
  breakdown.specialAchievements = round(clamp(unlockedAchievementIds.length * 0.5, 0, 5), 1);
  score = round(
    clamp(
      Object.values(breakdown).reduce((sum, value) => sum + value, 0),
      0,
      100,
    ),
    0,
  );

  return {
    ...provisional,
    score,
    breakdown,
    unlockedAchievementIds,
  };
}
