import type { ElectorateBlocDefinition, GameState } from "@/game/types";

import { clamp, ideologyDistance } from "./math";
import { normalizePercentages } from "./math";
import { nationalLatentSupport } from "./electorate";

export interface RedistributionResult {
  state: GameState;
  /** Points de score national gagnés/perdus par parti (positif = gain), pour le feedback narratif. */
  transfers: Record<string, number>;
  abstentionGainPoints: number;
}

/**
 * AUDIT_STRATEGIC_REALIGNMENTS.md §9/§15 — une consigne de vote plus forte
 * doit redistribuer différemment (§17 du prompt de mission : « accord fort >
 * soutien explicite > retrait neutre »), jamais de façon additive avec les
 * autres bonus (l'ancien empilement multiplicatif `relationBoost ×
 * alreadyAllied × explicitEndorsement`, jusqu'à ×3,46, expliquait les chocs
 * "propres" les plus élevés du corpus d'audit — un parti moyen transférant la
 * quasi-totalité de son socle à un seul destinataire). Un seul palier
 * s'applique par destinataire, choisi par priorité, jamais cumulé.
 */
export type ConsigneStrength = "none" | "explicit_support" | "coalition_agreement";

const CONSIGNE_WEIGHT_MULTIPLIER: Record<ConsigneStrength, number> = {
  none: 1,
  explicit_support: 1.45,
  coalition_agreement: 1.8,
};

/** Une consigne plus forte fidélise davantage l'électorat transféré (moins d'abstention). */
const CONSIGNE_ABSTENTION_ADJUSTMENT: Record<ConsigneStrength, number> = {
  none: 0,
  explicit_support: -0.03,
  coalition_agreement: -0.06,
};

function resolveConsigneStrength(
  state: GameState,
  withdrawing: GameState["parties"][string],
  recipientId: string,
  explicitConsigne?: { partnerId: string; strength: ConsigneStrength },
): ConsigneStrength {
  if (explicitConsigne && explicitConsigne.partnerId === recipientId) return explicitConsigne.strength;
  if (withdrawing.alliedWith.includes(recipientId)) return "coalition_agreement";
  if (state.flags[`endorsement:${withdrawing.id}`] === recipientId) return "explicit_support";
  return "none";
}

/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §12-14 —
 * quand un parti se retire, ses électeurs ne disparaissent pas : ce moteur
 * redistribue, bloc électoral par bloc électoral, la part de soutien latent
 * du parti retiré (`state.electorate.latentSupport[bloc][partyId]`) vers les
 * autres partis actifs, pondérée par la proximité idéologique, la relation
 * entre partis, une alliance déjà active, un endorsement explicite déjà posé,
 * et le rejet du destinataire — avec une part réservée à l'indécision/
 * abstention. Réutilise `ideologyDistance`/`normalizePercentages` (moteur
 * réel) ; jamais de redistribution fixe (§13 : « ne pas imposer une
 * redistribution fixe 50/50 »).
 *
 * `explicitConsigne` (optionnel) porte la consigne d'un désistement
 * stratégique négocié (`strategicWithdrawal.ts`) — un partenaire précis et un
 * palier de consigne, en plus (jamais à la place) de la sensibilité
 * idéologique/relationnelle déjà en place pour les autres destinataires.
 */
