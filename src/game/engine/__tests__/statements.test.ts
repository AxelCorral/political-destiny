import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { conditionMatches } from "../conditions";
import { createGame } from "../game";
import { normalizePolicyTopic, recordStatement } from "../statements";

function stateForStatements() {
  return createGame(
    { seed: "positions", mode: "existing_party", partyId: "alpha", methodId: "field" },
    testContent,
  );
}

describe("déclarations et programme émergent", () => {
  it.each([
    ["fiscalité", "fiscality"],
    ["services publics", "public_services"],
    ["Union européenne", "europe"],
    ["libertés publiques", "civil_liberties"],
  ] as const)("normalise le thème %s", (source, expected) => {
    expect(normalizePolicyTopic(source)).toBe(expected);
  });

  it("enregistre une position et la rend éligible aux événements futurs", () => {
    const result = recordStatement(
      stateForStatements(),
      "fixture_program",
      {
        topic: "fiscalité",
        policyTopic: "fiscality",
        text: "Publier un barème complet et financer les services publics par une contribution progressive",
        stance: -45,
      },
      1,
      testContent.electorateBlocs,
    );

    expect(result.record.evolution).toBe("initial_position");
    expect(result.state.policyPositions.fiscality?.stance).toBe(-45);
    expect(
      conditionMatches(result.state, {
        kind: "statement_exists",
        topic: "fiscality",
        value: true,
      }),
    ).toBe(true);
  });

  it("distingue une évolution progressive d’un revirement brutal", () => {
    const initial = recordStatement(
      stateForStatements(),
      "position_initiale",
      {
        topic: "retraites",
        policyTopic: "pensions",
        text: "Rétablir un âge de départ plus bas pour les carrières longues",
        stance: -55,
      },
      1,
      testContent.electorateBlocs,
    ).state;
    const gradual = recordStatement(
      initial,
      "ajustement",
      {
        topic: "retraites",
        policyTopic: "pensions",
        text: "Négocier une transition plus longue pour les métiers sans pénibilité reconnue",
        stance: -47,
      },
      2,
      testContent.electorateBlocs,
    );
    const cohesionBeforeReversal = gradual.state.parties.alpha!.stats.cohesion;
    const reversal = recordStatement(
      gradual.state,
      "revirement",
      {
        topic: "retraites",
        policyTopic: "pensions",
        text: "Relever immédiatement l’âge légal et supprimer les dérogations annoncées",
        stance: 55,
      },
      3,
      testContent.electorateBlocs,
    );

    expect(gradual.record.evolution).toBe("gradual_evolution");
    expect(reversal.record.evolution).toBe("abrupt_reversal");
    expect(reversal.record.contradictionWithDecisionIndex).toBe(2);
    expect(reversal.state.parties.alpha!.stats.cohesion).toBeLessThan(cohesionBeforeReversal);
    expect(reversal.state.parties.alpha!.hidden.consistency).toBeLessThan(
      gradual.state.parties.alpha!.hidden.consistency,
    );
  });
});
