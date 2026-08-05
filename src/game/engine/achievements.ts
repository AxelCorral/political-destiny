import type { AchievementDefinition, FinalResult, GameState } from "@/game/types";

function achievementMatches(id: string, state: GameState, finalResult?: FinalResult): boolean {
  const party = state.parties[state.playerPartyId];
  const records = state.decisionHistory;
  const positiveOutcomes = records.filter((record) =>
    record.visibleEffects.some((effect) => effect.tone === "positive"),
  ).length;
  const scandals = records.filter((record) => record.eventCategory === "scandal").length;
  const tags = records.map((record) => record.choiceLabel.toLocaleLowerCase("fr"));
  const uniqueTopics = new Set(state.statementLedger.map((statement) => statement.topic)).size;

  switch (id) {
    case "first_choice":
      return records.length >= 1;
    case "first_poll":
      return state.pollHistory.length >= 1;
    case "campaign_complete":
      return Boolean(finalResult);
    case "runoff":
      return Boolean(finalResult?.qualified);
    case "elysee":
      return Boolean(finalResult?.won);
    case "comeback":
      return (finalResult?.pollingProgression ?? 0) >= 8;
    case "from_under_eight":
      return Boolean(finalResult?.qualified && finalResult.startingPolling < 8);
    case "close_victory":
      return Boolean(
        finalResult?.won && (finalResult.secondRound?.results[state.playerPartyId] ?? 100) < 50.6,
      );
    case "kingmaker":
      return finalResult?.endingId === "kingmaker";
    case "new_party":
      return state.mode === "custom_party" && Boolean(finalResult);
    case "random_destiny":
      return state.mode === "random" && Boolean(finalResult);
    case "no_scandal":
      return Boolean(finalResult && scandals === 0);
    case "three_scandals":
      return scandals >= 3 && (party?.stats.credibility ?? 0) >= 45;
    case "all_topics":
      return uniqueTopics >= 8;
    case "debate_master":
      return records.some(
        (record) => record.eventCategory === "debate" && record.outcomeId.includes("success"),
      );
    case "viral":
      return records.some((record) => record.outcomeId.includes("viral"));
    case "transparent":
      return (
        tags.filter((label) => label.includes("audit") || label.includes("transpar")).length >= 2
      );
    case "loyal":
      return (
        tags.filter((label) => label.includes("soutenir") || label.includes("défendre")).length >= 3
      );
    case "risk_taker":
      return records.filter((record) => record.choiceId.includes("risk")).length >= 4;
    case "prudent":
      return records.filter((record) => record.choiceId.includes("prudent")).length >= 5;
    case "momentum":
      return (party?.stats.momentum ?? 0) >= 75;
    case "mobilized":
      return (party?.stats.mobilization ?? 0) >= 80;
    case "credible":
      return (party?.stats.credibility ?? 0) >= 82;
    case "united":
      return (party?.stats.cohesion ?? 0) >= 85;
    case "solvent":
      return (party?.stats.finances ?? 0) >= 80;
    case "popular":
      return (party?.stats.popularity ?? 0) >= 80;
    case "coalition":
      return (party?.alliedWith.length ?? 0) >= 2;
    case "without_compromise":
      return Boolean(finalResult && (party?.hidden.consistency ?? 0) >= 82);
    case "chameleon":
      return Boolean(finalResult && (party?.hidden.consistency ?? 100) <= 30);
    case "ten_good_outcomes":
      return positiveOutcomes >= 10;
    case "historic_score":
      return (finalResult?.score ?? 0) >= 85;
    case "perfect_campaign":
      return (finalResult?.score ?? 0) >= 95;
    case "hundred_members":
      return (party?.stats.members ?? 0) >= 100_000;
    case "million_members":
      return (party?.stats.members ?? 0) >= 1_000_000;
    case "media_wave":
      return (party?.stats.mediaPresence ?? 0) >= 85;
    case "local_roots":
      return (party?.stats.localStrength ?? 0) >= 80;
    case "secret_ending":
      return Boolean(finalResult?.endingId.startsWith("secret_"));
    case "thirty_decisions":
      return records.length >= 30;
    case "underdog":
      return Boolean(
        finalResult && finalResult.startingPolling < 5 && finalResult.pollingProgression >= 5,
      );
    case "second_place":
      return finalResult?.playerRank === 2;
    default:
      return false;
  }
}

export function evaluateAchievements(
  state: GameState,
  definitions: AchievementDefinition[],
  finalResult?: FinalResult,
): string[] {
  const unlocked = new Set(state.achievementsUnlocked);
  for (const definition of definitions) {
    if (achievementMatches(definition.id, state, finalResult)) unlocked.add(definition.id);
  }
  return [...unlocked];
}
