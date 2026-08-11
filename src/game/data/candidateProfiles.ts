import type { CandidateProfile } from "@/game/types";

/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §6-8 :
 * seuls les deux espaces où la recherche datée (`docs/POLITICAL_BASELINE_2026-04.md`)
 * montre une incertitude de candidature réellement structurante — au sens où
 * elle change le profil électoral, pas seulement le nom — reçoivent plusieurs
 * profils. Les sept autres partis gardent un seul acteur candidat (celui déjà
 * défini dans `actors.ts`), sans entrée ici : `resolveCandidateProfiles` (voir
 * `src/game/engine/candidateProfiles.ts`) laisse alors le comportement
 * inchangé par rapport à avant cette mission.
 *
 * `baseSupportDelta` s'applique au `baseSupport` recalibré du parti
 * (`src/game/data/parties.ts`), pas à un ancien chiffre — les deux profils
 * doivent rester à l'intérieur de la fourchette réelle documentée, jamais audit
 * la reproduire au point près (le jeu reste un scénario fictif).
 */
export const candidateProfiles: CandidateProfile[] = [
  {
    id: "rn_ferran_profile",
    partyId: "rn",
    actorId: "rn_ferran",
    isDefault: false,
    resolutionSource: "external_uncertainty",
    probabilityWeight: 0.35,
    baselineModifier: {
      baseSupportDelta: -1.2,
      cohesionDelta: 2,
      transferabilityDelta: -1.5,
    },
    internalSummary:
      "Figure historique du RN, ligne plus sociale-étatiste et protectionniste, fidélité du noyau " +
      "plus marquée, crossover plus faible vers la droite libérale. Analogue structurel : génération " +
      "antérieure de la direction du parti, dont la candidature dépend d'une procédure judiciaire " +
      "encore incertaine au 18 avril 2026 (voir docs/POLITICAL_BASELINE_2026-04.md §0).",
  },
  {
    id: "rn_montclar_profile",
    partyId: "rn",
    actorId: "rn_candidate",
    isDefault: true,
    resolutionSource: "external_uncertainty",
    probabilityWeight: 0.65,
    baselineModifier: {
      baseSupportDelta: 1.2,
      mobilizationDelta: 1,
      transferabilityDelta: 1.5,
      credibilityDelta: 1,
    },
    internalSummary:
      "Dauphine générationnelle, ligne de normalisation/dédiabolisation, meilleur crossover vers la " +
      "droite libérale, style plus communicationnel. Profil par défaut le plus probable au 18 avril " +
      "2026 selon la recherche datée (scénario légèrement mieux placé dans les intentions de vote).",
  },
  {
    id: "ps_villedieu_profile",
    partyId: "ps",
    actorId: "ps_candidate",
    isDefault: true,
    resolutionSource: "internal_vote",
    probabilityWeight: 0.55,
    baselineModifier: {
      baseSupportDelta: -1.5,
      cohesionDelta: 1,
    },
    internalSummary:
      "Ligne de continuité institutionnelle du PS, plafond électoral bas mais cohérent avec l'aile " +
      "gouvernementale du parti. Profil par défaut si aucun accord de rassemblement plus large ne se " +
      "concrétise.",
  },
  {
    id: "ps_rassemblement_profile",
    partyId: "ps",
    actorId: "ps_rassemblement",
    isDefault: false,
    resolutionSource: "primary",
    probabilityWeight: 0.45,
    baselineModifier: {
      baseSupportDelta: 4.5,
      credibilityDelta: 3,
      mobilizationDelta: 2,
      cohesionDelta: -3,
      transferabilityDelta: 2,
    },
    internalSummary:
      "Figure de rassemblement pro-européenne hors appareil strict, plafond électoral nettement plus " +
      "haut mais cohésion interne plus fragile (candidature venue de l'extérieur de l'appareil). " +
      "N'émerge que si une primaire élargie ou un accord de rassemblement se concrétise.",
  },
];
