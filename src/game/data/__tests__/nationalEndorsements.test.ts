import { describe, expect, it } from "vitest";

import { gameContent } from "@/game/data";

/**
 * PROMPT_CLAUDE_CODE_RECOMPOSITIONS_STRATEGIQUES_SOUTIENS_CHOCS.md §18-23/§35 —
 * structure minimale attendue pour le catalogue de soutiens nationaux
 * pseudonymisés : entre 6 et 10 figures, chacune associée à un endorsement
 * et à un événement jouable, jamais un bonus universel (effets mixtes).
 */
describe("nationalFigures / endorsements nationaux", () => {
  it("contient entre 6 et 10 figures nationales, toutes fictives et pseudonymisées", () => {
    const figures = gameContent.nationalFigures ?? [];
    expect(figures.length).toBeGreaterThanOrEqual(6);
    expect(figures.length).toBeLessThanOrEqual(10);
    for (const figure of figures) {
      expect(figure.fictional).toBe(true);
      expect(figure.affinityTags.length).toBeGreaterThan(0);
      expect(figure.hostilityTags.length).toBeGreaterThan(0);
    }
  });

  it("chaque figure nationale a exactement un endorsement et un événement associés", () => {
    const figures = gameContent.nationalFigures ?? [];
    const nationalEndorsements = (gameContent.majorEndorsements ?? []).filter(
      (endorsement) => endorsement.figureKind !== "world_figure",
    );
    expect(nationalEndorsements.length).toBe(figures.length);

    for (const figure of figures) {
      const endorsement = nationalEndorsements.find((e) => e.figureId === figure.id);
      expect(endorsement, `endorsement manquant pour ${figure.id}`).toBeDefined();
      expect(endorsement!.positiveEffects.length).toBeGreaterThan(0);
      expect(endorsement!.negativeEffects.length).toBeGreaterThan(0);
      expect(endorsement!.eligiblePartyIds.length).toBeGreaterThan(0);

      const event = gameContent.events.find((e) => e.id === endorsement!.id);
      expect(event, `événement manquant pour ${endorsement!.id}`).toBeDefined();
      expect(event!.eligibleParties).toEqual(endorsement!.eligiblePartyIds);
    }
  });

  it("aucun endorsement national ne partage sa figure avec un endorsement mondial", () => {
    const worldFigureIds = new Set((gameContent.worldFigures ?? []).map((f) => f.id));
    for (const figure of gameContent.nationalFigures ?? []) {
      expect(worldFigureIds.has(figure.id)).toBe(false);
    }
  });
});
