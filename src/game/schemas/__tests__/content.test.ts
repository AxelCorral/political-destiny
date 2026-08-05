import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { gameContentSchema } from "../content";

describe("schéma de contenu", () => {
  it("valide une bibliothèque complète conforme", () => {
    const result = gameContentSchema.safeParse(testContent);
    expect(result.success, result.success ? undefined : JSON.stringify(result.error.issues)).toBe(
      true,
    );
  });

  it("refuse les poids négatifs", () => {
    const invalid = structuredClone(testContent);
    invalid.events[0]!.choices[0]!.outcomeGroups[0]!.baseWeight = -1;
    expect(gameContentSchema.safeParse(invalid).success).toBe(false);
  });
});
