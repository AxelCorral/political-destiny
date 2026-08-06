import { buildCustomParty } from "../../../src/game/data/customParty";
import type { PartyDefinition } from "../../../src/game/types/index";

export const CUSTOM_PARTY_PROFILES: Array<{
  id: string;
  description: string;
  definition: PartyDefinition;
}> = [
  {
    id: "coherent_left_green",
    description: "Économiquement à gauche, libéral socialement, pro-européen, très écologiste.",
    definition: buildCustomParty({
      name: "Alliance sociale et écologique",
      shortName: "ASE",
      primaryColor: "#376a67",
      symbol: "◌",
      answers: {
        pensions: "earlier",
        taxation: "redistribute",
        immigration: "open",
        security: "liberties",
        europe: "federal",
        ecology: "transform",
        services: "expand",
        institutions: "parliament",
      },
      leadershipModel: "decentralized",
      organizationPriority: "members",
      measureIds: ["citizen_convention", "public_investment", "climate_contract"],
    }),
  },
  {
    id: "coherent_conservative",
    description: "Économiquement libéral, souverainiste, sécuritaire et autoritaire.",
    definition: buildCustomParty({
      name: "Ordre et initiative",
      shortName: "OI",
      primaryColor: "#315986",
      symbol: "◆",
      answers: {
        pensions: "later",
        taxation: "reduce",
        immigration: "restrict",
        security: "order",
        europe: "sovereign",
        ecology: "production",
        services: "delegate",
        institutions: "executive",
      },
      leadershipModel: "vertical",
      organizationPriority: "officials",
      measureIds: ["tax_simplification", "security_pact", "local_referendum"],
    }),
  },
  {
    id: "contradictory_hybrid",
    description:
      "Redistributif et ouvert, mais sécuritaire, souverainiste et écologiste — profil incohérent volontaire.",
    definition: buildCustomParty({
      name: "Mouvement des possibles",
      shortName: "MDP",
      primaryColor: "#6b315d",
      symbol: "✦",
      answers: {
        pensions: "earlier",
        taxation: "redistribute",
        immigration: "open",
        security: "order",
        europe: "sovereign",
        ecology: "transform",
        services: "expand",
        institutions: "executive",
      },
      leadershipModel: "vertical",
      organizationPriority: "experts",
      measureIds: ["citizen_convention", "security_pact", "climate_contract"],
    }),
  },
  {
    id: "centrist_technocratic",
    description: "Profil centriste, technocratique, priorité aux cadres et à l'expertise.",
    definition: buildCustomParty({
      name: "Compétence commune",
      shortName: "CC",
      primaryColor: "#514b78",
      symbol: "▱",
      answers: {
        pensions: "stable",
        taxation: "target",
        immigration: "controlled",
        security: "balance",
        europe: "reform",
        ecology: "transition",
        services: "modernize",
        institutions: "decentralize",
      },
      leadershipModel: "balanced",
      organizationPriority: "experts",
      measureIds: ["public_investment", "local_referendum", "tax_simplification"],
    }),
  },
];
