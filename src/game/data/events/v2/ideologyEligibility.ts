import type { GameEventDefinition, IdeologyFamily, PoliticalTopic } from "@/game/types";

const FAMILY_ELIGIBILITY: Record<string, IdeologyFamily[]> = {
  campaign_farmers_roundtable: [
    "center_right",
    "conservative_right",
    "national_right",
    "sovereigntist_right",
  ],
  campaign_small_business: ["liberal_center", "center_right", "conservative_right"],
  campaign_citizens_convention: ["radical_left", "social_democrat", "green"],
  campaign_door_to_door: ["radical_left", "social_democrat", "green", "national_right"],
  campaign_peripheral_town: ["radical_left", "national_right", "sovereigntist_right"],
  campaign_rural_desert: ["green", "center_right", "conservative_right"],
  campaign_overseas_trip: ["radical_left", "social_democrat", "liberal_center", "national_right"],
  media_long_podcast: ["social_democrat", "green", "liberal_center", "center_right"],
  media_short_video: ["radical_left", "green", "national_right", "sovereigntist_right"],
  media_documentary_access: ["social_democrat", "green", "liberal_center"],
  internal_youth_wing: ["radical_left", "social_democrat", "green", "liberal_center"],
  internal_major_donor: ["liberal_center", "center_right", "conservative_right", "national_right"],
  alliance_left_roundtable: ["radical_left", "social_democrat", "green"],
  alliance_center_pact: ["social_democrat", "liberal_center", "center_right"],
  alliance_right_convention: [
    "center_right",
    "conservative_right",
    "national_right",
    "sovereigntist_right",
  ],
  world_industrial_closure: ["radical_left", "social_democrat", "national_right"],
  world_housing_protest: ["radical_left", "social_democrat", "green"],
  world_energy_price_spike: [
    "green",
    "liberal_center",
    "center_right",
    "conservative_right",
    "national_right",
  ],
  world_budget_warning: ["liberal_center", "center_right", "conservative_right"],
  world_national_strike: [
    "radical_left",
    "social_democrat",
    "conservative_right",
    "national_right",
  ],
};

const STATEMENT_FOLLOW_UP: Record<string, PoliticalTopic> = {
  campaign_union_meeting: "work",
  campaign_hospital_night: "public_services",
  campaign_student_forum: "social_issues",
  media_economic_morning: "economy",
  media_fact_check_followup: "fiscality",
  media_foreign_interview: "europe",
  debate_economy_round: "economy",
  debate_security_round: "security",
  alliance_union_support: "pensions",
  world_european_vote: "europe",
  world_heatwave: "ecology",
  world_security_attack: "civil_liberties",
};

export function applyIdeologicalEligibility(events: GameEventDefinition[]): GameEventDefinition[] {
  return events.map((event) => {
    const families = FAMILY_ELIGIBILITY[event.id];
    const statementTopic = STATEMENT_FOLLOW_UP[event.id];
    if (!families && !statementTopic) return event;
    return {
      ...event,
      ...(families ? { eligibleIdeologyFamilies: families } : {}),
      eligibility: statementTopic
        ? [...event.eligibility, { kind: "statement_exists", topic: statementTopic, value: true }]
        : event.eligibility,
    };
  });
}
