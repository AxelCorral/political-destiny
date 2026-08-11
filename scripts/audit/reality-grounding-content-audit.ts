/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §25 — audite
 * le corpus narratif existant pour les mentions répétées de « fictif » dans le
 * texte visible au joueur (titre, résumé, libellé de choix, narratif public,
 * indice public). Ne scanne que les champs réellement affichés au joueur — pas
 * les commentaires de code ni les identifiants internes.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/reality-grounding");

const FICTIF_PATTERN = /fictif|fictive|fictionnel|fictionnelle/iu;

interface Row {
  location: string;
  eventId: string;
  field: string;
  excerpt: string;
  classification: "à reformuler" | "OK";
}

const rows: Row[] = [];

function scanText(eventId: string, location: string, field: string, text: string | undefined) {
  if (!text) return;
  if (FICTIF_PATTERN.test(text)) {
    const excerpt = text.length > 160 ? `${text.slice(0, 160)}…` : text;
    rows.push({ location, eventId, field, excerpt, classification: "à reformuler" });
  }
}

for (const event of gameContent.events) {
  scanText(event.id, "event", "title", event.title);
  scanText(event.id, "event", "summary", event.summary);
  for (const choice of event.choices) {
    scanText(event.id, "choice", `${choice.id}.label`, choice.label);
    scanText(event.id, "choice", `${choice.id}.immediatePublicHint`, choice.immediatePublicHint);
    for (const outcome of choice.outcomeGroups) {
      scanText(event.id, "outcome", `${choice.id}.${outcome.id}.title`, outcome.title);
      scanText(
        event.id,
        "outcome",
        `${choice.id}.${outcome.id}.publicNarrative`,
        outcome.publicNarrative,
      );
    }
  }
}

for (const achievement of gameContent.achievements) {
  scanText(achievement.id, "achievement", "title", achievement.title);
  scanText(achievement.id, "achievement", "description", achievement.description);
}

for (const ending of gameContent.endings) {
  scanText(ending.id, "ending", "title", ending.title);
  scanText(ending.id, "ending", "narrative", ending.narrative);
}

await mkdir(OUT_DIR, { recursive: true });
const header = ["location", "eventId", "field", "excerpt", "classification"];
const csv = [
  header.join(","),
  ...rows.map((row) =>
    header
      .map((key) => `"${String((row as unknown as Record<string, unknown>)[key] ?? "").replace(/"/g, '""')}"`)
      .join(","),
  ),
].join("\n");
await writeFile(resolve(OUT_DIR, "content-consistency.csv"), `${csv}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      totalEvents: gameContent.events.length,
      totalAchievements: gameContent.achievements.length,
      totalEndings: gameContent.endings.length,
      fictifMentionsPlayerVisible: rows.length,
      byField: Object.fromEntries(
        [...new Set(rows.map((r) => r.field.split(".").pop()))].map((field) => [
          field,
          rows.filter((r) => r.field.endsWith(field!)).length,
        ]),
      ),
    },
    null,
    2,
  ),
);
