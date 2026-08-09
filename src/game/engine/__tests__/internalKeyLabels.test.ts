import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { testContent } from "@/game/fixtures/testContent";
import type { GameEffect } from "@/game/types";

import { applyEffects } from "../effectProcessor";
import { createGame } from "../game";
import { humanizeInternalKey } from "../internalKeyLabels";

/**
 * Fun-improvement mission, Phase I — technical label leaks (P3 of
 * PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md, section 12 and its
 * UI test requirements from section 21: "aucune clé technique brute
 * affichée", "labels français", "pas de camelCase visible").
 */

// A conservative detector for "this still looks like an internal key":
// a lowercase letter immediately followed by an uppercase letter (the
// camelCase signature), which no hand-written French label in this
// project ever produces.
const CAMEL_CASE_LEAK = /[a-z][A-Z]/;

function baseState() {
  return createGame(
    { seed: "labels", mode: "existing_party", partyId: "alpha", methodId: "field" },
    testContent,
  );
}

describe("humanizeInternalKey", () => {
  it("ne renvoie jamais une clé camelCase brute, même pour une clé non cartographiée", () => {
    const unmapped = ["someBrandNewInternalStat", "another_snake_case_flag", "simple"];
    for (const key of unmapped) {
      expect(humanizeInternalKey(key)).not.toMatch(CAMEL_CASE_LEAK);
    }
  });

  it("gère une chaîne vide sans planter", () => {
    expect(() => humanizeInternalKey("")).not.toThrow();
  });
});

describe("libellés par défaut des effets (defaultLabel via applyEffects)", () => {
  const casesWithoutLabel: Array<{ name: string; effect: GameEffect }> = [
    { name: "party_stat primaire", effect: { kind: "party_stat", stat: "polling", delta: 3 } },
    {
      name: "party_stat secondaire",
      effect: { kind: "party_stat", stat: "mediaPresence", delta: 4 },
    },
    { name: "trait", effect: { kind: "trait", trait: "mediaSkill", delta: 2 } },
    { name: "ideology", effect: { kind: "ideology", axis: "immigration", delta: -3 } },
    { name: "world", effect: { kind: "world", stat: "climateConcern", delta: 5 } },
  ];

  it.each(casesWithoutLabel)(
    "$name sans label explicite produit un libellé sans camelCase",
    ({ effect }) => {
      const { visibleEffects } = applyEffects(baseState(), [effect]);
      expect(visibleEffects).toHaveLength(1);
      expect(visibleEffects[0]!.label).not.toMatch(CAMEL_CASE_LEAK);
      // The exact bug reported live during the fun audit playtest:
      expect(visibleEffects[0]!.label).not.toContain("climateConcern");
    },
  );

  it("reproduit noir sur blanc l'exemple exact du bug rapporté (Contexte climateConcern modifié)", () => {
    const { visibleEffects } = applyEffects(baseState(), [
      { kind: "world", stat: "climateConcern", delta: 4 },
    ]);
    expect(visibleEffects[0]!.label).toBe("Le contexte évolue : l’inquiétude climatique");
  });
});

describe("audit du catalogue de production : aucun effet visible sans label n'expose de clé brute", () => {
  it("tous les effets sans label explicite du catalogue réel produisent un libellé humain", () => {
    const offenders: string[] = [];
    for (const event of gameContent.events) {
      for (const choice of event.choices) {
        for (const outcome of choice.outcomeGroups) {
          for (const effect of outcome.effects) {
            if (effect.visibility === "hidden") continue;
            if ("label" in effect && effect.label) continue;
            const { visibleEffects } = applyEffects(baseState(), [effect]);
            const label = visibleEffects[0]?.label ?? "";
            if (CAMEL_CASE_LEAK.test(label)) {
              offenders.push(`${event.id}/${choice.id}/${outcome.id}: "${label}"`);
            }
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
