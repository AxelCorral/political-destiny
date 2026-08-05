import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import {
  createGame,
  currentEvent,
  outcomeProbabilities,
  resolveCurrentChoice,
  validateGameState,
} from "../../src/game/engine/index";
import { hashSeed } from "../../src/game/engine/rng";
import type {
  EventChoice,
  GameEffect,
  GameEventDefinition,
  GameState,
  WeightedOutcome,
} from "../../src/game/types/index";

type StrategyName = "random" | "prudent" | "risky" | "collective" | "greedy" | "adverse";

const STRATEGIES: StrategyName[] = [
  "random",
  "prudent",
  "risky",
  "collective",
  "greedy",
  "adverse",
];
const SEEDS_PER_PARTY = Math.max(
  20,
  Math.min(250, Number.parseInt(process.env.AUDIT_SEEDS_PER_PARTY ?? "100", 10) || 100),
);
const CHECKPOINT_DECISION = 12;

interface RunResult {
  partyId: string;
  strategy: StrategyName;
  seedIndex: number;
  seed: string;
  qualified: boolean;
  won: boolean;
  valid: boolean;
  decisions: number;
  firstRoundScore: number;
  secondRoundScore: number | null;
  finalScore: number;
  progression: number;
  endingId: string;
  checkpointRank: number | null;
  checkpointPolling: number | null;
  eventIds: string[];
  eventStructures: string[];
  outcomeTitles: string[];
  outcomeNarratives: string[];
  choiceIds: string[];
  achievementIds: string[];
  finalSignature: string;
}

function numericEffectUtility(effect: GameEffect): number {
  if (!("delta" in effect)) {
    if (effect.kind === "alliance") return effect.action === "add" ? 5 : -4;
    if (effect.kind === "party_split") return -7;
    if (effect.kind === "candidate_status")
      return ["withdrawn", "disqualified", "eliminated"].includes(effect.status) ? -8 : 3;
    return 0;
  }

  switch (effect.kind) {
    case "party_stat": {
      const weights: Partial<Record<typeof effect.stat, number>> = {
        polling: 1.4,
        popularity: 1,
        mobilization: 0.85,
        finances: 0.35,
        credibility: 1.1,
        cohesion: 0.65,
        members: 0.0004,
        mediaPresence: 0.5,
        awareness: 0.6,
        rejection: -1,
        momentum: 0.9,
        localStrength: 0.55,
        electedSupport: 0.5,
      };
      return effect.delta * (weights[effect.stat] ?? 0.5);
    }
    case "hidden_stat": {
      const weights: Partial<Record<typeof effect.stat, number>> = {
        baseSupport: 1.6,
        potentialSupport: 1.2,
        transferability: 0.7,
        scandalRisk: -0.6,
        cadreLoyalty: 0.5,
        rivalAmbition: -0.35,
        economicCompetence: 0.6,
        securityCompetence: 0.6,
        socialCompetence: 0.6,
        fatigue: -0.55,
        consistency: 0.7,
      };
      return effect.delta * (weights[effect.stat] ?? 0.4);
    }
    case "trait":
      return effect.delta * 0.55;
    case "ideology":
      return 0;
    case "world":
      return 0;
    case "bloc_trust":
      return effect.delta * 0.5;
    default:
      return 0;
  }
}

function outcomeUtility(outcome: WeightedOutcome): number {
  const immediate = outcome.effects.reduce((sum, effect) => sum + numericEffectUtility(effect), 0);
  const delayed = (outcome.delayedEffects ?? []).reduce(
    (sum, scheduled) =>
      sum +
      scheduled.effects.reduce((effectSum, effect) => effectSum + numericEffectUtility(effect), 0),
    0,
  );
  return immediate + delayed * 0.75;
}

function expectedChoiceUtility(state: GameState, choice: EventChoice): number {
  const probabilities = outcomeProbabilities(state, choice);
  return choice.outcomeGroups.reduce(
    (sum, outcome, index) => sum + (probabilities[index] ?? 0) * outcomeUtility(outcome),
    0,
  );
}

