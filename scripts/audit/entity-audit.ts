import { mkdir, writeFile } from "node:fs/promises";

import { gameContent } from "../../src/game/data/index";

type EntityCategory =
  | "parti réel"
  | "parti fictif"
  | "personnalité politique réelle"
  | "personnalité fictive"
  | "média réel"
  | "média fictif"
  | "émission réelle"
  | "émission fictive"
  | "institution réelle"
  | "institution fictive"
  | "pays réel"
  | "pays fictif"
  | "ville ou région réelle"
  | "lieu fictif"
  | "organisation réelle"
  | "organisation fictive"
  | "événement historique réel"
  | "événement inventé"
  | "entité ambiguë ou non identifiable";

type EditorialClass =
  | "réel utilisable"
  | "réel à actualiser ou sourcer"
  | "fiction nécessaire"
  | "fiction acceptable"
  | "fiction paresseuse"
  | "fiction qui réduit fortement l’immersion";

interface ClassifiedEntity {
  name: string;
  category: EntityCategory;
  editorialClass: EditorialClass;
  rationale: string;
  aliases?: string[];
}

const manualEntities: ClassifiedEntity[] = [
  ...gameContent.parties.map((party) => ({
    name: party.displayName,
    aliases: [party.shortName, ...party.aliases],
    category: "parti réel" as const,
    editorialClass: "réel à actualiser ou sourcer" as const,
    rationale: "Organisation explicitement marquée réelle dans les données de parti.",
  })),
  {
    name: "Union des droites pour la République",
    aliases: ["UDR"],
    category: "parti réel",
    editorialClass: "réel à actualiser ou sourcer",
    rationale: "Organisation politique réelle citée dans l’instantané documentaire, non jouable.",
  },
  ...gameContent.actors.map((actor) => ({
    name: actor.displayName,
    category: "personnalité fictive" as const,
    editorialClass:
      actor.role === "context" ? ("fiction nécessaire" as const) : ("fiction acceptable" as const),
    rationale:
      actor.role === "context"
        ? "Personnage secondaire fictif prévu pour porter les scénarios sensibles sans viser une personne réelle."
        : "Candidat ou cadre fictif rattaché à un parti réel.",
  })),
  ...["Observatoire Hexagone", "Baromètre Civique", "Institut Agora", "Panel République"].map(
    (name) => ({
      name,
      category: "organisation fictive" as const,
      editorialClass: "fiction paresseuse" as const,
      rationale:
        "Institut de sondage inventé alors qu’un libellé générique ou un cadre réel sourcé suffirait.",
    }),
  ),
  {
    name: "France",
    category: "pays réel",
    editorialClass: "réel utilisable",
    rationale: "Cadre national réel du scrutin.",
  },
  {
    name: "Union européenne",
    aliases: ["Europe", "européenne", "européen"],
    category: "organisation réelle",
    editorialClass: "réel utilisable",
    rationale: "Organisation et espace politique réels, employés sans accusation personnelle.",
  },
  {
    name: "République française",
    aliases: ["République", "Cinquième République", "Ve République"],
    category: "institution réelle",
    editorialClass: "réel utilisable",
    rationale: "Cadre institutionnel réel.",
  },
  {
    name: "Conseil constitutionnel",
    category: "institution réelle",
    editorialClass: "réel à actualiser ou sourcer",
    rationale: "Institution réelle citée par la documentation des données.",
  },
  {
    name: "CNCCFP",
    aliases: ["Commission nationale des comptes de campagne et des financements politiques"],
    category: "institution réelle",
    editorialClass: "réel à actualiser ou sourcer",
    rationale: "Autorité réelle citée par la documentation des données.",
  },
  {
    name: "ministère de l’Intérieur",
    category: "institution réelle",
    editorialClass: "réel à actualiser ou sourcer",
    rationale: "Institution réelle citée comme source électorale.",
  },
  {
    name: "Parlement européen",
    category: "institution réelle",
    editorialClass: "fiction qui réduit fortement l’immersion",
    rationale: "Le texte d’événement qualifie à tort de fictif une institution réelle.",
  },
  {
    name: "Assemblée nationale",
    category: "institution réelle",
    editorialClass: "réel utilisable",
    rationale: "Institution réelle employée comme cadre politique général.",
  },
  {
    name: "Élysée",
    category: "institution réelle",
    editorialClass: "réel utilisable",
    rationale: "Lieu et métonymie institutionnelle réels.",
  },
  {
    name: "Constitution",
    category: "institution réelle",
    editorialClass: "réel utilisable",
    rationale: "Texte institutionnel réel, sans attribution risquée.",
  },
  {
    name: "Paris",
    category: "ville ou région réelle",
    editorialClass: "réel utilisable",
    rationale: "Ville réelle employée comme lieu générique de campagne.",
  },
  {
    name: "Île-de-France",
    category: "ville ou région réelle",
    editorialClass: "réel utilisable",
    rationale: "Région administrative réelle.",
  },
  {
    name: "Outre-mer",
    category: "ville ou région réelle",
    editorialClass: "fiction qui réduit fortement l’immersion",
    rationale: "Agrégat territorial réel mais excessivement homogénéisé dans la carte.",
  },
  ...["Nord", "Est", "Ouest", "Sud-Ouest", "Sud-Est", "Centre"].map((name) => ({
    name,
    category: "entité ambiguë ou non identifiable" as const,
    editorialClass: "fiction qui réduit fortement l’immersion" as const,
    rationale:
      "Zone de carte abstraite qui ne correspond pas aux régions administratives françaises.",
  })),
  {
    name: "États imaginaires",
    category: "pays fictif",
    editorialClass: "fiction qui réduit fortement l’immersion",
    rationale:
      "Formulation géopolitique explicitement fictive, sans ancrage géographique crédible.",
  },
  {
    name: "présidentielle fictive",
    category: "événement inventé",
    editorialClass: "fiction acceptable",
    rationale: "Scrutin futur simulé, nécessaire au jeu.",
  },
];

