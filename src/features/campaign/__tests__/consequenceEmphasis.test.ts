import { describe, expect, it } from "vitest";

import type { GameEventDefinition } from "@/game/types";

import { resolveConsequenceEmphasis } from "../consequence-emphasis";

function makeEvent(overrides: Partial<GameEventDefinition>): GameEventDefinition {
  return {
    id: "test_event",
    title: "Titre",
    category: "campaign",
    summary: "Résumé",
    phaseWeights: {},
    rarity: "common",
    baseWeight: 1,
    eligibility: [],
    cooldown: 0,
    oncePerRun: false,
    choices: [],
    ...overrides,
  };
}

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase E (§11) — le niveau d'emphase
 * de l'écran de conséquence doit venir uniquement de `importance`/`category`
 * déjà déclarées sur l'événement source.
 */
describe("resolveConsequenceEmphasis", () => {
  it("minor par défaut (aucun événement source connu)", () => {
    expect(resolveConsequenceEmphasis(undefined)).toBe("minor");
  });

  it("minor pour un événement routine ou sans importance déclarée", () => {
    expect(resolveConsequenceEmphasis(makeEvent({}))).toBe("minor");
    expect(resolveConsequenceEmphasis(makeEvent({ importance: "routine" }))).toBe("minor");
  });

  it("significant pour major, notable, ou catégorie rare", () => {
    expect(resolveConsequenceEmphasis(makeEvent({ importance: "major" }))).toBe("significant");
    expect(resolveConsequenceEmphasis(makeEvent({ importance: "notable" }))).toBe("significant");
    expect(resolveConsequenceEmphasis(makeEvent({ category: "rare" }))).toBe("significant");
  });

  it("major pour decisive ou catégorie government", () => {
    expect(resolveConsequenceEmphasis(makeEvent({ importance: "decisive" }))).toBe("major");
    expect(resolveConsequenceEmphasis(makeEvent({ category: "government" }))).toBe("major");
  });

  it("government l'emporte même sans importance decisive déclarée", () => {
    expect(
      resolveConsequenceEmphasis(makeEvent({ category: "government", importance: "major" })),
    ).toBe("major");
  });
});
