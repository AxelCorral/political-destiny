import { describe, expect, it } from "vitest";

import { computeQualificationGap } from "../game-presentation";

/**
 * Fun-improvement mission, Phase G — qualification gap display (P3 of
 * PROMPT_CLAUDE_CODE_AMELIORATION_FUN_POST_AUDIT.md, section 11:
 * "afficher tendance/momentum plutôt que seulement rang brut", "mieux
 * mettre en scène les écarts avec la barre de qualification").
 */
describe("computeQualificationGap", () => {
  it("mesure l'avance sur la 3e place quand le joueur est qualifiant (top 2)", () => {
    const gap = computeQualificationGap({ a: 30, player: 25, b: 18, c: 10 }, "player");
    expect(gap.qualifying).toBe(true);
    expect(gap.againstPartyId).toBe("b");
    expect(gap.points).toBeCloseTo(7, 5);
  });

  it("mesure le déficit à la 2e place quand le joueur est hors zone de qualification", () => {
    const gap = computeQualificationGap({ a: 30, b: 25, player: 18, c: 10 }, "player");
    expect(gap.qualifying).toBe(false);
    expect(gap.againstPartyId).toBe("b");
    expect(gap.points).toBeCloseTo(7, 5);
  });

  it("gère un rang 1 sans troisième concurrent (peu de partis actifs)", () => {
    const gap = computeQualificationGap({ player: 40, rival: 20 }, "player");
    expect(gap.qualifying).toBe(true);
    expect(gap.againstPartyId).toBeUndefined();
    expect(gap.points).toBeCloseTo(40, 5);
  });

  it("ne renvoie jamais un écart négatif", () => {
    const gapTop = computeQualificationGap({ player: 20, a: 25, b: 19.9999 }, "player");
    expect(gapTop.points).toBeGreaterThanOrEqual(0);
    const gapBottom = computeQualificationGap({ a: 25, b: 24, player: 24 }, "player");
    expect(gapBottom.points).toBeGreaterThanOrEqual(0);
  });

  it("retourne un résultat neutre si le parti du joueur est absent des résultats", () => {
    const gap = computeQualificationGap({ a: 30, b: 20 }, "missing");
    expect(gap).toEqual({ qualifying: false, points: 0, againstPartyId: undefined });
  });
});
