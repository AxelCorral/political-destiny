import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { applyDueEffects, applyEffects, scheduleEffects } from "../effectProcessor";
import { createGame } from "../game";

describe("effets de jeu", () => {
  it("borne les valeurs visibles et idéologiques", () => {
    const state = createGame(
      { seed: "bornes", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const result = applyEffects(state, [
      { kind: "party_stat", stat: "popularity", delta: 500 },
      { kind: "ideology", axis: "economy", delta: -500 },
      { kind: "hidden_stat", stat: "fatigue", delta: Number.NaN },
    ]);
    expect(result.state.parties.alpha?.stats.popularity).toBe(100);
    expect(result.state.parties.alpha?.ideology.economy).toBe(-100);
    expect(result.state.parties.alpha?.hidden.fatigue).toBe(0);
  });

  it("exécute un effet différé une seule fois au bon index", () => {
    let state = createGame(
      { seed: "retard", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const initial = state.parties.alpha?.stats.credibility ?? 0;
    state = scheduleEffects(state, "fixture", [
      {
        afterDecisions: 2,
        effects: [{ kind: "party_stat", stat: "credibility", delta: 7 }],
      },
    ]);
    state.decisionIndex = 1;
    expect(applyDueEffects(state).state.parties.alpha?.stats.credibility).toBe(initial);
    state.decisionIndex = 2;
    const applied = applyDueEffects(state).state;
    expect(applied.parties.alpha?.stats.credibility).toBe(initial + 7);
    expect(applyDueEffects(applied).state.parties.alpha?.stats.credibility).toBe(initial + 7);
  });

  it("forme une alliance symétrique", () => {
    const state = createGame(
      { seed: "alliance", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const allied = applyEffects(state, [
      { kind: "alliance", partyId: "alpha", withPartyId: "gamma", action: "add" },
    ]).state;
    expect(allied.parties.alpha?.alliedWith).toContain("gamma");
    expect(allied.parties.gamma?.alliedWith).toContain("alpha");
  });
});
