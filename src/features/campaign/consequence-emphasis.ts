import type { GameEventDefinition } from "@/game/types";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase E (§11) — niveau d'emphase
 * visuelle de l'écran de conséquence, dérivé uniquement de l'`importance`
 * et de la `category` déjà déclarées sur l'événement source (aucune donnée
 * cachée, aucune probabilité révélée).
 */
export type ConsequenceEmphasis = "minor" | "significant" | "major";

export function resolveConsequenceEmphasis(
  event: GameEventDefinition | undefined,
): ConsequenceEmphasis {
  if (!event) return "minor";
  if (event.category === "government" || event.importance === "decisive") return "major";
  if (event.category === "rare" || event.importance === "major" || event.importance === "notable") {
    return "significant";
  }
  return "minor";
}
