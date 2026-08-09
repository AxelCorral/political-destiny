/**
 * Synthetic player panel for the fun/replayability audit
 * (PROMPT_CLAUDE_CODE_AUDIT_FUN_REJOUABILITE.md, section 24).
 *
 * The prompt asks for seven named archetypes (stratège, roleplayer,
 * opportuniste, chaos player, prudent, joueur narratif, débutant). Six of
 * them map cleanly onto agents already defined and cross-referenced in
 * `scripts/audit-post/lib/agents.ts` (the "realistic policy" agent set used
 * by every audit since AUDIT_POST_CORRECTIONS.md — see that file's header
 * comment for why the OTHER agent set, `scripts/audit/simulation-audit.ts`,
 * is deliberately not used here: it includes synthetic full-information
 * optimizers with no plausible human equivalent).
 *
 * Mapping (documented, not silently assumed):
 *   - Le stratège            -> "parti_dabord"             (builds durable
 *     strength — cohesion/members/mobilization, including delayed effects —
 *     a long-horizon "build to win" mentality)
 *   - Le roleplayer           -> "ideologiquement_coherent" (exact match)
 *   - L'opportuniste          -> "opportuniste_electoral"   (exact match —
 *     maximizes immediate polling/popularity only, abandons everything else)
 *   - Le chaos player         -> "contrarien"               (deliberately
 *     picks the option the coherence model ranks WORST — the closest
 *     available proxy for "most provocative option")
 *   - Le prudent              -> "prudent"                  (exact match)
 *   - Le joueur narratif      -> "mediatique"               (maximizes
 *     awareness/media presence, bonus for OFFENSIF/CLIVANT/POPULAIRE tags
 *     and symbolic-action strategies — the closest proxy for "seeks the
 *     option most likely to produce a story")
 *   - Le débutant             -> "debutant" (NEW, defined below): a
 *     genuinely different decision rule from every agent in agents.ts,
 *     because none of them model "reads only the label and the visible tag,
 *     has no idea what the hidden stats do". It ranks options by a small
 *     valence heuristic over the visible tag alone (reassuring-sounding tags
 *     preferred, confrontational-sounding tags avoided), with a seeded
 *     random tie-break — it never touches outcomeProbabilities() or any
 *     effect data, unlike every other agent in this project's audits.
 *
 * Two additional agents from the same realistic set are kept in the main
 * grid as reference/baseline columns, not as one of the seven requested
 * archetypes: "aleatoire" (neutral empirical baseline, exactly as used by
 * AUDIT_POST_CORRECTIONS.md/POST_AUDIT_FIXES.md for "sur-performance vs
 * baseline neutre") and "risque" (a second risk-seeking reference point,
 * distinct from the chaos player because it optimizes FOR expected upside
 * under the coherence-adjacent utility model rather than deliberately
 * picking the worst-ranked option).
 */
import { hashSeed } from "../../../src/game/engine/index";
import type { EventChoice, GameEventDefinition, GameState } from "../../../src/game/types/index";
import { type AgentName, pickChoice } from "../../audit-post/lib/agents";

export const PROFILE_NAMES = [
  "strategist",
  "roleplayer",
  "opportunist",
  "chaos",
  "cautious",
  "narrative",
  "beginner",
  "neutral_baseline",
  "risk_seeking_ref",
] as const;

export type ProfileName = (typeof PROFILE_NAMES)[number];

export const PROFILE_LABELS: Record<ProfileName, string> = {
  strategist: "Le stratège",
  roleplayer: "Le roleplayer",
  opportunist: "L'opportuniste",
  chaos: "Le chaos player",
  cautious: "Le prudent",
  narrative: "Le joueur narratif",
  beginner: "Le débutant",
  neutral_baseline: "Référence neutre (aléatoire)",
  risk_seeking_ref: "Référence risque (risqué)",
};

/** Requested archetypes only (section 24) — excludes the two reference columns. */
export const REQUESTED_ARCHETYPES: ProfileName[] = [
  "strategist",
  "roleplayer",
  "opportunist",
  "chaos",
  "cautious",
  "narrative",
  "beginner",
];

const PROFILE_TO_AGENT: Record<Exclude<ProfileName, "beginner">, AgentName> = {
  strategist: "parti_dabord",
  roleplayer: "ideologiquement_coherent",
  opportunist: "opportuniste_electoral",
  chaos: "contrarien",
  cautious: "prudent",
  narrative: "mediatique",
  neutral_baseline: "aleatoire",
  risk_seeking_ref: "risque",
};

const BEGINNER_POSITIVE_TAGS = new Set([
  "RASSEMBLEUR",
  "POPULAIRE",
  "PRÉSIDENTIEL",
  "TRANSPARENT",
  "LOYAL",
  "INSTITUTIONNEL",
]);
const BEGINNER_NEGATIVE_TAGS = new Set(["RISQUÉ", "CLIVANT", "OPPORTUNISTE", "OFFENSIF"]);

function seededIndex(seed: string, salt: string, length: number): number {
  if (length <= 0) return 0;
  return hashSeed(`${seed}:${salt}`) % length;
}

/**
 * "Débutant" decision rule: looks only at the visible tag on each option
 * (exactly what a first-time player sees on the choice card, per the game's
 * own UI — no hidden-stat reasoning). Ties are broken by a seeded pseudo-
 * random draw, not by any utility computation.
 */
function pickBeginnerChoice(
  state: GameState,
  event: GameEventDefinition,
  seed: string,
): EventChoice {
  const choices = event.choices;
  if (choices.length === 1) return choices[0]!;
  const scored = choices.map((choice, index) => {
    const tag = choice.visibleTag ?? "";
    let score = 0;
    if (BEGINNER_POSITIVE_TAGS.has(tag)) score += 2;
    if (BEGINNER_NEGATIVE_TAGS.has(tag)) score -= 1;
    // Small seeded jitter so ties don't always resolve to option A (a
    // beginner does not mechanically always pick the first-listed option).
    const jitter =
      seededIndex(seed, `${state.decisionIndex}:${event.id}:beginner:${index}`, 100) / 100;
    return { choice, score: score + jitter * 0.3 };
  });
  scored.sort((a, b) => b.score - a.score || a.choice.id.localeCompare(b.choice.id));
  return scored[0]!.choice;
}

export function pickForProfile(
  state: GameState,
  event: GameEventDefinition,
  profile: ProfileName,
  seed: string,
): EventChoice {
  if (profile === "beginner") return pickBeginnerChoice(state, event, seed);
  return pickChoice(state, event, PROFILE_TO_AGENT[profile], seed);
}

export function agentBehindProfile(profile: ProfileName): AgentName | "debutant_heuristic" {
  return profile === "beginner" ? "debutant_heuristic" : PROFILE_TO_AGENT[profile];
}