interface TextSource {
  location: string;
  text: string;
}

const sources: TextSource[] = [];
for (const event of gameContent.events) {
  sources.push({ location: `event:${event.id}:title`, text: event.title });
  sources.push({ location: `event:${event.id}:summary`, text: event.summary });
  for (const choice of event.choices) {
    sources.push({ location: `event:${event.id}:choice:${choice.id}`, text: choice.label });
    for (const outcome of choice.outcomeGroups) {
      sources.push({
        location: `event:${event.id}:outcome:${outcome.id}:title`,
        text: outcome.title,
      });
      sources.push({
        location: `event:${event.id}:outcome:${outcome.id}:narrative`,
        text: outcome.publicNarrative,
      });
    }
  }
}
for (const ending of gameContent.endings) {
  sources.push({ location: `ending:${ending.id}:title`, text: ending.title });
  sources.push({ location: `ending:${ending.id}:narrative`, text: ending.narrative });
}
for (const achievement of gameContent.achievements) {
  sources.push({ location: `achievement:${achievement.id}:title`, text: achievement.title });
  sources.push({
    location: `achievement:${achievement.id}:description`,
    text: achievement.description,
  });
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’']/gu, " ")
    .toLocaleLowerCase("fr-FR")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function mentionsFor(entity: ClassifiedEntity) {
  const needles = [entity.name, ...(entity.aliases ?? [])]
    .map(normalize)
    .filter((value) => value.length >= 3);
  const locations = sources
    .filter(({ text }) => {
      const normalized = ` ${normalize(text)} `;
      return needles.some((needle) => normalized.includes(` ${needle} `));
    })
    .map(({ location }) => location);
  return { count: locations.length, locations: locations.slice(0, 25) };
}

const classified = manualEntities.map((entity) => ({ ...entity, mentions: mentionsFor(entity) }));
const allCategories: EntityCategory[] = [
  "parti réel",
  "parti fictif",
  "personnalité politique réelle",
  "personnalité fictive",
  "média réel",
  "média fictif",
  "émission réelle",
  "émission fictive",
  "institution réelle",
  "institution fictive",
  "pays réel",
  "pays fictif",
  "ville ou région réelle",
  "lieu fictif",
  "organisation réelle",
  "organisation fictive",
  "événement historique réel",
  "événement inventé",
  "entité ambiguë ou non identifiable",
];
const categoryCounts = Object.fromEntries(
  allCategories.map((category) => [
    category,
    classified.filter((entity) => entity.category === category).length,
  ]),
);
const editorialCounts = Object.fromEntries(
  [...new Set(classified.map((entity) => entity.editorialClass))].map((editorialClass) => [
    editorialClass,
    classified.filter((entity) => entity.editorialClass === editorialClass).length,
  ]),
);

const properNounPattern =
  /\b(?:[A-ZÀ-ÖØ-Þ][\p{L}’'-]+(?:\s+(?:de|du|des|la|le|les|pour|en|et|à|aux)\s+)?){1,5}[A-ZÀ-ÖØ-Þ][\p{L}’'-]+\b/gu;
const candidateFrequency = new Map<string, { count: number; locations: string[] }>();
for (const source of sources) {
  for (const match of source.text.matchAll(properNounPattern)) {
    const candidate = match[0].trim();
    const entry = candidateFrequency.get(candidate) ?? { count: 0, locations: [] };
    entry.count += 1;
    if (entry.locations.length < 10) entry.locations.push(source.location);
    candidateFrequency.set(candidate, entry);
  }
}

const classifiedNeedles = new Set(
  classified.flatMap((entity) => [entity.name, ...(entity.aliases ?? [])].map(normalize)),
);
const unclassifiedCandidates = [...candidateFrequency.entries()]
  .filter(([candidate]) => {
    const normalized = normalize(candidate);
    return ![...classifiedNeedles].some(
      (needle) => normalized.includes(needle) || needle.includes(normalized),
    );
  })
  .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
  .map(([name, evidence]) => ({ name, ...evidence }));

const realEntityCount = classified.filter((entity) =>
  [
    "parti réel",
    "personnalité politique réelle",
    "média réel",
    "émission réelle",
    "institution réelle",
    "pays réel",
    "ville ou région réelle",
    "organisation réelle",
    "événement historique réel",
  ].includes(entity.category),
).length;
const fictionalEntityCount = classified.filter((entity) =>
  [
    "parti fictif",
    "personnalité fictive",
    "média fictif",
    "émission fictive",
    "institution fictive",
    "pays fictif",
    "lieu fictif",
    "organisation fictive",
    "événement inventé",
  ].includes(entity.category),
).length;
const ambiguousEntityCount = classified.length - realEntityCount - fictionalEntityCount;

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    scope:
      "Tous les textes structurés d’événements, fins et succès, plus les données de partis et acteurs.",
    classification:
      "Liste contrôlée manuellement, enrichie par un détecteur lexical de noms propres pour rendre visibles les candidats non classés.",
    limitation:
      "La détection lexicale française produit des faux positifs en début de phrase ; les candidats non classés ne sont pas comptés dans les proportions éditoriales.",
  },
  totals: {
    classifiedEntities: classified.length,
    totalMentionsInNarrativeCorpus: classified.reduce(
      (sum, entity) => sum + entity.mentions.count,
      0,
    ),
    categoryCounts,
    editorialCounts,
    realVsFictional: {
      real: realEntityCount,
      fictional: fictionalEntityCount,
      ambiguous: ambiguousEntityCount,
      realPercent: Number(((realEntityCount / classified.length) * 100).toFixed(1)),
      fictionalPercent: Number(((fictionalEntityCount / classified.length) * 100).toFixed(1)),
      ambiguousPercent: Number(((ambiguousEntityCount / classified.length) * 100).toFixed(1)),
    },
    unclassifiedLexicalCandidates: unclassifiedCandidates.length,
  },
  entities: classified,
  genericWorldSignals: [
    "fictif",
    "fictive",
    "fictifs",
    "personnalité fictive",
    "cadre fictif",
    "média fictif",
    "chaîne fictive",
    "émission fictive",
    "institut fictif",
    "pays imaginaire",
    "états imaginaires",
    "parlement européen fictif",
    "chaîne",
    "émission",
    "radio",
    "journal",
    "rédaction",
    "plateau",
    "média",
  ].map((signal) => {
    const needle = normalize(signal);
    const locations = sources
      .filter(({ text }) => ` ${normalize(text)} `.includes(` ${needle} `))
      .map(({ location }) => location);
    return { signal, count: locations.length, locations: locations.slice(0, 30) };
  }),
  unclassifiedCandidates,
};

await mkdir("audit", { recursive: true });
await writeFile("audit/entity-inventory.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.totals, null, 2));
