import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { createGame } from "../game";
import { redistributeAllianceBoost, redistributeElectorate } from "../redistribution";

/**
 * PROMPT_CLAUDE_CODE_ANCRAGE_REEL_PSEUDO_REALITE_RECOMPOSITIONS.md §30 (Phase
 * D) — liste exacte des invariants demandés : total voter mass conserved, no
 * NaN, no negative share, withdrawn candidate no longer active, abstention
 * allowed, eligible recipients only, ideological sensitivity, relation
 * sensitivity, endorsement sensitivity, determinism.
 */
function freshState(seed = "redistribution-fixture") {
  return createGame(
    { seed, mode: "existing_party", partyId: "alpha", methodId: "field" },
    testContent,
  );
}

describe("redistributeElectorate", () => {
  it("conserve la masse électorale totale (somme des blocs inchangée à 100 par construction)", () => {
    const state = freshState();
    const { state: result } = redistributeElectorate(state, testContent.electorateBlocs, "gamma");
    for (const bloc of testContent.electorateBlocs) {
      const support = result.electorate.latentSupport[bloc.id];
      expect(support).toBeDefined();
      const total = Object.values(support!).reduce((sum, value) => sum + value, 0);
      expect(total).toBeCloseTo(100, 6);
    }
  });

  it("ne produit jamais NaN", () => {
    const state = freshState();
    const { state: result, transfers } = redistributeElectorate(
      state,
      testContent.electorateBlocs,
      "gamma",
    );
    for (const bloc of testContent.electorateBlocs) {
      for (const value of Object.values(result.electorate.latentSupport[bloc.id]!)) {
        expect(Number.isNaN(value)).toBe(false);
      }
    }
    for (const value of Object.values(transfers)) expect(Number.isNaN(value)).toBe(false);
  });

  it("ne produit jamais de part négative", () => {
    const state = freshState();
    const { state: result } = redistributeElectorate(state, testContent.electorateBlocs, "gamma");
    for (const bloc of testContent.electorateBlocs) {
      for (const value of Object.values(result.electorate.latentSupport[bloc.id]!)) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("le parti retiré n'a plus aucune part dans aucun bloc après redistribution (destinataires éligibles uniquement)", () => {
    const state = freshState();
    const { state: result } = redistributeElectorate(state, testContent.electorateBlocs, "gamma");
    for (const bloc of testContent.electorateBlocs) {
      expect(result.electorate.latentSupport[bloc.id]!.gamma ?? 0).toBeCloseTo(0, 6);
    }
  });

  it("une part de l'électorat libéré part vers l'indécision/abstention plutôt que d'être intégralement redistribuée", () => {
    const state = freshState();
    const undecidedBefore = { ...state.electorate.undecidedByBloc };
    const { state: result } = redistributeElectorate(state, testContent.electorateBlocs, "gamma");
    let anyIncrease = false;
    for (const bloc of testContent.electorateBlocs) {
      if ((result.electorate.undecidedByBloc[bloc.id] ?? 0) > (undecidedBefore[bloc.id] ?? 0)) {
        anyIncrease = true;
      }
    }
    expect(anyIncrease).toBe(true);
  });

  it("sensibilité idéologique : le parti le plus proche du retiré reçoit une part plus grande que le plus éloigné", () => {
    const state = freshState();
    // alpha (-35) est plus proche de gamma (0) que beta (+35) ne l'est,
    // mais on retire gamma (le centre) : alpha et beta sont symétriques par
    // construction de la fixture, donc on force une asymétrie idéologique
    // artificielle sur la copie testée pour isoler l'effet.
    const skewed = structuredClone(state);
    skewed.parties.alpha!.perceivedIdeology.economy = -5;
    skewed.parties.beta!.perceivedIdeology.economy = 90;
    const { transfers } = redistributeElectorate(skewed, testContent.electorateBlocs, "gamma");
    expect(transfers.alpha ?? 0).toBeGreaterThan(transfers.beta ?? 0);
  });

  it("sensibilité aux relations : une meilleure relation avec le parti retiré augmente la part reçue", () => {
    const state = freshState();
    state.partyRelations.gamma!.alpha = 40;
    state.partyRelations.gamma!.beta = -40;
    const { transfers } = redistributeElectorate(state, testContent.electorateBlocs, "gamma");
    expect(transfers.alpha ?? 0).toBeGreaterThan(transfers.beta ?? 0);
  });

  it("sensibilité à l'endorsement : un endorsement explicite déjà posé augmente fortement la part reçue", () => {
    const withEndorsement = freshState();
    withEndorsement.flags["endorsement:gamma"] = "alpha";
    const withoutEndorsement = freshState();

    const withResult = redistributeElectorate(
      withEndorsement,
      testContent.electorateBlocs,
      "gamma",
    );
    const withoutResult = redistributeElectorate(
      withoutEndorsement,
      testContent.electorateBlocs,
      "gamma",
    );
    expect(withResult.transfers.alpha ?? 0).toBeGreaterThan(withoutResult.transfers.alpha ?? 0);
  });

  it("§17 : consigne fort > soutien explicite > retrait neutre, sur le même destinataire", () => {
    const none = freshState();
    const explicitSupport = redistributeElectorate(freshState(), testContent.electorateBlocs, "gamma", {
      partnerId: "alpha",
      strength: "explicit_support",
    });
    const coalitionAgreement = redistributeElectorate(
      freshState(),
      testContent.electorateBlocs,
      "gamma",
      { partnerId: "alpha", strength: "coalition_agreement" },
    );
    const neutral = redistributeElectorate(none, testContent.electorateBlocs, "gamma");
    expect(coalitionAgreement.transfers.alpha ?? 0).toBeGreaterThan(
      explicitSupport.transfers.alpha ?? 0,
    );
    expect(explicitSupport.transfers.alpha ?? 0).toBeGreaterThan(neutral.transfers.alpha ?? 0);
  });

  it("§9/§15 : un empilement alliance + endorsement + relation forte ne dépasse plus le palier le plus fort (plus de stacking multiplicatif)", () => {
    const stacked = freshState();
    stacked.parties.gamma!.alliedWith.push("alpha");
    stacked.flags["endorsement:gamma"] = "alpha";
    stacked.partyRelations.gamma!.alpha = 100;
    const stackedResult = redistributeElectorate(stacked, testContent.electorateBlocs, "gamma");

    const coalitionOnly = freshState();
    coalitionOnly.partyRelations.gamma!.alpha = 100;
    const coalitionOnlyResult = redistributeElectorate(
      coalitionOnly,
      testContent.electorateBlocs,
      "gamma",
      { partnerId: "alpha", strength: "coalition_agreement" },
    );
    // Même palier le plus fort (coalition_agreement) dans les deux cas : le
    // résultat doit être proche, pas démultiplié par l'empilement de trois
    // bonus indépendants comme avant cette mission.
    expect(stackedResult.transfers.alpha ?? 0).toBeCloseTo(
      coalitionOnlyResult.transfers.alpha ?? 0,
      0,
    );
  });

  it("une consigne de coalition réduit la part perdue vers l'indécision par rapport à un retrait neutre", () => {
    const neutralState = freshState();
    const undecidedBefore = { ...neutralState.electorate.undecidedByBloc };
    const neutralResult = redistributeElectorate(neutralState, testContent.electorateBlocs, "gamma");
    const neutralIncrease = testContent.electorateBlocs.reduce(
      (sum, bloc) =>
        sum +
        ((neutralResult.state.electorate.undecidedByBloc[bloc.id] ?? 0) -
          (undecidedBefore[bloc.id] ?? 0)),
      0,
    );

    const coalitionState = freshState();
    const coalitionResult = redistributeElectorate(
      coalitionState,
      testContent.electorateBlocs,
      "gamma",
      { partnerId: "alpha", strength: "coalition_agreement" },
    );
    const coalitionIncrease = testContent.electorateBlocs.reduce(
      (sum, bloc) =>
        sum +
        ((coalitionResult.state.electorate.undecidedByBloc[bloc.id] ?? 0) -
          (undecidedBefore[bloc.id] ?? 0)),
      0,
    );
    expect(coalitionIncrease).toBeLessThan(neutralIncrease);
  });

  it("est déterministe : même état source -> même résultat à chaque appel", () => {
    const state = freshState();
    const first = redistributeElectorate(state, testContent.electorateBlocs, "gamma");
    const second = redistributeElectorate(state, testContent.electorateBlocs, "gamma");
    expect(first.transfers).toEqual(second.transfers);
  });

  it("ne redistribue rien pour un parti déjà à zéro dans tous les blocs (pas de division par zéro)", () => {
    const state = freshState();
    for (const bloc of testContent.electorateBlocs) {
      state.electorate.latentSupport[bloc.id]!.gamma = 0;
    }
    const { transfers } = redistributeElectorate(state, testContent.electorateBlocs, "gamma");
    expect(Object.values(transfers).every((value) => Number.isFinite(value))).toBe(true);
  });
});

describe("redistributeAllianceBoost", () => {
  it("conserve la masse dans chaque bloc et ne produit jamais de valeur négative ou NaN", () => {
    const state = freshState();
    const result = redistributeAllianceBoost(state, testContent.electorateBlocs, "alpha", "beta");
    for (const bloc of testContent.electorateBlocs) {
      const support = result.electorate.latentSupport[bloc.id]!;
      const total = Object.values(support).reduce((sum, value) => sum + value, 0);
      expect(total).toBeCloseTo(100, 6);
      for (const value of Object.values(support)) {
        expect(Number.isNaN(value)).toBe(false);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("est déterministe", () => {
    const state = freshState();
    const first = redistributeAllianceBoost(state, testContent.electorateBlocs, "alpha", "beta");
    const second = redistributeAllianceBoost(state, testContent.electorateBlocs, "alpha", "beta");
    expect(first.electorate.latentSupport).toEqual(second.electorate.latentSupport);
  });
});
