import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data";

const ROOT = resolve(import.meta.dirname, "../..");
const contentReport = JSON.parse(
  await readFile(resolve(ROOT, "audit/content-report.json"), "utf8"),
) as {
  repetition: {
    topBigrams: Array<{ expression: string; count: number; documents: number }>;
    topTrigrams: Array<{ expression: string; count: number; documents: number }>;
    topFourgrams: Array<{ expression: string; count: number; documents: number }>;
  };
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’']/gu, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLocaleLowerCase("fr")
    .replace(/\s+/gu, " ")
    .trim();
}

function words(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

const fields: Array<{ location: string; value: string }> = [];
for (const event of gameContent.events) {
  fields.push(
    { location: `event:${event.id}:title`, value: event.title },
    { location: `event:${event.id}:summary`, value: event.summary },
  );
  for (const choice of event.choices) {
    fields.push({ location: `event:${event.id}:choice:${choice.id}`, value: choice.label });
    for (const outcome of choice.outcomeGroups) {
      fields.push(
        { location: `event:${event.id}:outcome:${outcome.id}:title`, value: outcome.title },
        {
          location: `event:${event.id}:outcome:${outcome.id}:narrative`,
          value: outcome.publicNarrative,
        },
      );
    }
  }
}
const corpus = normalize(fields.map((field) => field.value).join("\n"));

const phrases = [
  "jouer la carte de",
  "rassembler",
  "rassembleur",
  "prendre la parole",
  "contre-attaquer",
  "faire profil bas",
  "afficher sa fermeté",
  "créer la surprise",
  "votre équipe",
  "les réseaux s’enflamment",
  "la séquence",
  "le récit s’impose",
  "angle d’attaque inattendu",
  "adversaires fictifs",
  "équipe fictive",
  "le pari",
  "la prudence",
] as const;

const phraseFrequencies = phrases.map((phrase) => {
  const normalized = normalize(phrase);
  const pattern = new RegExp(
    `(?<!\\p{L})${normalized.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}(?!\\p{L})`,
    "gu",
  );
  const locations = fields
    .filter((field) => normalize(field.value).includes(normalized))
    .map((field) => field.location);
  return { phrase, count: [...corpus.matchAll(pattern)].length, locations: locations.slice(0, 30) };
});

const supplement =
  "Cette décision met à l’épreuve votre méthode, votre cohérence et la capacité de l’équipe fictive à rester unie.";
const summariesUsingPadding = gameContent.events
  .filter((event) => event.summary.includes(supplement))
  .map((event) => event.id);
const summaryLengths = gameContent.events.map((event) => words(event.summary));
const choiceLengths = gameContent.events.flatMap((event) =>
  event.choices.map((choice) => words(choice.label)),
);
const narrativeLengths = gameContent.events.flatMap((event) =>
  event.choices.flatMap((choice) =>
    choice.outcomeGroups.map((outcome) => words(outcome.publicNarrative)),
  ),
);

const lexicon = [
  ...contentReport.repetition.topBigrams.slice(0, 20).map((row) => ({ ...row, size: 2 })),
  ...contentReport.repetition.topTrigrams.slice(0, 15).map((row) => ({ ...row, size: 3 })),
  ...contentReport.repetition.topFourgrams.slice(0, 15).map((row) => ({ ...row, size: 4 })),
].sort((left, right) => right.count - left.count || right.size - left.size);

const normalizedTokens = corpus.split(" ");
const tokenCount = (token: string) => normalizedTokens.filter((value) => value === token).length;
const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    scope: "All production event titles, summaries, choice labels, outcome titles and narratives.",
    normalization: "Unicode NFD, lower case, punctuation collapsed; no semantic model used.",
    command: "npx tsx scripts/audit/narrative-audit.ts",
  },
  fieldCounts: {
    analyzedTextFields: fields.length,
    eventSummaries: gameContent.events.length,
    choiceLabels: choiceLengths.length,
    outcomeNarratives: narrativeLengths.length,
  },
  lengthsInWords: {
    summaries: {
      minimum: Math.min(...summaryLengths),
      average: average(summaryLengths),
      maximum: Math.max(...summaryLengths),
    },
    choices: {
      minimum: Math.min(...choiceLengths),
      average: average(choiceLengths),
      maximum: Math.max(...choiceLengths),
    },
    outcomes: {
      minimum: Math.min(...narrativeLengths),
      average: average(narrativeLengths),
      maximum: Math.max(...narrativeLengths),
    },
  },
  summaryPadding: {
    exactSupplement: supplement,
    eventCount: summariesUsingPadding.length,
    eventIds: summariesUsingPadding,
  },
  phraseFrequencies,
  narrativePerson: {
    tutoiementTokens: tokenCount("tu") + tokenCount("ton") + tokenCount("ta") + tokenCount("tes"),
    secondPersonPluralTokens: tokenCount("vous") + tokenCount("votre") + tokenCount("vos"),
  },
  fictionQualifierTokens: {
    fictif: tokenCount("fictif"),
    fictive: tokenCount("fictive"),
    fictifs: tokenCount("fictifs"),
    fictives: tokenCount("fictives"),
    total:
      tokenCount("fictif") + tokenCount("fictive") + tokenCount("fictifs") + tokenCount("fictives"),
  },
  top50RepeatedExpressions: lexicon.slice(0, 50),
};

await mkdir(resolve(ROOT, "audit"), { recursive: true });
await writeFile(
  resolve(ROOT, "audit/narrative-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
