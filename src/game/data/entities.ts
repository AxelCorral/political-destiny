import type { EntityCategory, EntityDefinition, SourceMetadata } from "@/game/types";

import { actors } from "./actors";
import { parties } from "./parties";

const verifiedAt = "2026-08-05";

function source(title: string, publisher: string, url: string): SourceMetadata[] {
  return [{ title, publisher, url, accessedAt: verifiedAt }];
}

function realEntity(
  id: string,
  displayName: string,
  category: EntityCategory,
  allowedUses: string[],
  sourceMetadata?: SourceMetadata[],
): EntityDefinition {
  return {
    id,
    displayName,
    category,
    reality: "real",
    allowedUses,
    sensitivity: category === "public_figure" ? "contextual" : "none",
    verifiedAt,
    ...(sourceMetadata ? { sourceMetadata } : {}),
  };
}

const institutions: EntityDefinition[] = [
  realEntity(
    "assemblee_nationale",
    "Assemblée nationale",
    "institution",
    ["Travail législatif et contexte institutionnel"],
    source("Assemblée nationale", "Assemblée nationale", "https://www.assemblee-nationale.fr/"),
  ),
  realEntity(
    "senat",
    "Sénat",
    "institution",
    ["Travail législatif et contexte institutionnel"],
    source("Sénat", "Sénat", "https://www.senat.fr/"),
  ),
  realEntity(
    "conseil_constitutionnel",
    "Conseil constitutionnel",
    "institution",
    ["Contrôle constitutionnel et élection présidentielle"],
    source(
      "Conseil constitutionnel",
      "Conseil constitutionnel",
      "https://www.conseil-constitutionnel.fr/",
    ),
  ),
  realEntity(
    "conseil_etat",
    "Conseil d’État",
    "institution",
    ["Conseil juridique et contentieux administratif"],
    source("Conseil d’État", "Conseil d’État", "https://www.conseil-etat.fr/"),
  ),
  realEntity(
    "cour_des_comptes",
    "Cour des comptes",
    "institution",
    ["Contrôle de l’emploi des fonds publics"],
    source("Cour des comptes", "Cour des comptes", "https://www.ccomptes.fr/"),
  ),
  realEntity(
    "elysee",
    "Palais de l’Élysée",
    "institution",
    ["Fonction présidentielle et soirée électorale"],
    source("Présidence de la République", "Élysée", "https://www.elysee.fr/"),
  ),
  realEntity("matignon", "Hôtel de Matignon", "institution", [
    "Fonction du Premier ministre et formation du gouvernement",
  ]),
  realEntity(
    "ministere_interieur",
    "Ministère de l’Intérieur",
    "institution",
    ["Organisation et résultats des élections"],
    source(
      "Les élections en France",
      "Ministère de l’Intérieur",
      "https://www.elections.interieur.gouv.fr/",
    ),
  ),
  realEntity("ministere_economie", "Ministère de l’Économie et des Finances", "institution", [
    "Politique économique et budgétaire",
  ]),
  realEntity(
    "ministere_transition_ecologique",
    "Ministère de la Transition écologique",
    "institution",
    ["Politique climatique et énergétique"],
  ),
  realEntity(
    "banque_de_france",
    "Banque de France",
    "institution",
    ["Conjoncture, inflation et stabilité financière"],
    source("Banque de France", "Banque de France", "https://www.banque-france.fr/"),
  ),
  realEntity(
    "insee",
    "Insee",
    "institution",
    ["Données publiques économiques et sociales"],
    source("Insee", "Insee", "https://www.insee.fr/"),
  ),
  realEntity(
    "commission_nationale_comptes_campagne",
    "Commission nationale des comptes de campagne et des financements politiques",
    "institution",
    ["Règles de financement électoral"],
    source("CNCCFP", "CNCCFP", "https://www.cnccfp.fr/"),
  ),
  realEntity(
    "arcom",
    "Arcom",
    "institution",
    ["Pluralisme et temps de parole audiovisuel"],
    source("Arcom", "Arcom", "https://www.arcom.fr/"),
  ),
  realEntity(
    "cnil",
    "Commission nationale de l’informatique et des libertés",
    "institution",
    ["Protection des données personnelles et notification d’incident"],
    source("CNIL", "CNIL", "https://www.cnil.fr/"),
  ),
  realEntity(
    "commission_europeenne",
    "Commission européenne",
    "institution",
    ["Décisions et négociations de l’Union européenne"],
    source("Commission européenne", "Union européenne", "https://commission.europa.eu/"),
  ),
  realEntity(
    "bce",
    "Banque centrale européenne",
    "institution",
    ["Politique monétaire de la zone euro"],
    source(
      "Banque centrale européenne",
      "Banque centrale européenne",
      "https://www.ecb.europa.eu/",
    ),
  ),
];