function pickChoice(
  state: GameState,
  event: GameEventDefinition,
  strategy: StrategyName,
  seed: string,
): EventChoice {
  const preferredId =
    strategy === "prudent"
      ? "prudent_response"
      : strategy === "risky"
        ? "risk_breakthrough"
        : strategy === "collective"
          ? "collective_path"
          : undefined;
  if (preferredId)
    return event.choices.find((choice) => choice.id === preferredId) ?? event.choices[0]!;

  if (strategy === "random") {
    const index =
      hashSeed(`${seed}:${state.decisionIndex}:${event.id}:audit-choice`) % event.choices.length;
    return event.choices[index] ?? event.choices[0]!;
  }

  const ranked = event.choices
    .map((choice) => ({ choice, utility: expectedChoiceUtility(state, choice) }))
    .sort((left, right) =>
      strategy === "greedy"
        ? right.utility - left.utility || left.choice.id.localeCompare(right.choice.id)
        : left.utility - right.utility || left.choice.id.localeCompare(right.choice.id),
    );
  return ranked[0]?.choice ?? event.choices[0]!;
}

function eventStructure(event: GameEventDefinition): string {
  return event.choices
    .map(
      (choice) =>
        `${choice.id}:${choice.visibleTag ?? "NONE"}:${choice.outcomeGroups.map((outcome) => outcome.id).join(",")}`,
    )
    .join("|");
}

function partyRank(state: GameState): number {
  return (
    Object.values(state.parties)
      .filter((party) => party.active)
      .sort(
        (left, right) =>
          right.stats.polling - left.stats.polling || left.id.localeCompare(right.id),
      )
      .findIndex((party) => party.id === state.playerPartyId) + 1
  );
}

