import type { EndingDefinition, GameState } from "@/game/types";

export function determineEndingId(state: GameState): string {
  const party = state.parties[state.playerPartyId];
  const firstRound = state.firstRoundResult;
  const secondRound = state.secondRoundResult;
  const firstShare = firstRound?.results[state.playerPartyId] ?? 0;
  const rank = firstRound?.ranking.indexOf(state.playerPartyId) ?? -1;
  const progression = firstShare - (party?.initialPolling ?? 0);
  const contradictionCount = state.statementLedger.filter((statement) =>
    ["contradiction", "abrupt_reversal"].includes(statement.evolution ?? ""),
  ).length;

  if (
    state.flags.secret_national_union === true ||
    (state.flags.national_union_limited === true &&
      state.flags.coalition_five_conditions === true &&
      (party?.alliedWith.length ?? 0) >= 2)
  )
    return "secret_national_union";
  if (
    state.flags.secret_monarchy === true ||
    (state.flags.crown_humor_response === true &&
      state.flags.parrot_charity_clip === true &&
      (party?.stats.mediaPresence ?? 0) >= 75)
  )
    return "secret_monarchy";
  if (
    state.flags.secret_fragmentation === true ||
    (state.flags.fragmentation_confrontation === true && (party?.stats.cohesion ?? 100) <= 28)
  )
    return "secret_fragmentation";
  if (
    state.flags.secret_authoritarian === true ||
    (state.flags.exceptional_powers_discretion === true &&
      (party?.perceivedIdeology.authority ?? 0) >= 70 &&
      contradictionCount >= 2)
  )
    return "secret_authoritarian";
  if (
    state.flags.secret_civil_unrest === true ||
    (state.flags.voice_lost_on_stage === true && (party?.hidden.fatigue ?? 0) >= 25)
  )
    return "secret_civil_unrest";
  if (state.flags.retired === true) return "retirement";
  if (state.flags.withdrew === true) return "withdrawn";
  if ((secondRound?.ranking[0] ?? "") === state.playerPartyId) return "president";
  if (secondRound?.ranking.includes(state.playerPartyId)) return "runoff_defeat";
  if (state.flags.kingmaker === true || (rank >= 2 && rank <= 4 && firstShare >= 8))
    return "kingmaker";
  if (
    rank === 2 ||
    rank === 3 ||
    (rank >= 0 &&
      firstRound &&
      firstShare >= (firstRound.results[firstRound.ranking[1] ?? ""] ?? 0) - 2)
  ) {
    return "narrow_elimination";
  }
  if ((party?.stats.cohesion ?? 50) < 25) return "divided_party";
  if (progression >= 5) return "strengthened_party";
  if (firstShare < Math.max(2, (party?.initialPolling ?? 0) - 5)) return "collapse";
  return "honorable_campaign";
}

export function endingForState(
  state: GameState,
  definitions: EndingDefinition[],
): EndingDefinition {
  const id = determineEndingId(state);
  return (
    definitions.find((ending) => ending.id === id) ?? {
      id,
      title: "Une page se tourne",
      narrative:
        "Votre campagne rejoint les archives. Son héritage dépendra des batailles à venir.",
    }
  );
}
