export const GAME_CONFIG = {
  schemaVersion: 1,
  targetDecisionsBeforeFirstRound: 24,
  targetDecisionsBetweenRounds: 5,
  targetGovernmentDecisions: 2,
  electionDate: "2027-04-11",
  stateMin: 0,
  stateMax: 100,
  ideologyMin: -100,
  ideologyMax: 100,
  autosaveDebounceMs: 100,
} as const;
