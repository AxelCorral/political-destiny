import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "@/game/engine";
import type { GameEventDefinition } from "@/game/types";

import { findChainOrigin, resolveDecisionCardVariant } from "../decision-card-variant";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase C (§8.2/§8.3) — vérifie la
 * règle de priorité de la surcharge visuelle des cartes de décision :
 * government > rare/decisive > chain > major > routine, et la combinaison
 * subtile rare + chain.
 */
function makeEvent(overrides: Partial<GameEventDefinition>): GameEventDefinition {
  return {
    id: "test_event",
    title: "Titre de test",
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

describe("resolveDecisionCardVariant", () => {
  it("routine par défaut", () => {
    expect(resolveDecisionCardVariant(makeEvent({})).variant).toBe("routine");
  });

  it("major pour importance major ou notable", () => {
    expect(resolveDecisionCardVariant(makeEvent({ importance: "major" })).variant).toBe("major");
    expect(resolveDecisionCardVariant(makeEvent({ importance: "notable" })).variant).toBe("major");
  });

  it("decisive pour importance decisive", () => {
    expect(resolveDecisionCardVariant(makeEvent({ importance: "decisive" })).variant).toBe(
      "decisive",
    );
  });

  it("chain pour une suite de chaîne sans rareté ni importance decisive", () => {
    const result = resolveDecisionCardVariant(
      makeEvent({ chain: { id: "arc", step: 2, followsEventIds: ["origin"] } }),
    );
    expect(result.variant).toBe("chain");
    expect(result.isChainFollowUp).toBe(true);
  });

  it("rare l'emporte sur decisive et sur chain (priorité government > rare/decisive > chain > major > routine)", () => {
    const result = resolveDecisionCardVariant(
      makeEvent({
        category: "rare",
        importance: "decisive",
        chain: { id: "arc", step: 2, followsEventIds: ["origin"] },
      }),
    );
    expect(result.variant).toBe("rare");
    expect(result.isChainFollowUp).toBe(true);
  });

  it("government l'emporte sur tout le reste", () => {
    const result = resolveDecisionCardVariant(
      makeEvent({ category: "government", importance: "decisive" }),
    );
    expect(result.variant).toBe("government");
  });

  it("le premier pas d'une chaîne (step 1) n'est pas un follow-up", () => {
    const result = resolveDecisionCardVariant(makeEvent({ chain: { id: "arc", step: 1 } }));
    expect(result.isChainFollowUp).toBe(false);
    expect(result.variant).toBe("routine");
  });
});

describe("findChainOrigin", () => {
  it("retrouve la décision d'origine réelle d'une chaîne de rare events déjà jouée", () => {
    let state = createGame(
      { seed: "chain-origin-test", mode: "existing_party", partyId: "ps", methodId: "digital" },
      gameContent,
    );
    let guard = 0;
    let followUp: GameEventDefinition | undefined;
    while (state.phase !== "finished" && guard < 40 && !followUp) {
      const event = currentEvent(state, gameContent.events);
      if (event.chain && event.chain.step > 1 && event.chain.followsEventIds?.length) {
        followUp = event;
        break;
      }
      state = resolveCurrentChoice(state, event.choices[0]!.id, gameContent).state;
      guard += 1;
    }
    expect(
      followUp,
      "aucune suite de chaîne atteinte dans les 40 premières décisions",
    ).toBeDefined();
    const origin = findChainOrigin(followUp!, state);
    expect(origin).toBeDefined();
    expect(followUp!.chain!.followsEventIds).toContain(origin!.record.eventId);
    expect(origin!.decisionsAgo).toBeGreaterThan(0);
  });

  it("retourne undefined pour un événement sans chaîne", () => {
    const state = createGame(
      { seed: "no-chain", mode: "existing_party", partyId: "ps", methodId: "digital" },
      gameContent,
    );
    const event = makeEvent({});
    expect(findChainOrigin(event, state)).toBeUndefined();
  });
});
