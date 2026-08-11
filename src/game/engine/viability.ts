import type { ElectorateBlocDefinition, GameState } from "@/game/types";

import { nationalLatentSupport } from "./electorate";
import { clamp } from "./math";

/**
 * PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md §5 —
 * `electoralViability` répond à une question précise : *cette candidature
 * a-t-elle encore une voie crédible vers le second tour, toute seule ?* Ce
 * n'est jamais le score brut : l'écart au deuxième qualifié (`gapToTop2`)
 * domine le calcul (§5, exemple « Écologistes 5,5 % / PS 11 % / LFI 12 % » —
 * la faiblesse vient de l'écart au duo de tête, pas du score en valeur
 * absolue), modulé par le momentum, l'écart crédibilité/rejet, et le
 * potentiel de soutien encore non exprimé (`hidden.potentialSupport`).
 *
 * AUDIT_STRATEGIC_REALIGNMENTS.md §2 documente pourquoi le prototype d'audit
 * (toujours positif, non discriminant) n'a pas été repris tel quel. Recalibré
 * une seconde fois après un diagnostic ciblé (STRATEGIC_REALIGNMENTS_REPORT.md) :
 * une première version pondérait déjà `gapToTop2` (×1,5) plus fort que le
 * score brut, mais les termes secondaires (momentum, écart crédibilité/rejet,
 * potentiel non exprimé, capacité d'alliance) pouvaient encore, cumulés,
 * compenser un écart réel de 10-13 points au duo de tête — en particulier
 * pour les Écologistes, dont le rejet délibérément bas
 * (`PARTY_GAMEPLAY_IDENTITIES.md`) gonflait `credibilityEdge` indépendamment
 * de leur position électorale réelle. `gapToTop2` domine maintenant bien
 * plus largement (×2,5) et les termes secondaires sont réduits à des
 * modificateurs mineurs qui ne peuvent plus, même cumulés au maximum,
 * compenser un écart de position réel.
 */
export interface ElectoralViabilitySnapshot {
  partyId: string;
  score: number;
  rank: number;
  gapToTop2: number;
  momentum: number;
  credibilityEdge: number;
  potentialCeiling: number;
  hasAllianceCapacity: boolean;
  /** Zone approximative : < -8 voie fermée, -8..8 voie étroite, > 8 course ouverte. */
  viability: number;
}

export function computeElectoralViability(
  state: GameState,
  partyId: string,
  blocs: ElectorateBlocDefinition[],
): ElectoralViabilitySnapshot | undefined {
  const party = state.parties[partyId];
  if (!party?.active) return undefined;

  const truth = nationalLatentSupport(state, blocs);
  const ranked = Object.entries(truth)
    .filter(([id]) => state.parties[id]?.active)
    .sort((a, b) => b[1] - a[1]);
  const rank = ranked.findIndex(([id]) => id === partyId) + 1;
  const score = truth[partyId] ?? 0;
  // Le "duo de tête" est le second qualifié, pas le premier : c'est le seuil
  // que la candidature doit franchir pour espérer un second tour.
  const top2Floor = ranked[1]?.[1] ?? 0;
  const gapToTop2 = score - top2Floor;

  const potentialCeiling = Math.max(0, party.hidden.potentialSupport - score);
  const credibilityEdge = party.stats.credibility - party.stats.rejection;
  const hasAllianceCapacity =
    party.alliedWith.length > 0 ||
    party.naturalAllies.some((id) => (state.partyRelations[partyId]?.[id] ?? 0) > 20);

  const viability =
    clamp(gapToTop2, -35, 12) * 2.5 +
    Math.min(score, 15) * 0.15 +
    party.stats.momentum * 0.04 +
    credibilityEdge * 0.02 +
    potentialCeiling * 0.05 +
    (hasAllianceCapacity ? 1 : 0);

  return {
    partyId,
    score: Number(score.toFixed(2)),
    rank,
    gapToTop2: Number(gapToTop2.toFixed(2)),
    momentum: Number(party.stats.momentum.toFixed(1)),
    credibilityEdge: Number(credibilityEdge.toFixed(1)),
    potentialCeiling: Number(potentialCeiling.toFixed(2)),
    hasAllianceCapacity,
    viability: Number(viability.toFixed(2)),
  };
}

/**
 * §6 — la pression de fragmentation répond à une question différente et
 * complémentaire : *le maintien de CETTE candidature réduit-il les chances
 * de qualification de son propre bloc ?* Utilise `naturalAllies` (§6/§31 :
 * données déjà présentes dans `src/game/data/parties.ts`, jamais un script
 * par parti) pour identifier le partenaire le mieux placé, et mesure si le
 * score combiné franchirait le seuil de qualification alors qu'aucun des
 * deux, seul, ne le franchit.
 */
export interface BlocFragmentationSnapshot {
  partyId: string;
  bestPartnerId?: string;
  bestPartnerScore: number;
  partnerAheadMargin: number;
  combinedReachesQualification: boolean;
  pressure: number;
}

export function computeBlocFragmentationPressure(
  state: GameState,
  partyId: string,
  blocs: ElectorateBlocDefinition[],
): BlocFragmentationSnapshot | undefined {
  const party = state.parties[partyId];
  if (!party?.active) return undefined;

  const truth = nationalLatentSupport(state, blocs);
  const ranked = Object.entries(truth)
    .filter(([id]) => state.parties[id]?.active)
    .sort((a, b) => b[1] - a[1]);
  const top2Floor = ranked[1]?.[1] ?? 0;
  const score = truth[partyId] ?? 0;

  const allies = party.naturalAllies
    .filter((id) => state.parties[id]?.active)
    .map((id) => ({ id, score: truth[id] ?? 0 }))
    .sort((a, b) => b.score - a.score);
  const bestPartner = allies[0];

  const partnerAheadMargin = bestPartner ? bestPartner.score - score : 0;
  const combinedReachesQualification = Boolean(
    bestPartner &&
      score < top2Floor &&
      bestPartner.score < top2Floor &&
      score + bestPartner.score >= top2Floor,
  );

  const pressure = clamp(
    Math.max(0, partnerAheadMargin) * 2.2 + (combinedReachesQualification ? 20 : 0),
    0,
    100,
  );

  return {
    partyId,
    bestPartnerId: bestPartner?.id,
    bestPartnerScore: Number((bestPartner?.score ?? 0).toFixed(2)),
    partnerAheadMargin: Number(partnerAheadMargin.toFixed(2)),
    combinedReachesQualification,
    pressure: Number(pressure.toFixed(2)),
  };
}
