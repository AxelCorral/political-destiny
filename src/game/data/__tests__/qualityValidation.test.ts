import { describe, expect, it } from "vitest";

import { testContent } from "@/game/fixtures/testContent";

import { isConcreteChoice, validateContentQuality } from "../qualityValidation";

describe("qualité éditoriale V2", () => {
  it.each(["Être prudent", "Réponse technique", "Jouer collectif", "Se montrer ferme"])(
    "refuse le faux choix « %s »",
    (label) => {
      expect(isConcreteChoice(label)).toBe(false);
    },
  );

  it.each([
    "Publier les comptes du parti avant le journal de vingt heures",
    "Suspendre le trésorier et confier les pièces à une commission indépendante",
    "Refuser l’alliance et mobiliser les militants dans les circonscriptions disputées",
  ])("reconnaît l’action concrète « %s »", (label) => {
    expect(isConcreteChoice(label)).toBe(true);
  });

  it("signale les ensembles de choix et les conséquences dupliqués", () => {
    const content = structuredClone(testContent);
    const source = content.events[0]!;
    const duplicate = content.events[1]!;
    duplicate.choices = structuredClone(source.choices);
    duplicate.choices[1]!.outcomeGroups = structuredClone(duplicate.choices[0]!.outcomeGroups);

    const report = validateContentQuality(content);

    expect(report.metrics.duplicateChoiceSets).toBeGreaterThan(0);
    expect(report.metrics.identicalConsequencePairs).toBeGreaterThan(0);
    expect(report.errors.some((error) => error.includes("mêmes conséquences"))).toBe(true);
  });

  it("échoue lorsqu’une chaîne pointe vers un événement absent", () => {
    const content = structuredClone(testContent);
    const initialMissingTargets = validateContentQuality(content).metrics.missingChainTargets;
    content.events[0]!.choices[0]!.outcomeGroups[0]!.followUps = [
      { eventId: "suite_absente", afterDecisions: 2, probability: 0.5 },
    ];

    const report = validateContentQuality(content);

    expect(report.metrics.missingChainTargets).toBeGreaterThan(initialMissingTargets);
    expect(report.errors).toContain(
      `${content.events[0]!.id}: référence un événement absent (suite_absente)`,
    );
  });

  it("interdit une personnalité réelle dans un événement sensible", () => {
    const content = structuredClone(testContent);
    content.entities = [
      {
        id: "personnalite_reelle",
        displayName: "Personnalité publique",
        category: "public_figure",
        reality: "real",
        allowedUses: ["Rôle public factuel"],
        sensitivity: "contextual",
      },
    ];
    content.events[0]!.entityReferences = [{ entityId: "personnalite_reelle", role: "subject" }];
    content.events[0]!.editorialSensitivity = "sensitive";

    expect(
      validateContentQuality(content).errors.some((error) =>
        error.includes("personnalité réelle utilisée dans un contexte sensible"),
      ),
    ).toBe(true);
  });

  it("détecte un succès dont le seuil dépasse une borne du moteur", () => {
    const content = structuredClone(testContent);
    content.achievements[0]!.criteria = {
      mode: "all",
      conditions: [{ metric: "score", operator: "gte", value: 101 }],
    };

    expect(
      validateContentQuality(content).errors.some((error) => error.includes("seuil impossible")),
    ).toBe(true);
  });
});