const media: EntityDefinition[] = [
  realEntity("france_2", "France 2", "media", ["Journal télévisé, interview et débat factuels"]),
  realEntity("france_3", "France 3", "media", ["Actualité régionale et débat territorial"]),
  realEntity("franceinfo", "franceinfo", "media", ["Information continue et entretien politique"]),
  realEntity("france_inter", "France Inter", "media", ["Matinale et entretien radiophonique"]),
  realEntity("france_culture", "France Culture", "media", ["Entretien de fond et débat d’idées"]),
  realEntity("tf1", "TF1", "media", ["Journal télévisé et grand entretien"]),
  realEntity("bfmtv", "BFMTV", "media", ["Information continue et soirée électorale"]),
  realEntity("lcp", "LCP — Assemblée nationale", "media", [
    "Débat parlementaire et institutionnel",
  ]),
  realEntity("public_senat", "Public Sénat", "media", ["Débat parlementaire et territorial"]),
  realEntity("le_monde", "Le Monde", "media", ["Entretien écrit et analyse de programme"]),
  realEntity("le_figaro", "Le Figaro", "media", ["Entretien écrit et débat d’idées"]),
  realEntity("les_echos", "Les Échos", "media", ["Entretien économique et analyse budgétaire"]),
  realEntity("la_croix", "La Croix", "media", ["Entretien politique et questions sociales"]),
  realEntity("mediapart", "Mediapart", "media", [
    "Questions de transparence sur des personnages fictifs uniquement",
  ]),
];

const formats: EntityDefinition[] = [
  realEntity("journal_20_heures", "Journal télévisé de 20 heures", "broadcast_format", [
    "Interview politique simulée",
  ]),
  realEntity("matinale_radio", "Matinale radiophonique", "broadcast_format", [
    "Interview politique simulée",
  ]),
  realEntity("debat_premier_tour", "Débat de premier tour", "broadcast_format", [
    "Confrontation entre candidats fictifs",
  ]),
  realEntity("debat_entre_deux_tours", "Débat de l’entre-deux-tours", "broadcast_format", [
    "Confrontation entre finalistes fictifs",
  ]),
  realEntity("conference_presse", "Conférence de presse", "broadcast_format", [
    "Présentation publique d’une décision ou d’un programme",
  ]),
];

const countries: EntityDefinition[] = [
  ["france", "France"],
  ["allemagne", "Allemagne"],
  ["italie", "Italie"],
  ["espagne", "Espagne"],
  ["belgique", "Belgique"],
  ["pologne", "Pologne"],
  ["ukraine", "Ukraine"],
  ["royaume_uni", "Royaume-Uni"],
  ["etats_unis", "États-Unis"],
  ["canada", "Canada"],
  ["chine", "Chine"],
  ["japon", "Japon"],
  ["inde", "Inde"],
  ["algerie", "Algérie"],
  ["maroc", "Maroc"],
  ["senegal", "Sénégal"],
].map(([id, name]) =>
  realEntity(id!, name!, "country", ["Contexte diplomatique ou économique factuel"]),
);

