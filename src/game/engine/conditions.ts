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
    default: {
      const exhaustive: never = condition;
      return exhaustive;
    }
  }
}

export function allConditionsMatch(state: GameState, conditions: Condition[]): boolean {
  return conditions.every((condition) => conditionMatches(state, condition));
}
