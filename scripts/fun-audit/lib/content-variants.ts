/**
 * Harness-only content transformations for the A/B experiments requested by
 * section 7 and section 26 of PROMPT_CLAUDE_CODE_AUDIT_FUN_REJOUABILITE.md.
 *
 * These functions build a *cloned* `GameContent` with specific data removed
 * (never mutating `gameContent`, never touching a production file) and feed
 * it to the exact same real engine functions used everywhere else in this
 * audit (`createGame` / `currentEvent` / `resolveCurrentChoice`). This is
 * the "harnais temporaire" the prompt explicitly allows ("Ne modifie pas le
 * jeu de production" — the production module is never imported-and-edited,
 * only its data is deep-copied and pruned before being passed as a normal
 * function argument, exactly like `content` is already threaded through by
 * every audit script in this repository).
 *
 * One requested variant — "sans actions adverses autonomes" (section 26,
 * variant D) — is NOT implemented here. `simulateOpponentTurn(state)` is
 * called unconditionally inside `resolveCurrentChoice` (src/game/engine/
 * game.ts:397) with no parameter to disable it and no content-level lever
 * that turns it off; disabling it would require either editing production
 * code (forbidden by the mission) or re-implementing a parallel copy of
 * `resolveCurrentChoice` that skips one internal call (forbidden by section
 * 4: "Ne réimplémente pas approximativement le jeu"). This gap is reported
 * explicitly in AUDIT_FUN_REJOUABILITE.md rather than faked.
 */
import type { EventChoice, GameContent, GameEventDefinition } from "../../../src/game/types/index";

function cloneChoice(
  choice: EventChoice,
  opts: { stripStatement?: boolean; stripDelayed?: boolean; stripActorMemory?: boolean },
): EventChoice {
  const outcomeGroups = choice.outcomeGroups.map((outcome) => {
    let effects = outcome.effects;
    let delayedEffects = outcome.delayedEffects;
    if (opts.stripActorMemory) {
      effects = effects.filter((e) => e.kind !== "actor_memory");
      delayedEffects = delayedEffects?.map((scheduled) => ({
        ...scheduled,
        effects: scheduled.effects.filter((e) => e.kind !== "actor_memory"),
      }));
    }
    if (opts.stripDelayed) delayedEffects = [];
    return { ...outcome, effects, delayedEffects };
  });
  const clone: EventChoice = { ...choice, outcomeGroups };
  if (opts.stripStatement) delete (clone as { statement?: unknown }).statement;
  return clone;
}

function cloneEvent(
  event: GameEventDefinition,
  opts: { stripStatement?: boolean; stripDelayed?: boolean; stripActorMemory?: boolean },
): GameEventDefinition {
  return { ...event, choices: event.choices.map((c) => cloneChoice(c, opts)) };
}

/** Variant B1: the two categories closest to "pure, non-obligatory randomness" removed from the eligible pool. */
export function buildVariantNoOpportunisticRandomness(content: GameContent): GameContent {
  return {
    ...content,
    events: content.events.filter((e) => e.category !== "world" && e.category !== "scandal"),
  };
}

/** Variant B2: rare/legendary/secret events removed entirely. */
export function buildVariantNoRareEvents(content: GameContent): GameContent {
  return {
    ...content,
    events: content.events.filter(
      (e) => e.rarity !== "rare" && e.rarity !== "legendary" && e.rarity !== "secret",
    ),
  };
}

/** Variant C: actor-memory effects stripped from every outcome (no memory can ever be recorded). */
export function buildVariantNoNarrativeMemory(content: GameContent): GameContent {
  return {
    ...content,
    events: content.events.map((e) => cloneEvent(e, { stripActorMemory: true })),
  };
}

/** Variant E: statements stripped from every choice — no ideology movement is ever recorded. */
export function buildVariantNoIdeologyEffects(content: GameContent): GameContent {
  return {
    ...content,
    events: content.events.map((e) => ({
      ...e,
      choices: e.choices.map((c) => cloneChoice(c, { stripStatement: true })),
    })),
  };
}

/** Variant F: all delayed/scheduled effects stripped — every consequence is immediate or absent. */
export function buildVariantNoDelayedConsequences(content: GameContent): GameContent {
  return { ...content, events: content.events.map((e) => cloneEvent(e, { stripDelayed: true })) };
}
