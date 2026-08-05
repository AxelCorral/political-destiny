import type { RealWorldSnapshot, SourceMetadata } from "@/game/types";

const accessedAt = "2026-08-05";

const sources: SourceMetadata[] = [
  {
    title: "La France insoumise — site officiel",
    publisher: "La France insoumise",
    url: "https://lafranceinsoumise.fr/",
    accessedAt,
  },
  {
    title: "Parti socialiste — site officiel",
    publisher: "Parti socialiste",
    url: "https://parti-socialiste.fr/",
    accessedAt,
  },
  {
    title: "Les Écologistes — site officiel",
    publisher: "Les Écologistes",
    url: "https://lesecologistes.fr/",
    accessedAt,
  },
  {
    title: "Renaissance — site officiel",
    publisher: "Renaissance",
    url: "https://parti-renaissance.fr/",
    accessedAt,
  },
  {
    title: "Horizons — site officiel",
    publisher: "Horizons",
    url: "https://horizonsleparti.fr/",
    accessedAt,
  },
  {
    title: "Les Républicains — site officiel",
    publisher: "Les Républicains",
    url: "https://republicains.fr/",
    accessedAt,
  },
  {
    title: "Rassemblement national — site officiel",
    publisher: "Rassemblement national",
    url: "https://rassemblementnational.fr/",
    accessedAt,
  },
  {
    title: "Reconquête — site officiel",
    publisher: "Reconquête",
    url: "https://www.parti-reconquete.fr/",
    accessedAt,
  },
  {
    title: "Nouvelle Énergie — site officiel",
    publisher: "Nouvelle Énergie",
    url: "https://www.unenouvelleenergie.fr/",
    accessedAt,
  },
  {
    title: "UDR — site officiel",
    publisher: "Union des droites pour la République",
    url: "https://www.udr.fr/",
    accessedAt,
  },
];

export const realWorldSnapshot: RealWorldSnapshot = {
  snapshotDate: accessedAt,
  lastEditorialReviewAt: accessedAt,
  electionDateStatus: "configured",
  parties: [
    ["lfi", "La France insoumise", ["LFI"], "https://lafranceinsoumise.fr/"],
    ["ps", "Parti socialiste", ["PS"], "https://parti-socialiste.fr/"],
    ["ecologistes", "Les Écologistes", ["EELV"], "https://lesecologistes.fr/"],
    ["renaissance", "Renaissance", ["LREM", "En Marche"], "https://parti-renaissance.fr/"],
    ["horizons", "Horizons", [], "https://horizonsleparti.fr/"],
    ["lr", "Les Républicains", ["LR"], "https://republicains.fr/"],
    ["rn", "Rassemblement national", ["RN", "FN"], "https://rassemblementnational.fr/"],
    ["reconquete", "Reconquête", ["Reconquête !"], "https://www.parti-reconquete.fr/"],
    ["nouvelle_energie", "Nouvelle Énergie", ["NE"], "https://www.unenouvelleenergie.fr/"],
  ].map(([id, displayName, aliases, officialWebsite]) => ({
    id: id as string,
    displayName: displayName as string,
    aliases: aliases as string[],
    officialWebsite: officialWebsite as string,
    reviewedAt: accessedAt,
    status: "verified" as const,
  })),
  publicFigures: [],
  sourceMetadata: sources,
  editorialNotes: [
    "Le snapshot vérifie uniquement les dénominations et sites publics utiles à la configuration.",
    "Aucune personnalité réelle n’est jouable et aucun dialogue ne lui est attribué.",
    "Les niveaux de soutien, traits, probabilités et résultats sont des paramètres fictifs de gameplay, non issus de sondages.",
    "La date électorale utilisée par défaut est configurable et n’est pas présentée ici comme une annonce institutionnelle.",
  ],
};
