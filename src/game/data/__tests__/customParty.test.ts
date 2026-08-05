import { describe, expect, it } from "vitest";

import {
  buildCustomParty,
  describeCustomPartyElectorate,
  ideologyQuestions,
} from "@/game/data/customParty";
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
  });
});
