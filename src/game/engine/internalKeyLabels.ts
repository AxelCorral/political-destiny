import type { IdeologyAxis, PrimaryStatKey, SecondaryStatKey, TraitKey } from "@/game/types";

/**
 * P3 (fun improvement mission — PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md
 * section 12, "fuites de libellés techniques").
 *
 * AUDIT_FUN_REJOUABILITE.md caught a tag reading "Contexte climateConcern
 * modifié" live in a browser playtest. The leak traced back to
 * `effectProcessor.ts::defaultLabel` — the fallback used whenever a
 * `GameEffect` is authored without an explicit `label` — which
 * interpolated the raw internal key directly into the string. That
 * function had the SAME bug for three other effect kinds (`party_stat`,
 * `trait`, `ideology`), and a second, independent leak existed in
 * `outcomeResolver.ts::modifierLabel` (the "decisive factors" tags shown
 * on the consequence card), which only replaced underscores and left
 * camelCase keys (stat/trait/world/ideology sources) untouched.
 *
 * This file is the single source of truth for translating every internal
 * key these two call sites can encounter, plus `humanizeInternalKey`, a
 * last-resort formatter that NEVER returns a raw camelCase identifier —
 * even for a key nobody has mapped yet — so a missing table entry can
 * only ever degrade to a readable spaced-out phrase, never a leak.
 */

export const PRIMARY_STAT_LABELS: Record<string, string> = {
  polling: "les intentions de vote",
  popularity: "la popularité",
  mobilization: "la mobilisation",
  finances: "les finances",
  credibility: "la crédibilité",
  cohesion: "la cohésion",
} satisfies Record<PrimaryStatKey, string>;

export const SECONDARY_STAT_LABELS: Record<string, string> = {
  members: "les adhérents",
  mediaPresence: "la présence médiatique",
  awareness: "la notoriété",
  rejection: "le rejet",
  momentum: "la dynamique",
  localStrength: "l’implantation locale",
  electedSupport: "le soutien des élus",
} satisfies Record<SecondaryStatKey, string>;

export const TRAIT_LABELS: Record<string, string> = {
  charisma: "le charisme",
  mediaSkill: "l’aisance médiatique",
  competence: "la compétence perçue",
  tactics: "le sens tactique",
  integrity: "l’intégrité perçue",
  endurance: "l’endurance",
  authority: "l’autorité naturelle",
  empathy: "l’empathie perçue",
  discipline: "la discipline",
  coalitionSkill: "le sens de la coalition",
} satisfies Record<TraitKey, string>;

export const WORLD_STAT_LABELS: Record<string, string> = {
  economicClimate: "le climat économique",
  socialTension: "la tension sociale",
  securityConcern: "l’inquiétude sécuritaire",
  climateConcern: "l’inquiétude climatique",
  incumbentFatigue: "la fatigue du pouvoir en place",
  turnoutMood: "le climat de mobilisation civique",
};

export const IDEOLOGY_AXIS_LABELS: Record<string, string> = {
  economy: "économique",
  society: "sociétal",
  europe: "européen",
  ecology: "écologique",
  authority: "de l’autorité",
  immigration: "de l’immigration",
} satisfies Record<IdeologyAxis, string>;

const ALL_KEY_TABLES: Record<string, string>[] = [
  PRIMARY_STAT_LABELS,
  SECONDARY_STAT_LABELS,
  TRAIT_LABELS,
  WORLD_STAT_LABELS,
  IDEOLOGY_AXIS_LABELS,
];

/**
 * Last-resort formatter for any internal key (flag name, party id...) not
 * covered by a dedicated table above: splits camelCase and snake_case into
 * words and lowercases them. Never returns the raw identifier unmodified
 * when it contains no separators and no mapping exists — this is a
 * degraded-but-readable phrase, not a translation, and callers that have a
 * real table entry should always prefer it.
 */
export function humanizeInternalKey(key: string): string {
  for (const table of ALL_KEY_TABLES) {
    if (key in table) return table[key]!;
  }
  const spaced = key
    .replaceAll("_", " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();
  return spaced.length > 0 ? spaced : "un facteur de campagne";
}
