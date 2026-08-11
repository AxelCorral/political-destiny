import type { MajorEndorsementDefinition } from "@/game/types";

/**
 * §16-18 du prompt de mission — un soutien majeur n'est jamais un bonus
 * universel : `positiveEffects` profite au parti soutenu, `negativeEffects`
 * représente le coût réel (crédibilité entamée auprès d'un autre électorat,
 * rejet accru chez un bloc hostile à la figure). Catalogue volontairement
 * restreint (§31, priorité à la qualité) — voir
 * `src/game/data/events/v2/endorsements.ts` pour les événements qui les
 * déclenchent réellement en jeu.
 */
export const majorEndorsements: MajorEndorsementDefinition[] = [
  {
    id: "endorsement_alvarez_market_liberalism",
    figureId: "world_argentina_president",
    figureKind: "world_figure",
    figureLabel: "Mateo Álvarez, président argentin",
    eligiblePartyIds: ["nouvelle_energie", "reconquete"],
    requiredAffinityTags: ["deregulation", "market_liberalism"],
    credibilityWeight: 58,
    positiveEffects: [
      { kind: "party_stat", stat: "mediaPresence", delta: 5, label: "Présence médiatique +5" },
      { kind: "party_stat", stat: "mobilization", delta: 3, label: "Mobilisation +3" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "credibility", delta: -2, label: "Crédibilité -2" },
      { kind: "party_stat", stat: "rejection", delta: 2, label: "Rejet +2" },
    ],
    internalContext:
      "Salue une dérégulation ou une rupture libérale explicite du programme du parti soutenu ; " +
      "coûte de la crédibilité auprès de l'électorat modéré qui associe la figure à des politiques " +
      "d'austérité perçues comme brutales.",
  },
  {
    id: "endorsement_brandt_european",
    figureId: "world_germany_chancellor",
    figureKind: "world_figure",
    figureLabel: "Elke Brandt, chancelière allemande",
    eligiblePartyIds: ["renaissance", "horizons", "lr"],
    requiredAffinityTags: ["european_integration", "franco_german_partnership"],
    credibilityWeight: 70,
    positiveEffects: [
      { kind: "party_stat", stat: "credibility", delta: 4, label: "Crédibilité +4" },
      { kind: "party_stat", stat: "mediaPresence", delta: 3, label: "Présence médiatique +3" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "mobilization", delta: -2, label: "Mobilisation -2" },
    ],
    internalContext:
      "Signal diplomatique de confiance côté partenariat franco-allemand ; renforce la crédibilité " +
      "gouvernementale mais peine à mobiliser un électorat plus sensible aux enjeux nationaux.",
  },
  {
    id: "endorsement_ashworth_social_democratic",
    figureId: "world_uk_pm",
    figureKind: "world_figure",
    figureLabel: "Daniel Ashworth, premier ministre britannique",
    eligiblePartyIds: ["ps", "ecologistes"],
    requiredAffinityTags: ["social_democracy", "pragmatic_european_cooperation"],
    credibilityWeight: 55,
    positiveEffects: [
      { kind: "party_stat", stat: "mediaPresence", delta: 4, label: "Présence médiatique +4" },
      { kind: "party_stat", stat: "credibility", delta: 2, label: "Crédibilité +2" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "rejection", delta: 1.5, label: "Rejet +1,5" },
    ],
    internalContext:
      "Soutien de réformisme pragmatique post-Brexit ; renforce la crédibilité internationale sans " +
      "mobiliser fortement, et alimente légèrement la critique d'un alignement atlantiste chez l'aile " +
      "la plus à gauche.",
  },
  {
    id: "endorsement_whitfield_national_right",
    figureId: "world_us_president",
    figureKind: "world_figure",
    figureLabel: "Carter Whitfield, président des États-Unis",
    eligiblePartyIds: ["rn", "reconquete"],
    requiredAffinityTags: ["national_line", "immigration_skepticism"],
    credibilityWeight: 62,
    positiveEffects: [
      { kind: "party_stat", stat: "mobilization", delta: 5, label: "Mobilisation +5" },
      { kind: "party_stat", stat: "mediaPresence", delta: 6, label: "Présence médiatique +6" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "credibility", delta: -3, label: "Crédibilité -3" },
      { kind: "party_stat", stat: "rejection", delta: 3, label: "Rejet +3" },
    ],
    internalContext:
      "Mobilise fortement le noyau militant et la présence médiatique ; dégrade la crédibilité " +
      "gouvernementale perçue et renforce le rejet chez l'électorat centriste — soutien clivant, " +
      "jamais un bonus universel (§18 du prompt de mission).",
  },

  // §18-23 du prompt de mission RECOMPOSITIONS_STRATEGIQUES — soutiens
  // nationaux pseudonymisés, un par figure de `src/game/data/nationalFigures.ts`.
  // Même règle qu'au-dessus : `figureKind` distinct des figures étrangères
  // (`"fictional_prestige_figure"` pour ces personnalités françaises
  // pseudonymisées, jamais `"domestic_entity"`, réservé à une future
  // institution réelle), `requiredAffinityTags` structurel, jamais un bonus
  // universel.
  {
    id: "endorsement_cazalis_institutional_continuity",
    figureId: "national_former_centrist_pm",
    figureKind: "fictional_prestige_figure",
    figureLabel: "Bertrand Cazalis, ancien Premier ministre",
    eligiblePartyIds: ["horizons", "renaissance", "lr"],
    requiredAffinityTags: ["continuite_institutionnelle", "reforme_pragmatique"],
    credibilityWeight: 68,
    positiveEffects: [
      { kind: "party_stat", stat: "credibility", delta: 5, label: "Crédibilité +5" },
      { kind: "party_stat", stat: "electedSupport", delta: 2, label: "Soutien d'élus +2" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "momentum", delta: -2, label: "Dynamique -2" },
      { kind: "party_stat", stat: "rejection", delta: 1, label: "Rejet +1" },
    ],
    internalContext:
      "Signal de continuité institutionnelle et de sérieux gouvernemental ; renforce le réseau " +
      "d'élus mais alimente une image de reconduction du même personnel politique, aux dépens de la " +
      "dynamique de renouvellement.",
  },
  {
    id: "endorsement_ravignan_historic_right",
    figureId: "national_historic_right_figure",
    figureKind: "fictional_prestige_figure",
    figureLabel: "Henri de Ravignan, figure historique de la droite",
    eligiblePartyIds: ["lr", "reconquete"],
    requiredAffinityTags: ["tradition_droite", "fermete_securitaire"],
    credibilityWeight: 60,
    positiveEffects: [
      { kind: "party_stat", stat: "mobilization", delta: 4, label: "Mobilisation +4" },
      { kind: "party_stat", stat: "cohesion", delta: 2, label: "Cohésion +2" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "rejection", delta: 2, label: "Rejet +2" },
      { kind: "party_stat", stat: "awareness", delta: -1, label: "Notoriété -1" },
    ],
    internalContext:
      "Rassemble le socle historique et resserre les rangs, au prix d'une image plus datée qui " +
      "peine à élargir au-delà de l'électorat déjà acquis.",
  },
  {
    id: "endorsement_chastagnier_social_democratic",
    figureId: "national_social_democrat_minister",
    figureKind: "fictional_prestige_figure",
    figureLabel: "Sylvie Chastagnier, ancienne ministre des Affaires sociales",
    eligiblePartyIds: ["ps", "ecologistes"],
    requiredAffinityTags: ["social_democratie", "reformisme"],
    credibilityWeight: 57,
    positiveEffects: [
      { kind: "party_stat", stat: "credibility", delta: 3, label: "Crédibilité +3" },
      { kind: "party_stat", stat: "popularity", delta: 2, label: "Popularité +2" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "momentum", delta: -1.5, label: "Dynamique -1,5" },
    ],
    internalContext:
      "Rassure un électorat social-démocrate établi sur le sérieux du projet, mais pèse peu sur la " +
      "dynamique auprès d'un électorat plus jeune en recherche de renouvellement.",
  },
  {
    id: "endorsement_kervadec_left_intellectual",
    figureId: "national_left_intellectual",
    figureKind: "fictional_prestige_figure",
    figureLabel: "Antoine Kervadec, essayiste",
    eligiblePartyIds: ["lfi", "ecologistes"],
    requiredAffinityTags: ["justice_sociale", "critique_du_capitalisme"],
    credibilityWeight: 46,
    positiveEffects: [
      { kind: "party_stat", stat: "awareness", delta: 4, label: "Notoriété +4" },
      { kind: "party_stat", stat: "mediaPresence", delta: 3, label: "Présence médiatique +3" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "credibility", delta: -2, label: "Crédibilité -2" },
      { kind: "party_stat", stat: "rejection", delta: 1.5, label: "Rejet +1,5" },
    ],
    internalContext:
      "Renforce l'écho médiatique et la légitimité intellectuelle du diagnostic porté par le parti ; " +
      "un électorat plus modéré y voit un signe de radicalité qui coûte en crédibilité gouvernementale.",
  },
  {
    id: "endorsement_esteves_liberal_entrepreneur",
    figureId: "national_liberal_entrepreneur",
    figureKind: "fictional_prestige_figure",
    figureLabel: "Guillaume Estèves, chef d'entreprise",
    eligiblePartyIds: ["nouvelle_energie", "renaissance", "horizons"],
    requiredAffinityTags: ["liberte_dentreprendre", "innovation_economique"],
    credibilityWeight: 50,
    positiveEffects: [
      { kind: "party_stat", stat: "finances", delta: 4, label: "Finances +4" },
      { kind: "party_stat", stat: "mediaPresence", delta: 2, label: "Présence médiatique +2" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "rejection", delta: 1.5, label: "Rejet +1,5" },
      { kind: "hidden_stat", stat: "potentialSupport", delta: -1, visibility: "hidden" },
    ],
    internalContext:
      "Apporte un soutien financier et une couverture médiatique économique réels, au prix d'une " +
      "image plus favorable aux catégories aisées qui referme une partie du potentiel populaire.",
  },
  {
    id: "endorsement_brancourt_sovereigntist",
    figureId: "national_sovereigntist_figure",
    figureKind: "fictional_prestige_figure",
    figureLabel: "Odile Brancourt, ancienne parlementaire souverainiste",
    eligiblePartyIds: ["rn", "reconquete", "lr"],
    requiredAffinityTags: ["souverainete_nationale", "controle_des_frontieres"],
    credibilityWeight: 44,
    positiveEffects: [
      { kind: "party_stat", stat: "mobilization", delta: 4, label: "Mobilisation +4" },
      { kind: "party_stat", stat: "momentum", delta: 2, label: "Dynamique +2" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "credibility", delta: -2.5, label: "Crédibilité -2,5" },
      { kind: "party_stat", stat: "rejection", delta: 2.5, label: "Rejet +2,5" },
    ],
    internalContext:
      "Galvanise le noyau souverainiste, mais accentue le rejet chez un électorat centriste déjà " +
      "sensible au risque d'isolement européen du parti.",
  },
  {
    id: "endorsement_ferrandi_local_network",
    figureId: "national_influential_local_elected",
    figureKind: "fictional_prestige_figure",
    figureLabel: "Marc Ferrandi, président de conseil départemental",
    eligiblePartyIds: ["horizons", "lr", "nouvelle_energie"],
    requiredAffinityTags: ["ancrage_local", "gestion_de_proximite"],
    credibilityWeight: 42,
    positiveEffects: [
      { kind: "party_stat", stat: "localStrength", delta: 4, label: "Implantation locale +4" },
      { kind: "party_stat", stat: "electedSupport", delta: 3, label: "Soutien d'élus +3" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "awareness", delta: -1, label: "Notoriété -1" },
    ],
    internalContext:
      "Solidifie le maillage local et le soutien des élus de terrain ; apporte peu de visibilité " +
      "nationale, faute d'exposition médiatique propre à la figure.",
  },
  {
    id: "endorsement_aurousseau_green_governance",
    figureId: "national_former_green_official",
    figureKind: "fictional_prestige_figure",
    figureLabel: "Camille Aurousseau, ancienne responsable écologiste",
    eligiblePartyIds: ["ecologistes", "ps", "renaissance"],
    requiredAffinityTags: ["ecologie_de_gouvernement", "transition_pragmatique"],
    credibilityWeight: 40,
    positiveEffects: [
      { kind: "party_stat", stat: "credibility", delta: 2.5, label: "Crédibilité +2,5" },
      { kind: "party_stat", stat: "popularity", delta: 1.5, label: "Popularité +1,5" },
    ],
    negativeEffects: [
      { kind: "party_stat", stat: "mobilization", delta: -1.5, label: "Mobilisation -1,5" },
    ],
    internalContext:
      "Crédibilise une ligne écologique de gouvernement auprès d'un électorat modéré, au prix d'une " +
      "mobilisation plus faible chez l'aile la plus militante, qui y voit un renoncement.",
  },
];
