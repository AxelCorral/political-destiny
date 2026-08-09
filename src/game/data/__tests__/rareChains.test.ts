import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice, validateGameState } from "@/game/engine";
import type { GameState } from "@/game/types";

/**
 * Fun-improvement mission, Phase C — rare event chains (P2 of
 * PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md).
 *
 * AUDIT_FUN_REJOUABILITE.md §9 found that none of the 9 generic `rare_*`
 * events opened a narrative chain. Four of them now do:
 * rare_debate_blackout, rare_exceptional_powers (two possible follow-ups),
 * rare_fragmented_congress (two possible follow-ups), rare_national_union.
 *
 * Structural checks here are exhaustive and fast. Empirical reachability
 * in simulation (these rare/legendary events are inherently infrequent —
 * rare_national_union alone occurred in ~2.5% of games in the fun-audit
 * baseline) is verified by the full audit:fun re-run in Phase J, not
 * re-proven here with a slow/flaky large sample — this file only confirms
 * that WHEN a chain fires, it behaves correctly (right predecessor, right
 * flag gate, no invalid state, no accidental frequency inflation of the
 * rare-rarity events themselves).
 */

const CHAINED_RARES: Array<{
  trigger: string;
  followUps: Array<{ id: string; flag: string }>;
}> = [
  {
    trigger: "rare_debate_blackout",
    followUps: [{ id: "rare_blackout_leak_resurfaces", flag: "blackout_rehearsal_leaked" }],
  },
  {
    trigger: "rare_exceptional_powers",
    followUps: [
      { id: "rare_powers_guardrails_tested", flag: "exceptional_powers_guardrails_promised" },
      { id: "rare_powers_abolition_tested", flag: "exceptional_powers_abolition_promised" },
    ],
  },
  {
    trigger: "rare_fragmented_congress",
    followUps: [
      { id: "rare_congress_partners_respond", flag: "coalition_five_conditions" },
      { id: "rare_congress_isolation", flag: "fragmentation_confrontation" },
    ],
  },
  {
    trigger: "rare_national_union",
    followUps: [{ id: "rare_national_union_expires", flag: "national_union_limited" }],
  },
];

describe("Événements rares — chaînes (P2)", () => {
  it("chaque déclencheur et ses follow-ups ont la structure de chaîne attendue", () => {
    for (const { trigger, followUps } of CHAINED_RARES) {
      const triggerEvent = gameContent.events.find((e) => e.id === trigger);
      expect(triggerEvent?.chain).toBeDefined();
      expect(["rare", "legendary", "secret"]).toContain(triggerEvent?.rarity);
      for (const followUp of followUps) {
        const followUpEvent = gameContent.events.find((e) => e.id === followUp.id);
        expect(followUpEvent, `${followUp.id} doit exister`).toBeDefined();
        expect(followUpEvent?.chain?.followsEventIds).toContain(trigger);
        expect(followUpEvent?.eligibility).toContainEqual({
          kind: "flag",
          key: followUp.flag,
          equals: true,
        });
        // The follow-up itself is NOT rare-rarity: it can only ever appear
        // via the followUps queue (gated by the flag above), never by the
        // normal weighted draw of rare-rarity content — so it does not
        // inflate the game's rare-event frequency.
        expect(followUpEvent?.rarity).toBe("uncommon");
      }
    }
  });

  it("au moins un follow-up déclencheur peut s'éteindre (probabilité < 1)", () => {
    const allFollowUps = gameContent.events.flatMap((e) =>
      e.choices.flatMap((c) => c.outcomeGroups.flatMap((o) => o.followUps ?? [])),
    );
    const rareChainFollowUpIds = new Set(
      CHAINED_RARES.flatMap((c) => c.followUps.map((f) => f.id)),
    );
    const relevant = allFollowUps.filter((f) => rareChainFollowUpIds.has(f.eventId));
    expect(relevant.length).toBeGreaterThan(0);
    expect(relevant.every((f) => f.probability < 1)).toBe(true);
  });

  it("simulation bornée : aucun état invalide, aucune double branche contradictoire, quand une chaîne se déclenche", () => {
    const partyIds = gameContent.parties.filter((p) => p.isRealOrganization).map((p) => p.id);
    let anyChainObserved = false;
    for (const partyId of partyIds) {
      for (let seedIndex = 0; seedIndex < 10; seedIndex += 1) {
        const seed = `rare-chain-sweep-${partyId}-${seedIndex}`;
        const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
        let state: GameState = createGame(
          { seed, mode: "existing_party", partyId, methodId: method.id },
          gameContent,
        );
        let guard = 0;
        while (state.phase !== "finished" && guard < 60) {
          const event = currentEvent(state, gameContent.events);
          // Deterministic but varied policy: always take the first choice —
          // sufficient to exercise the chain plumbing without biasing which
          // branch fires (the RNG-driven event *draw*, not the choice, is
          // what determines whether a rare event appears at all).
          const choice = event.choices[0]!;
          state = resolveCurrentChoice(state, choice.id, gameContent).state;
          guard += 1;
        }
        expect(validateGameState(state).errors).toEqual([]);
        const ids = new Set(state.decisionHistory.map((d) => d.eventId));
        for (const { followUps } of CHAINED_RARES) {
          if (followUps.length < 2) continue;
          const seenCount = followUps.filter((f) => ids.has(f.id)).length;
          expect(seenCount).toBeLessThanOrEqual(1);
          if (seenCount === 1) anyChainObserved = true;
        }
        for (const { trigger, followUps } of CHAINED_RARES) {
          for (const followUp of followUps) {
            if (ids.has(followUp.id)) {
              anyChainObserved = true;
              expect(ids.has(trigger)).toBe(true);
            }
          }
        }
      }
    }
    // Not hard-asserted true: at 18 seeds x 9 parties x ~1 choice-0 policy,
    // hitting a several-percent-frequency rare event is plausible but not
    // guaranteed — the full audit:fun corpus (Phase J) is the authoritative
    // reachability evidence. Logged here for visibility during this run.
    console.log(`rare chain observed in this bounded sweep: ${anyChainObserved}`);
  }, 45000);
});
