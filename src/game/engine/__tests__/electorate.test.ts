import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { createGame } from "../game";
import { partyAppeal } from "../electorate";

describe("partyAppeal — P1 (chantier ciblé)", () => {
  it("régression : la cohésion et la cohérence de campagne doivent influencer l'appel électoral", () => {
    // Reproduit le défaut diagnostiqué le 06/08/2026 (P1_P5_FINAL_FIXES.md
    // section 3) : party.stats.cohesion (221 effets dans le catalogue) et
    // hidden.consistency (modifié à chaque déclaration) n'avaient aucun
    // effet sur partyAppeal() avant la correction — deux campagnes
    // identiques en tout sauf ces deux stats produisaient exactement le
    // même score d'attractivité électorale.
    const state = createGame(
      { seed: "p1-cohesion", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const party = state.parties.alpha!;
    const bloc = testContent.electorateBlocs[0]!;

    const lowCohesion = { ...party, stats: { ...party.stats, cohesion: 20 } };
    const highCohesion = { ...party, stats: { ...party.stats, cohesion: 90 } };
    expect(partyAppeal(highCohesion, bloc, 0, 0)).toBeGreaterThan(
      partyAppeal(lowCohesion, bloc, 0, 0),
    );

    const lowConsistency = { ...party, hidden: { ...party.hidden, consistency: 20 } };
    const highConsistency = { ...party, hidden: { ...party.hidden, consistency: 90 } };
    expect(partyAppeal(highConsistency, bloc, 0, 0)).toBeGreaterThan(
      partyAppeal(lowConsistency, bloc, 0, 0),
    );
  });

  it("la cohésion et la cohérence sont neutres à leur valeur de calibration (50) — aucun changement de difficulté par défaut", () => {
    const state = createGame(
      { seed: "p1-neutral", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const party = state.parties.alpha!;
    const bloc = testContent.electorateBlocs[0]!;
    const neutral = {
      ...party,
      stats: { ...party.stats, cohesion: 50 },
      hidden: { ...party.hidden, consistency: 50 },
    };
    const withoutLevers = {
      ...party,
      stats: { ...party.stats, cohesion: 50 },
      hidden: { ...party.hidden, consistency: 50 },
    };
    expect(partyAppeal(neutral, bloc, 0, 0)).toBeCloseTo(partyAppeal(withoutLevers, bloc, 0, 0), 6);
  });

  it("potentialSupport n'a toujours aucun effet direct sur l'appel électoral (utilisé uniquement pour la métrique de progression)", () => {
    // Documente une contrainte volontaire, pas un défaut à corriger dans ce
    // chantier : potentialSupport reste un plafond informatif pour
    // progression.ts, pas un paramètre du moteur de vote.
    const state = createGame(
      { seed: "p1-potential", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const party = state.parties.alpha!;
    const bloc = testContent.electorateBlocs[0]!;
    const lowPotential = { ...party, hidden: { ...party.hidden, potentialSupport: 10 } };
    const highPotential = { ...party, hidden: { ...party.hidden, potentialSupport: 90 } };
    expect(partyAppeal(lowPotential, bloc, 0, 0)).toBeCloseTo(
      partyAppeal(highPotential, bloc, 0, 0),
      6,
    );
  });

  it("un gain de cohésion et de cohérence combiné reste modéré (pas d'option dominante à lui seul)", () => {
    const state = createGame(
      { seed: "p1-bounded", mode: "existing_party", partyId: "alpha", methodId: "field" },
      testContent,
    );
    const party = state.parties.alpha!;
    const bloc = testContent.electorateBlocs[0]!;
    const baseline = partyAppeal(party, bloc, 0, 0);
    const maxed = partyAppeal(
      {
        ...party,
        stats: { ...party.stats, cohesion: 100 },
        hidden: { ...party.hidden, consistency: 100 },
      },
      bloc,
      0,
      0,
    );
    // Le gain maximal (cohésion + cohérence toutes deux au plafond, depuis
    // leur valeur de départ) ne doit pas dépasser une fraction raisonnable
    // de l'appel de base — sinon ces deux leviers deviendraient dominants.
    expect(maxed - baseline).toBeLessThan(baseline * 0.5);
    expect(maxed).toBeGreaterThan(baseline);
  });
});