const territories: EntityDefinition[] = [
  ["paris", "Paris"],
  ["saint_denis", "Saint-Denis"],
  ["marseille", "Marseille"],
  ["lyon", "Lyon"],
  ["lille", "Lille"],
  ["strasbourg", "Strasbourg"],
  ["rennes", "Rennes"],
  ["nantes", "Nantes"],
  ["bordeaux", "Bordeaux"],
  ["toulouse", "Toulouse"],
  ["montpellier", "Montpellier"],
  ["nice", "Nice"],
  ["clermont_ferrand", "Clermont-Ferrand"],
  ["rouen", "Rouen"],
  ["dijon", "Dijon"],
  ["hauts_de_france", "Hauts-de-France"],
  ["grand_est", "Grand Est"],
  ["bretagne", "Bretagne"],
  ["nouvelle_aquitaine", "Nouvelle-Aquitaine"],
  ["occitanie", "Occitanie"],
  ["provence_alpes_cote_azur", "Provence-Alpes-Côte d’Azur"],
  ["guadeloupe", "Guadeloupe"],
  ["martinique", "Martinique"],
  ["guyane", "Guyane"],
  ["la_reunion", "La Réunion"],
  ["mayotte", "Mayotte"],
].map(([id, name]) =>
  realEntity(id!, name!, "territory", ["Déplacement de campagne et contexte territorial"]),
);

const organizations: EntityDefinition[] = [
  realEntity("union_europeenne", "Union européenne", "organization", [
    "Cadre politique, juridique et économique européen",
  ]),
  realEntity("cgt", "CGT", "organization", ["Position syndicale factuelle et dialogue social"]),
  realEntity("cfdt", "CFDT", "organization", ["Position syndicale factuelle et dialogue social"]),
  realEntity("force_ouvriere", "Force ouvrière", "organization", [
    "Position syndicale factuelle et dialogue social",
  ]),
  realEntity("medef", "Medef", "organization", [
    "Position patronale factuelle et dialogue économique",
  ]),
  realEntity("cpme", "CPME", "organization", ["Position des petites et moyennes entreprises"]),
  realEntity("fnsea", "FNSEA", "organization", ["Agriculture et dialogue professionnel"]),
  realEntity("confederation_paysanne", "Confédération paysanne", "organization", [
    "Agriculture et dialogue professionnel",
  ]),
  realEntity("france_nature_environnement", "France Nature Environnement", "organization", [
    "Environnement et débat public",
  ]),
  realEntity(
    "fondation_abbe_pierre",
    "Fondation pour le logement des défavorisés",
    "organization",
    ["Données et plaidoyer publics sur le mal-logement"],
  ),
  realEntity("association_maires_france", "Association des maires de France", "organization", [
    "Collectivités territoriales et services locaux",
  ]),
  realEntity("croix_rouge_francaise", "Croix-Rouge française", "organization", [
    "Aide humanitaire et situations d’urgence",
  ]),
];

const partyEntities: EntityDefinition[] = parties.map((party) =>
  realEntity(
    party.id,
    party.displayName,
    "party",
    ["Identité, positionnement et compétition électorale factuels"],
    party.sourceMetadata,
  ),
);

const fictionalCharacters: EntityDefinition[] = actors.map((actor) => ({
  id: actor.id,
  displayName: actor.displayName,
  category: "fictional_character",
  reality: "fictional",
  allowedUses: ["Péripéties, dialogues et situations sensibles explicitement fictifs"],
  sensitivity: "sensitive",
  notes:
    actor.role === "candidate" || actor.partyId !== "independent_fictional"
      ? "Personnage créé pour la simulation ; profil politique structurellement cohérent avec un archétype réel documenté dans docs/FICTIONAL_POLITICAL_ARCHETYPES.md (pseudo-réalité, pas un reskin nom pour nom). Aucun contenu sensible ne lui est jamais attribué."
      : "Personnage secondaire créé pour la simulation ; aucune correspondance avec une personne réelle n’est recherchée.",
}));

const fictionalNarrativeFigures: EntityDefinition[] = [
  {
    id: "fictional_artist_nina_sorel",
    displayName: "Nina Sorel",
    category: "fictional_character",
    reality: "fictional",
    allowedUses: ["Soutien artistique fictif et débat public sur le logement"],
    sensitivity: "contextual",
    notes: "Artiste entièrement fictive créée pour la simulation.",
  },
];

export const entities: EntityDefinition[] = [
  ...institutions,
  ...media,
  ...formats,
  ...countries,
  ...territories,
  ...organizations,
  ...partyEntities,
  ...fictionalCharacters,
  ...fictionalNarrativeFigures,
];
