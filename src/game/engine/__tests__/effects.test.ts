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

  it("applique un gain positif à pleine puissance sous 70% du plafond d’une statistique", () => {
    const state = createGame(
      { seed: "rendements-bas", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    state.parties.alpha!.stats.credibility = 50;
    const applied = applyEffects(state, [
      { kind: "party_stat", stat: "credibility", delta: 8 },
    ]).state;
    expect(applied.parties.alpha?.stats.credibility).toBe(58);
  });

  it("atténue un gain positif au-delà de 70% du plafond (rendements décroissants) — régression P1", () => {
    // Diagnosed for P1: with a flat clamp, near-every agent drove credibility
    // to ~99-100 regardless of strategy, erasing agent-driven variance on
    // the stat that feeds partyAppeal()'s competence term. A gain applied
    // from 90/100 must land strictly between "unscaled" (98) and "no
    // movement at all" (90), and never overshoot past the ceiling.
    const state = createGame(
      { seed: "rendements-hauts", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    state.parties.alpha!.stats.credibility = 90;
    const applied = applyEffects(state, [
      { kind: "party_stat", stat: "credibility", delta: 8 },
    ]).state;
    const result = applied.parties.alpha!.stats.credibility;
    expect(result).toBeGreaterThan(90);
    expect(result).toBeLessThan(98);
  });

  it("n’atténue jamais un effet négatif, même tout en haut du plafond", () => {
    const state = createGame(
      { seed: "revers-en-haut", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    state.parties.alpha!.stats.credibility = 95;
    const applied = applyEffects(state, [
      { kind: "party_stat", stat: "credibility", delta: -8 },
    ]).state;
    expect(applied.parties.alpha?.stats.credibility).toBe(87);
  });

  it("n’applique aucun gain positif quand la statistique est déjà au plafond", () => {
    const state = createGame(
      { seed: "plafond", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    state.parties.alpha!.stats.credibility = 100;
    const applied = applyEffects(state, [
      { kind: "party_stat", stat: "credibility", delta: 5 },
    ]).state;
    expect(applied.parties.alpha?.stats.credibility).toBe(100);
  });

  it("n’atténue jamais la croissance des adhérents (plafond bien plus élevé, mécanique distincte)", () => {
    const state = createGame(
      { seed: "adherents", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const before = state.parties.alpha!.stats.members;
    const applied = applyEffects(state, [
      { kind: "party_stat", stat: "members", delta: 4_000_000 },
    ]).state;
    expect(applied.parties.alpha?.stats.members).toBe(before + 4_000_000);
  });

  it("mémorise une dette politique et fait évoluer une relation", () => {
    const state = createGame(
      { seed: "mémoire", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const before = state.partyRelations.alpha?.beta ?? 0;
    const applied = applyEffects(state, [
      {
        kind: "actor_memory",
        actorId: "beta_candidate",
        memory: "political_debt",
        intensity: 35,
        targetPartyId: "alpha",
      },
      { kind: "party_relation", partyId: "player", withPartyId: "beta", delta: 12 },
    ]).state;

    expect(applied.actorMemories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ actorId: "beta_candidate", kind: "political_debt" }),
      ]),
    );
    expect(applied.actors.beta_candidate?.memory.entries).toHaveLength(1);
    expect(applied.partyRelations.alpha?.beta).toBeCloseTo(before + 12, 8);
    expect(applied.partyRelations.beta?.alpha).toBeCloseTo(before + 12, 8);
  });
});
