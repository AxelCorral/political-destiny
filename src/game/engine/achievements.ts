import type {
  AchievementCriterion,
  AchievementDefinition,
  FinalResult,
  GameState,
  HiddenPartyStats,
  PartyStats,
} from "@/game/types";

type MetricValue = boolean | number | string | string[];

function positiveOutcomeCount(state: GameState, category?: string): number {
  return state.decisionHistory.filter(
    (record) =>
      (!category || record.eventCategory === category) &&
      record.visibleEffects.some((effect) => effect.tone === "positive"),
  ).length;
}

function secondRoundMargin(state: GameState, finalResult?: FinalResult): number {
  const results = finalResult?.secondRound?.results;
  if (!results) return 100;
  const playerScore = results[state.playerPartyId] ?? 0;
  const opponentScore = Math.max(
    0,
    ...Object.entries(results)
      .filter(([partyId]) => partyId !== state.playerPartyId)
      .map(([, score]) => score),
  );
  return Math.abs(playerScore - opponentScore);
}

function metricValue(
  criterion: AchievementCriterion,
  state: GameState,
  finalResult?: FinalResult,
): MetricValue {
  const party = state.parties[state.playerPartyId];
  const records = state.decisionHistory;

  switch (criterion.metric) {
    case "campaign_completed":
      return Boolean(finalResult);
    case "won":
      return Boolean(finalResult?.won);
    case "qualified":
      return Boolean(finalResult?.qualified);
    case "party_id":
      return state.playerPartyId;
    case "game_mode":
      return state.mode;
    case "ending_id":
      return finalResult?.endingId ?? "";
    case "score":
      return finalResult?.score ?? 0;
    case "first_round_score":
      return finalResult?.firstRound.results[state.playerPartyId] ?? 0;
    case "second_round_score":
      return finalResult?.secondRound?.results[state.playerPartyId] ?? 0;
    case "second_round_margin":
      return secondRoundMargin(state, finalResult);
    case "polling_progression":
      return finalResult?.pollingProgression ?? 0;
    case "starting_polling":
      return finalResult?.startingPolling ?? party?.stats.polling ?? 0;
    case "final_rank":
      return finalResult?.playerRank ?? Object.keys(state.parties).length;
    case "decisions":
      return records.length;
    case "polls":
      return state.pollHistory.length;
    case "positive_outcomes":
      return positiveOutcomeCount(state);
    case "positive_event_outcomes":
      return positiveOutcomeCount(state, criterion.key);
    case "scandals":
      return records.filter((record) => record.eventCategory === "scandal").length;
    case "statement_topics":
      return new Set(state.statementLedger.map((statement) => statement.topic)).size;
    case "contradictions":
      return state.statementLedger.filter((statement) =>
        ["contradiction", "abrupt_reversal"].includes(statement.evolution ?? ""),
      ).length;
    case "alliances":
      return party?.alliedWith.length ?? 0;
    case "actor_memories":
      return state.actorMemories.filter((memory) => !criterion.key || memory.kind === criterion.key)
        .length;
    case "members":
      return party?.stats.members ?? 0;
    case "party_stat":
      return criterion.key ? (party?.stats[criterion.key as keyof PartyStats] ?? 0) : 0;
    case "hidden_stat":
      return criterion.key ? (party?.hidden[criterion.key as keyof HiddenPartyStats] ?? 0) : 0;
    case "choice_strategy":
      return records.filter((record) => !criterion.key || record.choiceStrategy === criterion.key)
        .length;
    case "choice_tag":
      return records.filter((record) => !criterion.key || record.choiceTag === criterion.key)
        .length;
    case "event_category":
      return records.filter((record) => !criterion.key || record.eventCategory === criterion.key)
        .length;
    case "outcome_id":
      return records.map((record) => record.outcomeId);
  }
}

function criterionMatches(actual: MetricValue, criterion: AchievementCriterion): boolean {
  switch (criterion.operator) {
    case "eq":
      return actual === criterion.value;
    case "gte":
      return typeof actual === "number" && typeof criterion.value === "number"
        ? actual >= criterion.value
        : false;
    case "lte":
      return typeof actual === "number" && typeof criterion.value === "number"
        ? actual <= criterion.value
        : false;
    case "contains": {
      const expected = String(criterion.value);
      if (Array.isArray(actual)) return actual.some((value) => value.includes(expected));
      return typeof actual === "string" ? actual.includes(expected) : false;
    }
  }
}

export function achievementMatches(
  definition: AchievementDefinition,
  state: GameState,
  finalResult?: FinalResult,
): boolean {
  const criteria = definition.criteria;
  if (!criteria?.conditions.length) return false;
  const matches = criteria.conditions.map((criterion) =>
    criterionMatches(metricValue(criterion, state, finalResult), criterion),
  );
  return criteria.mode === "all" ? matches.every(Boolean) : matches.some(Boolean);
}

export function evaluateAchievements(
  state: GameState,
  definitions: AchievementDefinition[],
  finalResult?: FinalResult,
): string[] {
  const unlocked = new Set(state.achievementsUnlocked);
  for (const definition of definitions) {
    if (achievementMatches(definition, state, finalResult)) unlocked.add(definition.id);
  }
  return [...unlocked];
}