function runCampaign(partyId: string, strategy: StrategyName, seedIndex: number): RunResult {
  const seed = `audit-seed-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length];
  if (!method) throw new Error("Méthode de campagne absente.");
  let state = createGame(
    { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  const eventIds: string[] = [];
  const eventStructures: string[] = [];
  const outcomeTitles: string[] = [];
  const outcomeNarratives: string[] = [];
  const choiceIds: string[] = [];
  let checkpointRank: number | null = null;
  let checkpointPolling: number | null = null;
  let guard = 0;

  while (state.phase !== "finished" && guard < 50) {
    if (checkpointRank === null && state.decisionIndex >= CHECKPOINT_DECISION) {
      checkpointRank = partyRank(state);
      checkpointPolling = state.parties[state.playerPartyId]?.stats.polling ?? null;
    }
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, strategy, seed);
    const resolution = resolveCurrentChoice(state, choice.id, gameContent);
    eventIds.push(event.id);
    eventStructures.push(eventStructure(event));
    outcomeTitles.push(resolution.record.outcomeTitle);
    outcomeNarratives.push(resolution.record.narrative);
    choiceIds.push(choice.id);
    state = resolution.state;
    guard += 1;
  }
  if (state.phase !== "finished" || !state.finalResult || !state.firstRoundResult) {
    throw new Error(`Partie inachevée: ${partyId}/${strategy}/${seedIndex}`);
  }

  const validation = validateGameState(state);
  const result = state.finalResult;
  const finalSignature = JSON.stringify({
    decisionHistory: state.decisionHistory.map((record) => [
      record.eventId,
      record.choiceId,
      record.outcomeId,
    ]),
    firstRound: state.firstRoundResult.results,
    secondRound: state.secondRoundResult?.results,
    result,
  });
  return {
    partyId,
    strategy,
    seedIndex,
    seed,
    qualified: result.qualified,
    won: result.won,
    valid: validation.valid,
    decisions: state.decisionIndex,
    firstRoundScore: state.firstRoundResult.results[partyId] ?? 0,
    secondRoundScore: state.secondRoundResult?.results[partyId] ?? null,
    finalScore: result.score,
    progression: result.pollingProgression,
    endingId: result.endingId,
    checkpointRank,
    checkpointPolling,
    eventIds,
    eventStructures,
    outcomeTitles,
    outcomeNarratives,
    choiceIds,
    achievementIds: result.unlockedAchievementIds,
    finalSignature,
  };
}

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function variance(values: number[]): number {
  const average = mean(values);
  return values.length
    ? values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length
    : 0;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[index] ?? 0;
}

function frequency(values: string[]): Array<{ id: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => ({ id, count }));
}

function jaccard(left: string[], right: string[]): number {
  const a = new Set(left);
  const b = new Set(right);
  const intersection = [...a].filter((value) => b.has(value)).length;
  return a.size + b.size === 0 ? 1 : intersection / (a.size + b.size - intersection);
}

function repeatedOccurrences(values: string[]): number {
  const counts = frequency(values);
  return counts.reduce((sum, entry) => sum + Math.max(0, entry.count - 1), 0);
}

function aggregate(runs: RunResult[]) {
  return {
    runs: runs.length,
    qualificationRate: mean(runs.map((run) => Number(run.qualified))),
    winRate: mean(runs.map((run) => Number(run.won))),
    averageFirstRoundScore: mean(runs.map((run) => run.firstRoundScore)),
    firstRoundVariance: variance(runs.map((run) => run.firstRoundScore)),
    averageSecondRoundScore: mean(
      runs.flatMap((run) => (run.secondRoundScore === null ? [] : [run.secondRoundScore])),
    ),
    averageFinalScore: mean(runs.map((run) => run.finalScore)),
    finalScoreVariance: variance(runs.map((run) => run.finalScore)),
    averageProgression: mean(runs.map((run) => run.progression)),
    averageDecisions: mean(runs.map((run) => run.decisions)),
    firstRoundP05: percentile(
      runs.map((run) => run.firstRoundScore),
      0.05,
    ),
    firstRoundMedian: percentile(
      runs.map((run) => run.firstRoundScore),
      0.5,
    ),
    firstRoundP95: percentile(
      runs.map((run) => run.firstRoundScore),
      0.95,
    ),
  };
}

function etaSquared(runs: RunResult[], key: "partyId" | "strategy"): number {
  const overall = mean(runs.map((run) => run.firstRoundScore));
  const total = runs.reduce((sum, run) => sum + (run.firstRoundScore - overall) ** 2, 0);
  const groups = new Map<string, RunResult[]>();
  for (const run of runs) groups.set(run[key], [...(groups.get(run[key]) ?? []), run]);
  const between = [...groups.values()].reduce((sum, group) => {
    const groupMean = mean(group.map((run) => run.firstRoundScore));
    return sum + group.length * (groupMean - overall) ** 2;
  }, 0);
  return total ? between / total : 0;
}

const startedAt = performance.now();
const runs: RunResult[] = [];
for (const party of gameContent.parties) {
  for (let seedIndex = 0; seedIndex < SEEDS_PER_PARTY; seedIndex += 1) {
    for (const strategy of STRATEGIES) runs.push(runCampaign(party.id, strategy, seedIndex));
  }
  console.log(`Audit simulation: ${party.id} terminé (${runs.length} parties).`);
}

const determinismChecks = runs
  .filter((run) => run.seedIndex < 2 && run.strategy === "random")
  .map((run) => {
    const replay = runCampaign(run.partyId, run.strategy, run.seedIndex);
    return {
      partyId: run.partyId,
      seed: run.seed,
      identical: replay.finalSignature === run.finalSignature,
    };
  });

const byParty = Object.fromEntries(
  gameContent.parties.map((party) => [
    party.id,
    aggregate(runs.filter((run) => run.partyId === party.id)),
  ]),
);
const byStrategy = Object.fromEntries(
  STRATEGIES.map((strategy) => [
    strategy,
    aggregate(runs.filter((run) => run.strategy === strategy)),
  ]),
);
const byPartyAndStrategy = Object.fromEntries(
  gameContent.parties.flatMap((party) =>
    STRATEGIES.map((strategy) => [
      `${party.id}:${strategy}`,
      aggregate(runs.filter((run) => run.partyId === party.id && run.strategy === strategy)),
    ]),
  ),
);

const matchedGroups = new Map<string, RunResult[]>();
for (const run of runs) {
  const key = `${run.partyId}:${run.seedIndex}`;
  matchedGroups.set(key, [...(matchedGroups.get(key) ?? []), run]);
}
const matchedChoiceInfluence = [...matchedGroups.entries()].map(([key, group]) => {
  const scores = group.map((run) => run.firstRoundScore);
  const outcomes = new Set(group.map((run) => `${run.qualified}:${run.won}`));
  return {
    key,
    firstRoundRange: Math.max(...scores) - Math.min(...scores),
    finalScoreRange:
      Math.max(...group.map((run) => run.finalScore)) -
      Math.min(...group.map((run) => run.finalScore)),
    outcomeChanged: outcomes.size > 1,
  };
});

const successiveOverlaps: Array<{ event: number; structure: number }> = [];
for (const party of gameContent.parties) {
  for (const strategy of STRATEGIES) {
    const ordered = runs
      .filter((run) => run.partyId === party.id && run.strategy === strategy)
      .sort((a, b) => a.seedIndex - b.seedIndex);
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      if (!previous || !current) continue;
      successiveOverlaps.push({
        event: jaccard(previous.eventIds, current.eventIds),
        structure: jaccard(previous.eventStructures, current.eventStructures),
      });
    }
  }
}

const allEventIds = runs.flatMap((run) => run.eventIds);
const eventFrequency = frequency(allEventIds);
const eventFrequencyMap = new Map(eventFrequency.map((entry) => [entry.id, entry.count]));
const allChoices = runs.flatMap((run) => run.choiceIds);
const allAchievements = runs.flatMap((run) => run.achievementIds);
const allEndings = runs.map((run) => run.endingId);
const earlyDecided = runs.filter((run) => {
  if (run.checkpointRank === null || run.checkpointPolling === null) return false;
  return (
    (run.checkpointRank <= 2 && run.checkpointPolling >= 18 && run.qualified) ||
    (run.checkpointRank >= 6 && run.checkpointPolling <= 8 && !run.qualified)
  );
});
const comebacks = runs.filter(
  (run) => ((run.checkpointRank ?? 0) >= 5 || (run.checkpointPolling ?? 100) < 8) && run.qualified,
);

const impossibleToLose = Object.entries(byPartyAndStrategy)
  .filter(([, metrics]) => metrics.winRate >= 0.9)
  .map(([group, metrics]) => ({ group, winRate: metrics.winRate }));
const practicallyImpossibleToWin = Object.entries(byPartyAndStrategy)
  .filter(([, metrics]) => metrics.winRate <= 0.01)
  .map(([group, metrics]) => ({ group, winRate: metrics.winRate }));

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    totalRuns: runs.length,
    seedsPerParty: SEEDS_PER_PARTY,
    parties: gameContent.parties.map((party) => party.id),
    strategies: STRATEGIES,
    strategyDefinitions: {
      random: "Choix déterministe pseudo-aléatoire indépendant du PRNG du moteur.",
      prudent: "Toujours prudent_response lorsqu’il existe.",
      risky: "Toujours risk_breakthrough lorsqu’il existe.",
      collective: "Toujours collective_path lorsqu’il existe, sinon premier choix.",
      greedy: "Maximise l’utilité numérique attendue des effets avec les probabilités courantes.",
      adverse: "Minimise la même utilité; borne basse volontaire de l’agence du joueur.",
    },
    checkpointDecision: CHECKPOINT_DECISION,
    earlyDecisionDefinition:
      "À la décision 12: rang <=2 et >=18% puis qualification, ou rang >=6 et <=8% puis élimination.",
    comebackDefinition: "À la décision 12: rang >=5 ou <8%, puis qualification.",
    limits:
      "Les stratégies greedy/adverse optimisent une fonction d’audit documentée, pas une connaissance parfaite de la formule électorale. Eta² est descriptif et non causal.",
  },
  integrity: {
    invalidRuns: runs.filter((run) => !run.valid).length,
    blockedRuns: 0,
    determinismChecks,
    determinismFailures: determinismChecks.filter((check) => !check.identical).length,
  },
  overall: aggregate(runs),
  byParty,
  byStrategy,
  byPartyAndStrategy,
  influence: {
    partyEtaSquaredOnFirstRoundScore: etaSquared(runs, "partyId"),
    strategyEtaSquaredOnFirstRoundScore: etaSquared(runs, "strategy"),
    averageMatchedFirstRoundRangeAcrossStrategies: mean(
      matchedChoiceInfluence.map((entry) => entry.firstRoundRange),
    ),
    medianMatchedFirstRoundRangeAcrossStrategies: percentile(
      matchedChoiceInfluence.map((entry) => entry.firstRoundRange),
      0.5,
    ),
    averageMatchedFinalScoreRangeAcrossStrategies: mean(
      matchedChoiceInfluence.map((entry) => entry.finalScoreRange),
    ),
    matchedSeedsWhereQualificationOrWinChanged: matchedChoiceInfluence.filter(
      (entry) => entry.outcomeChanged,
    ).length,
    matchedSeedGroups: matchedChoiceInfluence.length,
  },
  reachability: {
    empiricallyReachedEvents: eventFrequency.filter((entry) => entry.count > 0).length,
    empiricallyUnreachedEvents: gameContent.events
      .filter((event) => (eventFrequencyMap.get(event.id) ?? 0) === 0)
      .map((event) => event.id),
    top30Events: eventFrequency.slice(0, 30),
    bottom30ReachedEvents: eventFrequency.filter((entry) => entry.count > 0).slice(-30),
    rareEventOccurrences: gameContent.events
      .filter((event) => ["rare", "legendary", "secret"].includes(event.rarity))
      .map((event) => ({ id: event.id, count: eventFrequencyMap.get(event.id) ?? 0 })),
  },
  repetition: {
    averageRepeatedOutcomeTitlesWithinRun: mean(
      runs.map((run) => repeatedOccurrences(run.outcomeTitles)),
    ),
    averageRepeatedOutcomeNarrativesWithinRun: mean(
      runs.map((run) => repeatedOccurrences(run.outcomeNarratives)),
    ),
    runsWithRepeatedOutcomeTitle: runs.filter((run) => repeatedOccurrences(run.outcomeTitles) > 0)
      .length,
    averageEventIdOverlapBetweenSuccessiveRuns: mean(
      successiveOverlaps.map((entry) => entry.event),
    ),
    averageStructureOverlapBetweenSuccessiveRuns: mean(
      successiveOverlaps.map((entry) => entry.structure),
    ),
  },
  pacing: {
    averageDecisions: mean(runs.map((run) => run.decisions)),
    minimumDecisions: Math.min(...runs.map((run) => run.decisions)),
    maximumDecisions: Math.max(...runs.map((run) => run.decisions)),
    earlyDecidedRuns: earlyDecided.length,
    earlyDecidedRate: earlyDecided.length / runs.length,
    comebackRuns: comebacks.length,
    comebackRate: comebacks.length / runs.length,
  },
  balanceWarnings: {
    impossibleToLose,
    practicallyImpossibleToWin,
  },
  distributions: {
    endings: frequency(allEndings),
    achievements: frequency(allAchievements),
    choices: frequency(allChoices),
    finalScoreBuckets: frequency(
      runs.map(
        (run) =>
          `${Math.floor(run.finalScore / 10) * 10}-${Math.floor(run.finalScore / 10) * 10 + 9}`,
      ),
    ),
    firstRoundScoreBuckets: frequency(
      runs.map(
        (run) =>
          `${Math.floor(run.firstRoundScore / 5) * 5}-${Math.floor(run.firstRoundScore / 5) * 5 + 4.9}`,
      ),
    ),
  },
  performance: {
    durationMs: performance.now() - startedAt,
    runsPerSecond: runs.length / ((performance.now() - startedAt) / 1_000),
  },
};

await mkdir(resolve("audit"), { recursive: true });
await writeFile(
  resolve("audit", "simulation-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

console.log(
  JSON.stringify(
    {
      totalRuns: runs.length,
      invalidRuns: report.integrity.invalidRuns,
      determinismFailures: report.integrity.determinismFailures,
      reachedEvents: report.reachability.empiricallyReachedEvents,
      partyEtaSquared: report.influence.partyEtaSquaredOnFirstRoundScore,
      strategyEtaSquared: report.influence.strategyEtaSquaredOnFirstRoundScore,
      outcomeChangedRate:
        report.influence.matchedSeedsWhereQualificationOrWinChanged /
        report.influence.matchedSeedGroups,
      durationMs: report.performance.durationMs,
    },
    null,
    2,
  ),
);
