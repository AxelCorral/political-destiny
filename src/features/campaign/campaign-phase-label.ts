import { GAME_CONFIG } from "@/config/game";
import type { GameState } from "@/game/types";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase J (§23) — mise en scène par
 * phase du calendrier, sans jamais modifier les dates réelles : le libellé
 * dérive uniquement de `state.phase` déjà existant et du même seuil de
 * "fin de campagne" que `lateGameRelevanceMultiplier` (0,72 de la
 * progression avant le premier tour) utilise déjà côté moteur.
 */
export function campaignPhaseLabel(state: GameState): string {
  if (state.phase === "between_rounds") return "Entre-deux-tours";
  if (state.phase === "government_epilogue") return "Gouvernement";
  if (state.phase === "pre_campaign") return "Pré-campagne";
  const progress = state.decisionIndex / Math.max(1, GAME_CONFIG.targetDecisionsBeforeFirstRound);
  return progress >= 0.72 ? "Dernière ligne droite" : "Campagne";
}
