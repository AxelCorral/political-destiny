import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import type { EntityCategory, EntityDefinition } from "../../src/game/types";

const entities = gameContent.entities ?? [];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

const narrativeFields = gameContent.events.flatMap((event) => [
  { location: `event:${event.id}:title`, text: event.title },
  { location: `event:${event.id}:summary`, text: event.summary },
  ...event.choices.flatMap((choice) => [
    { location: `event:${event.id}:choice:${choice.id}`, text: choice.label },
    ...choice.outcomeGroups.flatMap((outcome) => [
      { location: `event:${event.id}:outcome:${outcome.id}:title`, text: outcome.title },
      {
        location: `event:${event.id}:outcome:${outcome.id}:narrative`,
        text: outcome.publicNarrative,
      },
    ]),
  ]),
]);

function mentions(entity: EntityDefinition) {
  const needle = normalize(entity.displayName);
  const lexicalLocations =
    needle.length < 3
      ? []
      : narrativeFields
          .filter(({ text }) => normalize(text).includes(needle))
          .map(({ location }) => location);
  const referenceLocations = gameContent.events
    .filter((event) =>
      event.entityReferences?.some((reference) => reference.entityId === entity.id),
    )
    .map((event) => `event:${event.id}:entityReference`);
  const locations = [...new Set([...lexicalLocations, ...referenceLocations])];
  return { count: locations.length, locations };
}

const byCategory = Object.fromEntries(
  ([...new Set(entities.map((entity) => entity.category))] as EntityCategory[]).map((category) => {
    const categoryEntities = entities.filter((entity) => entity.category === category);
    return [
      category,
      {
        total: categoryEntities.length,
        real: categoryEntities.filter((entity) => entity.reality === "real").length,
        fictional: categoryEntities.filter((entity) => entity.reality === "fictional").length,
      },
    ];
  }),
);

const secondaryCharacters = entities.filter((entity) => entity.category === "fictional_character");
const worldEntities = entities.filter(
  (entity) => entity.category !== "fictional_character" && entity.category !== "public_figure",
);
const realWorldEntities = worldEntities.filter((entity) => entity.reality === "real");
const fictionalWorldEntities = worldEntities.filter((entity) => entity.reality === "fictional");
const realPercent = Number(
  ((realWorldEntities.length / Math.max(worldEntities.length, 1)) * 100).toFixed(1),
);
const fictionalPercentOutsideSecondaryCharacters = Number(
  ((fictionalWorldEntities.length / Math.max(worldEntities.length, 1)) * 100).toFixed(1),
);

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    scope: "Typed V2 entity registry and all production event text/entity references.",
    classification:
      "Reality and category come from the validated registry; lexical mentions supplement explicit entity references.",
    secondaryCharacterPolicy:
      "Fictional characters are reported separately because they carry sensitive fictional narratives and do not replace real institutions, territories, countries, media or organizations.",
  },
  totals: {
    registeredEntities: entities.length,
    real: entities.filter((entity) => entity.reality === "real").length,
    fictional: entities.filter((entity) => entity.reality === "fictional").length,
    secondaryFictionalCharacters: secondaryCharacters.length,
    worldEntities: worldEntities.length,
    realWorldEntities: realWorldEntities.length,
    fictionalWorldEntities: fictionalWorldEntities.length,
    realWorldEntityPercent: realPercent,
    fictionalWorldEntityPercent: fictionalPercentOutsideSecondaryCharacters,
    targetAtLeast70PercentRealWorldEntitiesMet: realPercent >= 70,
    targetBelow25PercentFictionOutsideSecondaryCharactersMet:
      fictionalPercentOutsideSecondaryCharacters < 25,
  },
  byCategory,
  entities: entities.map((entity) => ({ ...entity, mentions: mentions(entity) })),
  fictionalWorldEntities: fictionalWorldEntities.map((entity) => ({
    id: entity.id,
    displayName: entity.displayName,
    category: entity.category,
    rationale: entity.notes ?? entity.allowedUses.join("; "),
  })),
};

await mkdir("audit", { recursive: true });
await writeFile(
  resolve(process.env.AUDIT_ENTITY_OUTPUT ?? "audit/entity-inventory.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(report.totals, null, 2));
