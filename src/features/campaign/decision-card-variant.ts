import type { DecisionRecord, GameEventDefinition, GameState } from "@/game/types";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase C (§8) — architecture de
 * présentation des cartes de décision. Un seul axe visuel par carte, dérivé
 * uniquement des données déjà présentes sur l'événement et sur l'état de
 * partie (aucune nouvelle donnée de gameplay). Priorité de surcharge
 * documentée par le prompt (§8.3) :
 *
 *   government > rare/decisive > chain > major > routine
 *
 * `isChainFollowUp` est calculé indépendamment de `variant` : un événement
 * rare qui est aussi la suite d'une chaîne garde le traitement "rare" mais
 * peut afficher en plus le rappel "Retour de dossier" (combinaison subtile
 * explicitement autorisée par le prompt).
 */
export type DecisionCardVariant =
  "government" | "rare" | "decisive" | "chain" | "major" | "routine";

export function resolveDecisionCardVariant(event: GameEventDefinition): {
  variant: DecisionCardVariant;
  isChainFollowUp: boolean;
} {
  const isChainFollowUp = Boolean(
    event.chain && event.chain.step > 1 && (event.chain.followsEventIds?.length ?? 0) > 0,
  );

  let variant: DecisionCardVariant;
  if (event.category === "government") {
    variant = "government";
  } else if (event.category === "rare") {
    variant = "rare";
  } else if (event.importance === "decisive") {
    variant = "decisive";
  } else if (isChainFollowUp) {
    variant = "chain";
  } else if (event.importance === "major" || event.importance === "notable") {
    variant = "major";
  } else {
    variant = "routine";
  }

  return { variant, isChainFollowUp };
}

export interface ChainOrigin {
  record: DecisionRecord;
  decisionsAgo: number;
}

/**
 * Retrouve, dans l'historique déjà enregistré de la partie, la décision
 * d'origine d'une chaîne narrative pour l'événement de suite en cours.
 * Ne révèle rien de nouveau : les mêmes données sont déjà consultables dans
 * l'onglet Décisions du tableau de bord.
 */
export function findChainOrigin(
  event: GameEventDefinition,
  state: GameState,
): ChainOrigin | undefined {
  const followsIds = event.chain?.followsEventIds;
  if (!followsIds?.length) return undefined;
  for (let i = state.decisionHistory.length - 1; i >= 0; i -= 1) {
    const record = state.decisionHistory[i]!;
    if (followsIds.includes(record.eventId)) {
      return { record, decisionsAgo: state.decisionIndex - record.decisionIndex };
    }
  }
  return undefined;
}
