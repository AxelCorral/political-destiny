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

  it("valide les métadonnées narratives et relationnelles V2", () => {
    const enriched = structuredClone(testContent);
    enriched.contentVersion = 2;
    enriched.entities = [
      {
        id: "assemblee_nationale",
        displayName: "Assemblée nationale",
        category: "institution",
        reality: "real",
        allowedUses: ["Contexte institutionnel factuel"],
        sensitivity: "none",
        verifiedAt: "2026-08-05",
      },
    ];
    const event = enriched.events[0]!;
    event.themes = ["institutions"];
    event.importance = "major";
    event.maxAppearances = 1;
    event.entityReferences = [{ entityId: "assemblee_nationale", role: "institution" }];
    event.editorialSensitivity = "none";
    event.choices[0]!.strategy = "legal_action";
    event.choices[0]!.outcomeGroups[0]!.effects.push({
      kind: "actor_memory",
      actorId: "alpha-candidate",
      memory: "trust",
      intensity: 20,
      targetPartyId: "alpha",
    });

    expect(gameContentSchema.safeParse(enriched).success).toBe(true);
  });

  it("refuse une suite dont la probabilité dépasse 100 %", () => {
    const invalid = structuredClone(testContent);
    invalid.events[0]!.choices[0]!.outcomeGroups[0]!.followUps = [
      { eventId: invalid.events[1]!.id, afterDecisions: 2, probability: 1.2 },
    ];
    expect(gameContentSchema.safeParse(invalid).success).toBe(false);
  });
});
