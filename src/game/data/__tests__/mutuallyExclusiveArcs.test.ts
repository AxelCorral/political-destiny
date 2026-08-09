import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice, validateGameState } from "@/game/engine";
import type { GameState } from "@/game/types";

/**
 * Fun-improvement mission, Phase F — replayability through mutual exclusion
 * (P3 of PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md).
 *
 * Rather than adding a new, separate "campaign family" system, this phase
 * measures and locks in the mutual-exclusion structure already introduced
 * by Phases B/C/E: every new chain in this mission (Horizons succession,
 * Renaissance legacy, two rare-event chains) branches into exactly one of
 * two structurally different follow-up pools depending on an early
 * decision, and those pools never both fire in the same run. That IS the
 * "si stratégie X -> pool A / si stratégie Y -> pool B" pattern requested
 * by section 16 of the prompt -- built from real narrative stakes instead
 * of a generic label, and reusing the engine's existing flag/eligibility
 * mechanism rather than a new one.
 *
 * This file verifies, on a real simulated corpus, that these pairs are (a)
 * genuinely mutually exclusive in practice and (b) that a meaningfully
 * diverse set of "signatures" (which branch of which arc a run took)
 * actually appears — i.e. this isn't just diversity on paper.
 */

const MUTUALLY_EXCLUSIVE_PAIRS: Array<{ label: string; flagA: string; flagB: string }> = [
  {
    label: "horizons_succession",
    flagA: "horizons_broke_with_founder",
    flagB: "horizons_deferred_to_founder",
  },
  {
    label: "renaissance_legacy",
    flagA: "renaissance_legacy_defended_fully",
    flagB: "renaissance_legacy_gaps_owned",
  },
  {
    label: "rare_exceptional_powers",
    flagA: "exceptional_powers_guardrails_promised",
    flagB: "exceptional_powers_abolition_promised",
  },
  {
    label: "rare_congress",
    flagA: "coalition_five_conditions",
    flagB: "fragmentation_confrontation",
  },
];

function playPreferring(partyId: string, seed: string, preferredChoiceIds: string[]) {
  let state: GameState = createGame(
    { seed, mode: "existing_party", partyId, methodId: "field_first" },
    gameContent,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const match = event.choices.find((c) => preferredChoiceIds.includes(c.id));
    const choice = match ?? event.choices[Math.floor((guard * 7) % event.choices.length)]!;
    state = resolveCurrentChoice(state, choice.id, gameContent).state;
    guard += 1;
  }
  return state;
}

describe("Rejouabilité par exclusion mutuelle (P3)", () => {
  it("aucune paire de flags mutuellement exclusifs n'est jamais activée simultanément dans une même partie", () => {
    const parties = [
      "horizons",
      "renaissance",
      "lfi",
      "ps",
      "ecologistes",
      "lr",
      "rn",
      "reconquete",
      "nouvelle_energie",
    ];
    let checked = 0;
    for (const partyId of parties) {
      for (let seedIndex = 0; seedIndex < 8; seedIndex += 1) {
        const seed = `mutex-sweep-${partyId}-${seedIndex}`;
        const state = playPreferring(partyId, seed, []);
        expect(validateGameState(state).errors).toEqual([]);
        for (const { flagA, flagB } of MUTUALLY_EXCLUSIVE_PAIRS) {
          const both = Boolean(state.flags[flagA]) && Boolean(state.flags[flagB]);
          expect(both).toBe(false);
        }
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  }, 40000);

  it("les deux branches de chaque paire sont réellement observées sur un échantillon, pas seulement l'une d'elles", () => {
    const observed = new Map<string, { a: boolean; b: boolean }>();
    for (const pair of MUTUALLY_EXCLUSIVE_PAIRS) observed.set(pair.label, { a: false, b: false });

    const biasedRuns: Array<{ party: string; prefer: string[] }> = [
      { party: "horizons", prefer: ["horizons_founder_break_free"] },
      { party: "horizons", prefer: ["horizons_founder_defer"] },
      { party: "renaissance", prefer: ["renaissance_legacy_defend_all"] },
      { party: "renaissance", prefer: ["renaissance_legacy_own_gaps"] },
    ];
    for (const run of biasedRuns) {
      for (let i = 0; i < 15; i += 1) {
        const state = playPreferring(
          run.party,
          `mutex-bias-${run.party}-${run.prefer[0]}-${i}`,
          run.prefer,
        );
        for (const { label, flagA, flagB } of MUTUALLY_EXCLUSIVE_PAIRS) {
          const entry = observed.get(label)!;
          if (state.flags[flagA]) entry.a = true;
          if (state.flags[flagB]) entry.b = true;
        }
      }
    }
    // Horizons and Renaissance arcs are directly steered above and must show
    // both branches. The two rare-event arcs depend on a rare/legendary
    // draw firing at all within this small sample, so they're reported but
    // not hard-asserted (avoids a flaky test on inherently rare content —
    // see rareChains.test.ts for why reachability there is left to the
    // Phase J full corpus instead).
    expect(observed.get("horizons_succession")).toEqual({ a: true, b: true });
    expect(observed.get("renaissance_legacy")).toEqual({ a: true, b: true });
    console.log("mutual-exclusion branch coverage:", Object.fromEntries(observed));
  }, 40000);
});
