import type { Condition, GameState } from "@/game/types";

function compare(value: number, operator: "gte" | "lte", expected: number): boolean {
  return operator === "gte" ? value >= expected : value <= expected;
}

export function conditionMatches(state: GameState, condition: Condition): boolean {
  const playerParty = state.parties[state.playerPartyId];
  if (!playerParty) return false;

  switch (condition.kind) {
    case "phase":
      return condition.values.includes(state.phase);
    case "decision_min":
      return state.decisionIndex >= condition.value;
    case "decision_max":
      return state.decisionIndex <= condition.value;
    case "party_stat":
      return compare(playerParty.stats[condition.stat], condition.operator, condition.value);
    case "trait":
      return compare(state.player.traits[condition.trait], condition.operator, condition.value);
    case "flag":
      return state.flags[condition.key] === condition.equals;
    case "not_flag":
      return !(condition.key in state.flags) || state.flags[condition.key] === false;
    case "player_party":
      return condition.partyIds.includes(state.playerPartyId);
    case "qualified":
      return condition.value === Boolean(state.qualifiedPartyIds?.includes(state.playerPartyId));
    case "party_not_opponent": {
      // AUDIT_ELECTORAL_COHERENCE.md §6/Annexe B : un événement de second tour
      // qui propose une alliance ou évoque les électeurs d'un parti tiers
      // précis n'a de sens que si ce tiers n'est pas, dans cette partie,
      // l'adversaire réellement qualifié du joueur.
      const opponent = state.qualifiedPartyIds?.find((id) => id !== state.playerPartyId);
      return !opponent || !condition.partyIds.includes(opponent);
    }
    case "game_mode":
      return condition.values.includes(state.mode);
    case "ideology":
      return compare(
        playerParty.perceivedIdeology[condition.axis],
        condition.operator,
        condition.value,
      );
    case "ideology_family":
      return Boolean(
        playerParty.ideologyFamily && condition.values.includes(playerParty.ideologyFamily),
      );
    case "statement_exists":
      return (
        state.statementLedger.some((statement) => statement.policyTopic === condition.topic) ===
        condition.value
      );
    case "contradiction_count":
      return compare(
        state.statementLedger.filter((statement) =>
          ["contradiction", "abrupt_reversal"].includes(statement.evolution ?? ""),
        ).length,
        condition.operator,
        condition.value,
      );
    case "actor_memory":
      return state.actorMemories.some(
        (memory) =>
          memory.active &&
          memory.actorId === condition.actorId &&
          memory.kind === condition.memory &&
          memory.intensity >= (condition.minimumIntensity ?? 1),
      );
    case "party_relation":
      return compare(
        state.partyRelations[state.playerPartyId]?.[condition.partyId] ?? 0,
        condition.operator,
        condition.value,
      );
    default: {
      const exhaustive: never = condition;
      return exhaustive;
    }
  }
}

export function allConditionsMatch(state: GameState, conditions: Condition[]): boolean {
  return conditions.every((condition) => conditionMatches(state, condition));
}
