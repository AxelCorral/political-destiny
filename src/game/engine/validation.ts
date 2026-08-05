import type { GameState } from "@/game/types";

export interface StateValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGameState(state: GameState): StateValidationResult {
  const errors: string[] = [];
  if (!Number.isInteger(state.decisionIndex) || state.decisionIndex < 0) {
    errors.push("decisionIndex invalide");
  }
  if (!Number.isFinite(state.rng.state) || !Number.isInteger(state.rng.draws)) {
    errors.push("état PRNG invalide");
  }
  if (!state.parties[state.playerPartyId]) errors.push("parti joueur absent");
  if (!state.actors[state.player.id]) errors.push("candidat joueur absent");

  for (const party of Object.values(state.parties)) {
    for (const [key, value] of Object.entries(party.stats)) {
      const maximum = key === "members" ? 5_000_000 : 100;
      if (!Number.isFinite(value) || value < 0 || value > maximum) {
        errors.push(`statistique invalide ${party.id}.${key}`);
      }
    }
    for (const [key, value] of Object.entries(party.hidden)) {
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        errors.push(`variable cachée invalide ${party.id}.${key}`);
      }
    }
    for (const [key, value] of Object.entries(party.ideology)) {
      if (!Number.isFinite(value) || value < -100 || value > 100) {
        errors.push(`idéologie invalide ${party.id}.${key}`);
      }
    }
  }

  for (const result of [state.firstRoundResult, state.secondRoundResult]) {
    if (!result) continue;
    const sum = Object.values(result.results).reduce((total, value) => total + value, 0);
    if (Math.abs(sum - 100) > 0.001)
      errors.push(`somme électorale invalide au tour ${result.round}`);
    if (
      Object.values(result.results).some(
        (value) => !Number.isFinite(value) || value < 0 || value > 100,
      )
    ) {
      errors.push(`résultat électoral invalide au tour ${result.round}`);
    }
  }

  if (state.qualifiedPartyIds?.[0] === state.qualifiedPartyIds?.[1]) {
    errors.push("finalistes identiques");
  }
  if (state.phase === "finished" && !state.finalResult)
    errors.push("partie terminée sans résultat final");
  return { valid: errors.length === 0, errors };
}
