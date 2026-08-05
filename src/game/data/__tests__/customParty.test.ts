import { describe, expect, it } from "vitest";

import {
  buildCustomParty,
  describeCustomPartyElectorate,
  ideologyQuestions,
} from "@/game/data/customParty";
import { gameContent } from "@/game/data";
import { createGame } from "@/game/engine";
import { partyDefinitionSchema } from "@/game/schemas";

describe("parti personnalisé", () => {
  it("dérive un parti valide depuis les réponses", () => {
    const party = buildCustomParty({
      name: "Les Jours Communs",
      shortName: "LJC",
      primaryColor: "#514b78",
      symbol: "✦",
      answers: Object.fromEntries(
        ideologyQuestions.map((question) => [
          question.id,
          question.options[1]?.id ?? question.options[0]!.id,
        ]),
      ),
      leadershipModel: "balanced",
      organizationPriority: "members",
      measureIds: ["public_investment", "climate_contract", "local_referendum"],
    });
    expect(partyDefinitionSchema.safeParse(party).success).toBe(true);
    expect(party.program).toHaveLength(3);
    expect(describeCustomPartyElectorate(party)).toContain("Votre mouvement attire");
    expect(party.organizationProfile?.fundingModel).toBe("members");
    expect(party.campaignProfile?.coreElectorates).toHaveLength(2);
    expect(party.campaignProfile?.naturalAllies).toHaveLength(2);
  });

  it("transforme une incohérence déclarée en condition narrative", () => {
    const party = buildCustomParty({
      name: "Mouvement contradictoire",
      shortName: "MC",
      primaryColor: "#514b78",
      symbol: "✦",
      answers: {
        pensions: "earlier",
        taxation: "redistribute",
        immigration: "controlled",
        security: "balance",
        europe: "sovereign",
        ecology: "transform",
        services: "delegate",
        institutions: "decentralize",
      },
      leadershipModel: "balanced",
      organizationPriority: "experts",
      measureIds: ["european_defense", "tax_simplification", "work_income"],
    });
    expect(party.organizationProfile?.incoherence).toBeGreaterThanOrEqual(35);
    expect(party.uniqueEventTags).toContain("custom_incoherent");
    expect(party.campaignProfile?.contradictions.length).toBeGreaterThan(1);

    const state = createGame(
      {
        seed: "custom-tags",
        mode: "custom_party",
        partyId: party.id,
        methodId: gameContent.methods[0]!.id,
        customParty: party,
      },
      gameContent,
    );
    expect(state.flags["tag:custom_party"]).toBe(true);
    expect(state.flags["tag:custom_incoherent"]).toBe(true);
  });
});
