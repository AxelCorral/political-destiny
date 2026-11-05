export const GAME_CONFIG = {
  schemaVersion: 2,
  targetDecisionsBeforeFirstRound: 30,
  targetDecisionsBetweenRounds: 5,
  targetGovernmentDecisions: 2,
  electionDate: "2027-04-18",
  /** V3 — la campagne démarre début septembre 2026, avant les primaires. */
  campaignStartDaysBeforeElection: 223,
  stateMin: 0,
  stateMax: 100,
  ideologyMin: -100,
  ideologyMax: 100,
  autosaveDebounceMs: 100,
} as const;
