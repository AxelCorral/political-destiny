import type { CandidateProfile } from "@/game/types";

/**
 * V3 — casting réel (docs/POLITICAL_BASELINE_2026-11.md).
 *
 * Seuls le RN et le PS portent plusieurs profils jouables :
 * - RN : Marine Le Pen, éligible au 05/11/2026 (pourvoi en cassation en cours), ou Jordan
 *   Bardella si le joueur choisit l'hypothèse d'un renoncement. Pour les PNJ, Le Pen part
 *   toujours candidate ; un remplacement ne peut survenir qu'en cours de partie via le
 *   coup de théâtre « inéligibilité » du directeur de campagne.
 * - PS – Place publique : Raphaël Glucksmann, Olivier Faure ou Ségolène Royal. La campagne
 *   démarre en septembre 2026, avant la primaire du pôle socialiste, qui est rejouée en
 *   partie : le joueur choisit qui il incarne, les PNJ partent avec Glucksmann.
 *
 * Les poids nuls rendent la résolution PNJ déterministe sur le profil par défaut, tout
 * en laissant le joueur choisir explicitement un profil alternatif.
 */
export const candidateProfiles: CandidateProfile[] = [
  {
    id: "rn_lepen_profile",
    partyId: "rn",
    actorId: "rn_candidate",
    isDefault: true,
    resolutionSource: "external_uncertainty",
    probabilityWeight: 1,
    baselineModifier: {
      baseSupportDelta: 0,
    },
    internalSummary:
      "Candidate déclarée, socle le plus fidèle du RN, rejet plus élevé au second tour. " +
      "Éligibilité suspendue à la décision de la Cour de cassation (scénario de coup de théâtre).",
  },
  {
    id: "rn_bardella_profile",
    partyId: "rn",
    actorId: "rn_bardella",
    isDefault: false,
    resolutionSource: "external_uncertainty",
    probabilityWeight: 0,
    baselineModifier: {
      baseSupportDelta: -1,
      mobilizationDelta: 1,
      transferabilityDelta: 2,
      credibilityDelta: -1,
      rejectionDelta: -3,
    },
    internalSummary:
      "Hypothèse « Et si Marine Le Pen avait renoncé » : président du RN, meilleur crossover " +
      "vers la droite libérale, rejet un peu plus bas, moins d'expérience gouvernementale perçue.",
  },
  {
    id: "ps_glucksmann_profile",
    partyId: "ps",
    actorId: "ps_candidate",
    isDefault: true,
    resolutionSource: "primary",
    probabilityWeight: 1,
    baselineModifier: {
      baseSupportDelta: 0,
      credibilityDelta: 1,
    },
    internalSummary:
      "Favori de la primaire du pôle socialiste : social-démocratie pro-européenne, bonne image " +
      "chez les diplômés urbains, cohésion de l'appareil fragile.",
  },
  {
    id: "ps_faure_profile",
    partyId: "ps",
    actorId: "ps_faure",
    isDefault: false,
    resolutionSource: "primary",
    probabilityWeight: 0,
    baselineModifier: {
      baseSupportDelta: -2.5,
      cohesionDelta: 4,
      mobilizationDelta: 1,
      credibilityDelta: -1,
    },
    internalSummary:
      "Premier secrétaire : maîtrise de l'appareil et des élus, notoriété et plafond plus bas.",
  },
  {
    id: "ps_royal_profile",
    partyId: "ps",
    actorId: "ps_royal",
    isDefault: false,
    resolutionSource: "primary",
    probabilityWeight: 0,
    baselineModifier: {
      baseSupportDelta: -1.5,
      mobilizationDelta: 2,
      cohesionDelta: -4,
      rejectionDelta: 3,
    },
    internalSummary:
      "Retour d'une ancienne finaliste : notoriété immédiate et ferveur militante, relations " +
      "tendues avec l'appareil.",
  },
];
