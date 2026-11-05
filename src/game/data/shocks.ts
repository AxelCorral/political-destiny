import type { CampaignTheme, RegionId, WorldState } from "@/game/types";

/**
 * V3 — chocs extérieurs et mouvements sociaux pilotés par le directeur de campagne
 * (`src/game/engine/campaignDirector.ts`). Chaque entrée déclenche une carte dédiée
 * (`events/v3/shocks.ts`) en tête de file, à n'importe quel moment de la campagne.
 *
 * Inspirés de l'actualité (guerre au Moyen-Orient et prix du carburant, menace terroriste,
 * crises sociales), toujours présentés comme des chocs simulés : aucune date réelle, aucun
 * auteur, groupe ou victime réel.
 */
export interface ShockDefinition {
  id: string;
  /** Carte jouée quand le choc survient. */
  eventId: string;
  headline: string;
  theme: CampaignTheme;
  intensity: number;
  durationDecisions: number;
  tragic: boolean;
  weight: number;
  minDecision: number;
  maxDecision: number;
  world: Partial<
    Pick<
      WorldState,
      "economicClimate" | "socialTension" | "securityConcern" | "climateConcern" | "turnoutMood"
    >
  >;
}

export const shockDefinitions: ShockDefinition[] = [
  {
    id: "fuel_price_iran",
    eventId: "v3_shock_fuel_price",
    headline: "Guerre au Moyen-Orient : le gazole flambe à la pompe",
    theme: "economy",
    intensity: 78,
    durationDecisions: 5,
    tragic: false,
    weight: 1.4,
    minDecision: 2,
    maxDecision: 26,
    world: { economicClimate: -8, socialTension: 6 },
  },
  {
    id: "terror_attack",
    eventId: "v3_shock_terror_attack",
    headline: "Un attentat endeuille le pays",
    theme: "security",
    intensity: 90,
    durationDecisions: 6,
    tragic: true,
    weight: 0.8,
    minDecision: 6,
    maxDecision: 27,
    world: { securityConcern: 14, turnoutMood: 4 },
  },
  {
    id: "wildfires",
    eventId: "v3_shock_wildfires",
    headline: "Les incendies ravagent le Sud-Ouest",
    theme: "ecology",
    intensity: 62,
    durationDecisions: 4,
    tragic: false,
    weight: 0.9,
    minDecision: 3,
    maxDecision: 24,
    world: { climateConcern: 10 },
  },
  {
    id: "hospital_cyberattack",
    eventId: "v3_shock_hospital_cyberattack",
    headline: "Une cyberattaque paralyse des hôpitaux",
    theme: "services",
    intensity: 60,
    durationDecisions: 4,
    tragic: false,
    weight: 0.9,
    minDecision: 4,
    maxDecision: 26,
    world: { securityConcern: 4, socialTension: 3 },
  },
  {
    id: "eu_deficit_procedure",
    eventId: "v3_shock_eu_deficit",
    headline: "Bruxelles hausse le ton sur la dette française",
    theme: "europe",
    intensity: 55,
    durationDecisions: 4,
    tragic: false,
    weight: 0.8,
    minDecision: 5,
    maxDecision: 25,
    world: { economicClimate: -4 },
  },
  {
    id: "factory_closures",
    eventId: "v3_shock_factory_closures",
    headline: "Vague de fermetures d’usines dans l’automobile",
    theme: "social",
    intensity: 64,
    durationDecisions: 5,
    tragic: false,
    weight: 1,
    minDecision: 3,
    maxDecision: 26,
    world: { economicClimate: -5, socialTension: 7 },
  },
];

export interface ProtestDefinition {
  id: string;
  label: string;
  /** Carte jouée au départ du mouvement. */
  eventId: string;
  /** Carte jouée si le mouvement devient national (4 régions ou plus). */
  escalationEventId: string;
  theme: CampaignTheme;
  originRegions: RegionId[];
  intensity: number;
  durationDecisions: number;
  weight: number;
}

export const protestDefinitions: ProtestDefinition[] = [
  {
    id: "farmers",
    label: "Colère agricole",
    eventId: "v3_protest_farmers",
    escalationEventId: "v3_protest_national",
    theme: "economy",
    originRegions: ["west", "south_west"],
    intensity: 60,
    durationDecisions: 6,
    weight: 1.2,
  },
  {
    id: "fuel_blockades",
    label: "Blocages contre le prix du carburant",
    eventId: "v3_protest_fuel",
    escalationEventId: "v3_protest_national",
    theme: "social",
    originRegions: ["central", "north"],
    intensity: 66,
    durationDecisions: 6,
    weight: 1,
  },
  {
    id: "public_hospital",
    label: "Grève des soignants",
    eventId: "v3_protest_hospital",
    escalationEventId: "v3_protest_national",
    theme: "services",
    originRegions: ["ile_de_france"],
    intensity: 55,
    durationDecisions: 5,
    weight: 1,
  },
  {
    id: "students_climate",
    label: "Marches étudiantes pour le climat",
    eventId: "v3_protest_students",
    escalationEventId: "v3_protest_national",
    theme: "ecology",
    originRegions: ["ile_de_france", "south_east"],
    intensity: 50,
    durationDecisions: 5,
    weight: 0.8,
  },
];

/** Voisinage des grandes régions pour la diffusion des mouvements sociaux. */
export const REGION_NEIGHBOURS: Record<RegionId, RegionId[]> = {
  ile_de_france: ["north", "central", "east", "west"],
  north: ["ile_de_france", "east"],
  east: ["north", "ile_de_france", "central", "south_east"],
  west: ["ile_de_france", "central", "south_west"],
  south_west: ["west", "central", "south_east"],
  south_east: ["south_west", "central", "east"],
  central: ["ile_de_france", "west", "south_west", "south_east", "east"],
  overseas: [],
};

/** Poids d'agenda de référence de chaque thème (somme 100). */
export const BASELINE_SALIENCE: Record<CampaignTheme, number> = {
  economy: 27,
  social: 18,
  security: 20,
  ecology: 13,
  europe: 8,
  services: 14,
};

export const CAMPAIGN_THEME_LABELS: Record<CampaignTheme, string> = {
  economy: "Pouvoir d’achat",
  social: "Emploi et social",
  security: "Sécurité",
  ecology: "Climat",
  europe: "Europe",
  services: "Services publics",
};