export function redistributeElectorate(
  sourceState: GameState,
  blocs: ElectorateBlocDefinition[],
  withdrawingPartyId: string,
  explicitConsigne?: { partnerId: string; strength: ConsigneStrength },
): RedistributionResult {
  const state = structuredClone(sourceState);
  const withdrawing = state.parties[withdrawingPartyId];
  if (!withdrawing) return { state, transfers: {}, abstentionGainPoints: 0 };

  const eligibleRecipients = Object.values(state.parties).filter(
    (party) => party.active && party.id !== withdrawingPartyId,
  );
  if (eligibleRecipients.length === 0) return { state, transfers: {}, abstentionGainPoints: 0 };

  const before = nationalLatentSupport(state, blocs);

  for (const bloc of blocs) {
    const blocSupport = state.electorate.latentSupport[bloc.id];
    if (!blocSupport) continue;
    const releasedShare = blocSupport[withdrawingPartyId] ?? 0;
    if (releasedShare <= 0) continue;

    const weights = eligibleRecipients.map((recipient) => {
      const distance = ideologyDistance(withdrawing.perceivedIdeology, recipient.perceivedIdeology);
      const ideologicalFit = Math.max(0.05, 1 - distance / 200);
      const relation = state.partyRelations[withdrawingPartyId]?.[recipient.id] ?? 0;
      const relationBoost = clamp(1 + relation / 120, 0.6, 1.6);
      const consigne = resolveConsigneStrength(state, withdrawing, recipient.id, explicitConsigne);
      const consigneBoost = CONSIGNE_WEIGHT_MULTIPLIER[consigne];
      const rejectionPenalty = clamp(1 - recipient.stats.rejection / 160, 0.35, 1);
      return Math.max(0.02, ideologicalFit * relationBoost * consigneBoost * rejectionPenalty);
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    const averageDistance =
      eligibleRecipients.reduce(
        (sum, recipient) =>
          sum + ideologyDistance(withdrawing.perceivedIdeology, recipient.perceivedIdeology),
        0,
      ) / eligibleRecipients.length;
    const strongestConsigne = explicitConsigne
      ? explicitConsigne.strength
      : eligibleRecipients.reduce<ConsigneStrength>((strongest, recipient) => {
          const consigne = resolveConsigneStrength(state, withdrawing, recipient.id);
          return CONSIGNE_WEIGHT_MULTIPLIER[consigne] > CONSIGNE_WEIGHT_MULTIPLIER[strongest]
            ? consigne
            : strongest;
        }, "none");
    const abstentionProbability = clamp(
      0.14 + averageDistance / 500 + CONSIGNE_ABSTENTION_ADJUSTMENT[strongestConsigne],
      0.06,
      0.42,
    );
    const distributable = releasedShare * (1 - abstentionProbability);
    const toUndecided = releasedShare - distributable;

    const raw = { ...blocSupport };
    raw[withdrawingPartyId] = 0;
    eligibleRecipients.forEach((recipient, index) => {
      const share =
        totalWeight > 0
          ? (weights[index]! / totalWeight) * distributable
          : distributable / eligibleRecipients.length;
      raw[recipient.id] = (raw[recipient.id] ?? 0) + share;
    });
    state.electorate.latentSupport[bloc.id] = normalizePercentages(raw, 3);
    state.electorate.undecidedByBloc[bloc.id] = clamp(
      (state.electorate.undecidedByBloc[bloc.id] ?? 10) + toUndecided,
      2,
      60,
    );
  }

  const national = nationalLatentSupport(state, blocs);
  for (const party of Object.values(state.parties)) {
    party.stats.polling = national[party.id] ?? 0;
  }

  const transfers = Object.fromEntries(
    Object.keys(state.parties).map((partyId) => [
      partyId,
      Number(((national[partyId] ?? 0) - (before[partyId] ?? 0)).toFixed(3)),
    ]),
  );

  return {
    state,
    transfers,
    abstentionGainPoints: -(transfers[withdrawingPartyId] ?? 0),
  };
}

/**
 * §13-14 — une alliance formée n'est pas un retrait, mais elle doit avoir un
 * effet de redistribution immédiat et mesurable (contrairement à avant cette
 * mission, où `formAlliance` ne posait qu'un bonus de transférabilité
 * différé). Transfère une fraction modeste (jamais la totalité — l'allié
 * garde sa propre existence électorale) du soutien latent de chaque parti
 * vers l'autre, dans les blocs où leurs affinités idéologiques respectives
 * sont déjà proches, pondérée par la qualité de la relation.
 */
export function redistributeAllianceBoost(
  sourceState: GameState,
  blocs: ElectorateBlocDefinition[],
  partyId: string,
  partnerId: string,
): GameState {
  const state = structuredClone(sourceState);
  const party = state.parties[partyId];
  const partner = state.parties[partnerId];
  if (!party || !partner) return state;

  const relation = state.partyRelations[partyId]?.[partnerId] ?? 0;
  const transferFraction = clamp(0.02 + Math.max(0, relation) / 900, 0.02, 0.07);

  for (const bloc of blocs) {
    const blocSupport = state.electorate.latentSupport[bloc.id];
    if (!blocSupport) continue;
    const partyDistance = ideologyDistance(party.perceivedIdeology, bloc.ideology);
    const partnerDistance = ideologyDistance(partner.perceivedIdeology, bloc.ideology);
    // Le transfert va vers celui des deux qui est structurellement le mieux
    // placé dans CE bloc précis — pas un partage uniforme entre les deux.
    const raw = { ...blocSupport };
    if (partnerDistance < partyDistance) {
      const moved = (raw[partyId] ?? 0) * transferFraction;
      raw[partyId] = (raw[partyId] ?? 0) - moved;
      raw[partnerId] = (raw[partnerId] ?? 0) + moved;
    } else {
      const moved = (raw[partnerId] ?? 0) * transferFraction;
      raw[partnerId] = (raw[partnerId] ?? 0) - moved;
      raw[partyId] = (raw[partyId] ?? 0) + moved;
    }
    state.electorate.latentSupport[bloc.id] = normalizePercentages(raw, 3);
  }

  const national = nationalLatentSupport(state, blocs);
  for (const candidate of Object.values(state.parties)) {
    candidate.stats.polling = national[candidate.id] ?? 0;
  }
  return state;
}
