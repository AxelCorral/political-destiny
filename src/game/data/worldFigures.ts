import type { WorldFigureProfile } from "@/game/types";

/**
 * §0.5 / §16-18 du prompt de mission — catalogue volontairement restreint
 * (priorité à la qualité, §31). Chaque figure est documentée dans
 * `docs/FICTIONAL_POLITICAL_ARCHETYPES.md`. Les axes suivent l'échelle
 * -100..100 des `IdeologyAxis` du jeu (économie : -100 très interventionniste,
 * 100 très pro-marché).
 */
export const worldFigures: WorldFigureProfile[] = [
  {
    id: "world_argentina_president",
    displayName: "Mateo Álvarez",
    country: "Argentine",
    office: "Président de la République argentine",
    fictional: true,
    realWorldReferencePeriod: "2026",
    economicAxis: 88,
    socialAxis: 20,
    foreignPolicyAxis: 40,
    affinityTags: ["deregulation", "market_liberalism", "public_spending_cuts"],
    hostilityTags: ["anticapitalism", "nationalization"],
    allowedNarrativeRoles: ["economic_endorsement", "symbolic_congratulation"],
    sensitiveContentPolicy: "no_domestic_scandal_link",
  },
  {
    id: "world_germany_chancellor",
    displayName: "Elke Brandt",
    country: "Allemagne",
    office: "Chancelière fédérale d’Allemagne",
    fictional: true,
    realWorldReferencePeriod: "2026",
    economicAxis: 35,
    socialAxis: 10,
    foreignPolicyAxis: 75,
    affinityTags: ["european_integration", "fiscal_orthodoxy", "franco_german_partnership"],
    hostilityTags: ["eu_rupture", "sovereigntism"],
    allowedNarrativeRoles: ["european_endorsement", "diplomatic_signal"],
    sensitiveContentPolicy: "no_domestic_scandal_link",
  },
  {
    id: "world_uk_pm",
    displayName: "Daniel Ashworth",
    country: "Royaume-Uni",
    office: "Premier ministre du Royaume-Uni",
    fictional: true,
    realWorldReferencePeriod: "2026",
    economicAxis: -20,
    socialAxis: -35,
    foreignPolicyAxis: 30,
    affinityTags: ["social_democracy", "pragmatic_european_cooperation"],
    hostilityTags: ["hard_identitarian_line"],
    allowedNarrativeRoles: ["social_democratic_endorsement", "diplomatic_signal"],
    sensitiveContentPolicy: "no_domestic_scandal_link",
  },
  {
    id: "world_us_president",
    displayName: "Carter Whitfield",
    country: "États-Unis",
    office: "Président des États-Unis",
    fictional: true,
    realWorldReferencePeriod: "2026",
    economicAxis: 55,
    socialAxis: 68,
    foreignPolicyAxis: -55,
    affinityTags: ["national_line", "protectionism", "immigration_skepticism"],
    hostilityTags: ["multilateralism", "pro_immigration_line"],
    allowedNarrativeRoles: ["national_right_endorsement", "symbolic_congratulation"],
    sensitiveContentPolicy: "no_domestic_scandal_link",
  },
];
