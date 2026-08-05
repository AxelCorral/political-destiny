import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data";

const SELECTED_IDS = [
  "campaign_official_launch",
  "media_economic_morning",
  "media_open_microphone",
  "debate_economy_round",
  "program_pensions",
  "program_immigration",
  "internal_rival_interview",
  "alliance_left_roundtable",
  "scandal_false_resume",
  "world_international_crisis",
  "world_security_attack",
  "party_lfi_fronde",
  "party_ps_identity",
  "party_rn_alliance",
  "runoff_vote_transfers",
  "government_prime_minister",
] as const;

const rows = SELECTED_IDS.map((id) => {
  const event = gameContent.events.find((candidate) => candidate.id === id);
  if (!event) throw new Error(`Événement d’audit introuvable : ${id}`);
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    summary: event.summary,
    choices: event.choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      tag: choice.visibleTag,
      outcomes: choice.outcomeGroups.map((outcome) => ({
        id: outcome.id,
        title: outcome.title,
        narrative: outcome.publicNarrative,
        effects: outcome.effects,
        delayedEffects: outcome.delayedEffects ?? [],
        enqueueEventIds: outcome.enqueueEventIds ?? [],
        endingTrigger: outcome.endingTrigger,
      })),
    })),
  };
});

const root = resolve(import.meta.dirname, "../..");
await mkdir(resolve(root, "audit"), { recursive: true });
await writeFile(
  resolve(root, "audit/rewrite-sources.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      methodology: "Read-only extraction of the exact production definitions used in section 14.",
      selectedIds: SELECTED_IDS,
      events: rows,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Extracted ${rows.length} production events.`);
