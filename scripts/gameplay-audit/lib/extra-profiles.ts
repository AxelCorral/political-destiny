/**
 * Gameplay audit only (section 24 of PROMPT_CLAUDE_CODE_AUDIT_GAMEPLAY_FUN.md):
 * additional custom-party profiles spanning the political spectrum, beyond
 * the 4 already used for statistical audits in
 * scripts/audit-post/lib/custom-profiles.ts. Audit tooling only — none of
 * this is imported by the production game.
 */
import { buildCustomParty } from "../../../src/game/data/customParty";
import type { PartyDefinition } from "../../../src/game/types/index";

export const EXTRA_CUSTOM_PROFILES: Array<{
  id: string;
  description: string;
  definition: PartyDefinition;
}> = [
  {
    id: "extreme_gauche",
    description: "Rupture économique radicale, ouverture totale, anti-autoritaire.",
    definition: buildCustomParty({
      name: "Rupture populaire",
      shortName: "RP",
      primaryColor: "#8a1f2b",
      symbol: "✊",
      answers: {
        pensions: "earlier",
        taxation: "redistribute",
        immigration: "open",
        security: "liberties",
        europe: "sovereign",
        ecology: "transform",
        services: "expand",
        institutions: "parliament",
      },
      leadershipModel: "decentralized",
      organizationPriority: "members",
      measureIds: ["citizen_convention", "public_investment", "work_income"],
    }),
  },
  {
    id: "extreme_droite",
    description: "Autoritaire, souverainiste, fermeture migratoire, économie protectionniste.",
    definition: buildCustomParty({
      name: "Réveil national",
      shortName: "RN2",
      primaryColor: "#1c2b52",
      symbol: "⚑",
      answers: {
        pensions: "later",
        taxation: "target",
        immigration: "restrict",
        security: "order",
        europe: "sovereign",
        ecology: "production",
        services: "delegate",
        institutions: "executive",
      },
      leadershipModel: "vertical",
      organizationPriority: "officials",
      measureIds: ["security_pact", "tax_simplification", "local_referendum"],
    }),
  },
  {
    id: "libertarien",
    description: "Minimal État économique ET sociétal, libertés civiles maximales.",
    definition: buildCustomParty({
      name: "Voie libre",
      shortName: "VL",
      primaryColor: "#c9a24b",
      symbol: "◇",
      answers: {
        pensions: "later",
        taxation: "reduce",
        immigration: "open",
        security: "liberties",
        europe: "reform",
        ecology: "production",
        services: "delegate",
        institutions: "decentralize",
      },
      leadershipModel: "decentralized",
      organizationPriority: "experts",
      measureIds: ["tax_simplification", "local_referendum", "citizen_convention"],
    }),
  },
  {
    id: "ecologiste_radical",
    description: "Transformation écologique maximale, prioritaire sur tout le reste.",
    definition: buildCustomParty({
      name: "Limite planétaire",
      shortName: "LP",
      primaryColor: "#2f6b3a",
      symbol: "❀",
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
      measureIds: ["climate_contract", "public_investment", "citizen_convention"],
    }),
  },
  {
    id: "souverainiste",
    description: "Souveraineté nationale, économie mixte, ni gauche radicale ni extrême droite.",
    definition: buildCustomParty({
      name: "France d'abord la République",
      shortName: "FAR",
      primaryColor: "#4a5c5e",
      symbol: "⬟",
      answers: {
        pensions: "stable",
        taxation: "target",
        immigration: "controlled",
        security: "balance",
        europe: "sovereign",
        ecology: "transition",
        services: "modernize",
        institutions: "executive",
      },
      leadershipModel: "vertical",
      organizationPriority: "officials",
      measureIds: ["local_referendum", "migration_compromise", "european_defense"],
    }),
  },
];
