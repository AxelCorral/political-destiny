import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";

/**
 * Passe ciblée post-fun (TARGETED_GAMEPLAY_PASS_REPORT.md), Phase E —
 * refonte de debate_frontrunner_retaliation (dominance mesurée à 0,908 puis
 * 0,922, aggravée par une tentative de correction précédente). Vérifie
 * structurellement que les quatre options portent chacune un compromis réel
 * et distinct plutôt qu'un simple ajustement de magnitude uniforme :
 * l'option auparavant "gratuite" (counter) porte désormais un coût de
 * rejet, l'option prudente (ignore) porte désormais un bénéfice de rejet
 * unique, l'option institutionnelle (right_of_reply) porte désormais un
 * coût de momentum et un bénéfice de bloc électoral ciblé.
 */
describe("debate_frontrunner_retaliation — refonte des quatre options", () => {
  const event = gameContent.events.find((e) => e.id === "debate_frontrunner_retaliation");

  it("existe avec ses quatre choix", () => {
    expect(event?.choices).toHaveLength(4);
  });

  it("counter porte désormais un coût de rejet en plus du coût de momentum et de relation", () => {
    const choice = event?.choices.find((c) => c.id === "frontrunner_retaliation_counter");
    const effects = choice?.outcomeGroups[0]?.effects ?? [];
    const rejectionEffect = effects.find((e) => e.kind === "party_stat" && e.stat === "rejection");
    const momentumEffect = effects.find((e) => e.kind === "party_stat" && e.stat === "momentum");
    const relationEffect = effects.find((e) => e.kind === "party_relation");
    expect(rejectionEffect && "delta" in rejectionEffect ? rejectionEffect.delta : 0).toBe(1);
    expect(momentumEffect && "delta" in momentumEffect ? momentumEffect.delta : 0).toBe(-3);
    expect(relationEffect).toBeDefined();
  });

  it("ignore porte désormais un bénéfice de rejet unique parmi les quatre options", () => {
    const choice = event?.choices.find((c) => c.id === "frontrunner_retaliation_ignore");
    const effects = choice?.outcomeGroups[0]?.effects ?? [];
    const rejectionEffect = effects.find((e) => e.kind === "party_stat" && e.stat === "rejection");
    expect(rejectionEffect && "delta" in rejectionEffect ? rejectionEffect.delta : 0).toBe(-1);
    const otherChoicesHaveRejectionReduction = event?.choices
      .filter((c) => c.id !== "frontrunner_retaliation_ignore")
      .some((c) =>
        c.outcomeGroups[0]?.effects.some(
          (e) => e.kind === "party_stat" && e.stat === "rejection" && "delta" in e && e.delta < 0,
        ),
      );
    expect(otherChoicesHaveRejectionReduction).toBe(false);
  });

  it("right_of_reply porte désormais un coût de momentum et un bénéfice de bloc ciblé", () => {
    const choice = event?.choices.find((c) => c.id === "frontrunner_retaliation_right_of_reply");
    const effects = choice?.outcomeGroups[0]?.effects ?? [];
    const momentumEffect = effects.find((e) => e.kind === "party_stat" && e.stat === "momentum");
    const blocEffect = effects.find((e) => e.kind === "bloc_trust");
    expect(momentumEffect && "delta" in momentumEffect ? momentumEffect.delta : 0).toBe(-1);
    expect(blocEffect).toBeDefined();
  });

  it("deride conserve son profil risque/récompense avec un momentum renforcé", () => {
    const choice = event?.choices.find((c) => c.id === "frontrunner_retaliation_deride");
    const effects = choice?.outcomeGroups[0]?.effects ?? [];
    const momentumEffect = effects.find((e) => e.kind === "party_stat" && e.stat === "momentum");
    expect(momentumEffect && "delta" in momentumEffect ? momentumEffect.delta : 0).toBe(3);
  });

  it("aucune option ne domine plus toutes les autres sur tous les axes positifs simultanément", () => {
    // "counter" était l'option structurellement supérieure sans contrepartie
    // réelle (voir FUN_IMPROVEMENTS_REPORT.md §10) : elle doit désormais
    // porter au moins autant de contreparties négatives que n'importe quelle
    // autre option du même événement.
    const negativeCounts = (event?.choices ?? []).map((choice) => ({
      id: choice.id,
      negatives: (choice.outcomeGroups[0]?.effects ?? []).filter(
        (e) => "delta" in e && typeof e.delta === "number" && e.delta < 0,
      ).length,
    }));
    const counter = negativeCounts.find((c) => c.id === "frontrunner_retaliation_counter");
    const maxOtherNegatives = Math.max(
      ...negativeCounts
        .filter((c) => c.id !== "frontrunner_retaliation_counter")
        .map((c) => c.negatives),
    );
    expect(counter?.negatives ?? 0).toBeGreaterThanOrEqual(maxOtherNegatives);
  });
});
