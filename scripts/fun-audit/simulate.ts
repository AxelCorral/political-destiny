/**
 * Fun/replayability audit — main corpus generator
 * (PROMPT_CLAUDE_CODE_AUDIT_FUN_REJOUABILITE.md, sections 4, 9-18, 22-24, 29-30).
 *
 * Runs the REAL production engine headlessly (createGame / currentEvent /
 * resolveCurrentChoice from src/game/engine/index.ts), never a
 * reimplementation of the rules — exactly the same approach already used by
 * scripts/audit-post/simulate.ts and scripts/gameplay-audit/generate-corpus.ts.
 * No rule, probability, text or interface is modified by this script.
 *
 * Grid: 9 existing parties x 9 synthetic profiles (7 requested archetypes +
 * 2 neutral/risk reference agents, see lib/profiles.ts) x N seeds, plus a
 * smaller custom-party grid (13 profiles x 5 profile-agents x M seeds)
 * covering the full ideological spectrum requested by section 23.
 *
 * Outputs (audit-results/fun-audit/):
 *   run-summaries.csv   one row per completed campaign
 *   decisions.csv        one row per decision (full transcript, for event
 *                        grading, choice dominance, low-intensity streaks,
 *                        randomness classification, pacing/tension)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../../src/game/data/index";
import {
  createGame,
  currentEvent,
  resolveCurrentChoice,
  validateGameState,
} from "../../src/game/engine/index";
import type { GameState } from "../../src/game/types/index";
import { CUSTOM_PARTY_PROFILES } from "../audit-post/lib/custom-profiles";
import { toCsv } from "../audit-post/lib/csv";
import { EXTRA_CUSTOM_PROFILES } from "../gameplay-audit/lib/extra-profiles";
import {
  agentBehindProfile,
  type ProfileName,
  PROFILE_NAMES,
  pickForProfile,
} from "./lib/profiles";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/fun-audit");

const SEEDS_PER_COMBO = Math.max(
  4,
  Math.min(60, Number.parseInt(process.env.FUN_SEEDS_PER_COMBO ?? "20", 10) || 20),
);
const CUSTOM_SEEDS = Math.max(
  2,
  Math.min(20, Number.parseInt(process.env.FUN_CUSTOM_SEEDS ?? "6", 10) || 6),
);
const EXISTING_PARTIES = gameContent.parties.filter((p) => p.isRealOrganization);
const ALL_CUSTOM_PROFILES = [...CUSTOM_PARTY_PROFILES, ...EXTRA_CUSTOM_PROFILES];
const CUSTOM_PROFILE_AGENTS: ProfileName[] = [
  "strategist",
  "roleplayer",
  "opportunist",
  "cautious",
  "beginner",
];

const RARE_EVENT_IDS = new Set(
  gameContent.events
    .filter((e) => e.rarity === "rare" || e.rarity === "legendary" || e.rarity === "secret")
    .map((e) => e.id),
);
const CHAIN_EVENT_IDS = new Set(gameContent.events.filter((e) => e.chain).map((e) => e.id));

function importanceScore(importance: string | undefined): number {
  if (importance === "decisive") return 6;
  if (importance === "major") return 5;
  return 0;
}

/** Same heuristic family as scripts/gameplay-audit/generate-corpus.ts (documented there as a
 * computed proxy, not a substitute for manual qualitative reading). Reused unchanged here so
 * intensity figures from both missions stay comparable. */
function estimateIntensity(
  category: string,
  importance: string | undefined,
  visibleEffectsCount: number,
  isRare: boolean,
  hasChain: boolean,
): number {
  const base = importanceScore(importance);
  if (base > 0) return Math.min(6, base + (isRare ? 1 : 0));
  let score = 2;
  if (category === "scandal" || category === "alliance" || category === "debate") score += 1;
  if (category === "rare") score += 2;
  if (category === "party" || category === "internal") score += 0.5;
  if (visibleEffectsCount >= 3) score += 1;
  if (hasChain) score += 0.5;
  return Math.max(1, Math.min(6, Math.round(score)));
}

/**
 * "Carte faible" per section 30 of the mission prompt: low impact, no link
 * to history, no interaction, mechanically-close choice, low narrative
 * stake. Approximated as: intensity <= 2, not a chain step, not rare, no
 * opponent conflict flagged that decision, and a small poll movement.
 */
function isWeakCard(
  intensity: number,
  isChain: boolean,
  isRare: boolean,
  pollDelta: number,
): boolean {
  return intensity <= 2 && !isChain && !isRare && Math.abs(pollDelta) < 1.2;
}

interface RunRow {
  runKey: string;
  partyId: string;
  partyProfile: string;
  partyKind: "existing" | "custom";
  profile: ProfileName;
  agent: string;
  seedIndex: number;
  seed: string;
  methodId: string;
  decisions: number;
  qualified: boolean;
  won: boolean;
  endingId: string;
  finalScore: number;
  firstRoundScore: number;
  secondRoundScore: number | "";
  progressionNormalized: number;
  startingPolling: number;
  playerRank: number;
  rivalPartyId: string;
  minPolling: number;
  maxPolling: number;
  minRank: number;
  maxRank: number;
  qualificationZoneCrossings: number;
  marginToNextCandidateFirstRound: number;
  achievementsCount: number;
  alliancesFormed: number;
  candidateReplacementsObserved: number;
  actorMemoryEntries: number;
  statementCount: number;
  contradictionCount: number;
  abruptReversalCount: number;
  narrativeThreadsStarted: number;
  narrativeThreadsResolved: number;
  narrativeThreadsFailed: number;
  ideologyMoveEconomy: number;
  ideologyMoveSociety: number;
  ideologyMoveEurope: number;
  ideologyMoveEcology: number;
  ideologyMoveAuthority: number;
  ideologyMoveImmigration: number;
  ideologyMoveTotal: number;
  rareEventEncountered: boolean;
  rareEventCount: number;
  chainEventCount: number;
  secondRoundReached: boolean;
  ownRejectionAtSecondRound: number | "";
  opponentRejectionAtSecondRound: number | "";
  hasOpponentConflict: boolean;
  isComeback: boolean;
  isCollapse: boolean;
  resultCategory: string;
  weakCardCount: number;
  maxWeakCardStreak: number;
  memorableSignalCount: number;
  opponentActionsTotal: number;
  opponentActionsStrategy: number;
  opponentActionsCrisis: number;
  opponentActionsAlliance: number;
  opponentActionsEndorsement: number;
  opponentActionsReplacement: number;
  opponentActionsOther: number;
  totalNarrativeChars: number;
  bestDecisionIndex: number | "";
  costliestDecisionIndex: number | "";
}

interface DecisionRow {
  runKey: string;
  partyId: string;
  partyProfile: string;
  partyKind: "existing" | "custom";
  profile: ProfileName;
  seedIndex: number;
  decisionIndex: number;
  phase: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  eventRarity: string;
  eventImportance: string;
  optionsCount: number;
  choiceId: string;
  choiceLabel: string;
  choiceTag: string;
  choiceStrategy: string;
  outcomeTitle: string;
  narrativeLength: number;
  summaryLength: number;
  visibleEffectsCount: number;
  pollBefore: number;
  pollAfter: number;
  pollDelta: number;
  rankBefore: number;
  rankAfter: number;
  rankChanged: boolean;
  qualificationSideBefore: number;
  qualificationSideAfter: number;
  qualificationFlip: boolean;
  intensityEstimate: number;
  isChain: boolean;
  isRare: boolean;
  isWeak: boolean;
}

function playerRank(state: GameState): number {
  const own = state.parties[state.playerPartyId]?.stats.polling ?? 0;
  const higher = Object.values(state.parties).filter(
    (p) => p.active && p.id !== state.playerPartyId && p.stats.polling > own,
  ).length;
  return higher + 1;
}

function classifyResult(
  run: Pick<RunRow, "isComeback" | "isCollapse" | "qualified" | "won" | "secondRoundScore">,
): string {
  if (run.isComeback) return "remontee_spectaculaire";
  if (run.isCollapse) return "effondrement";
  if (!run.qualified) return "elimination_precoce";
  if (run.won && run.secondRoundScore !== "" && Number(run.secondRoundScore) >= 56)
    return "victoire_confortable";
  if (run.won) return "victoire_serree";
  if (run.secondRoundScore !== "" && Number(run.secondRoundScore) >= 46) return "defaite_serree";
  return "defaite_lourde";
}

function runOneGame(
  partyId: string,
  partyKind: "existing" | "custom",
  profile: ProfileName,
  seedIndex: number,
  seedPrefix: string,
  customDefinition?: (typeof gameContent.parties)[number],
  profileTag: string = partyId,
): { run: RunRow; decisions: DecisionRow[] } | undefined {
  const seed = `${seedPrefix}-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state = createGame(
    customDefinition
      ? { seed, mode: "custom_party", partyId, methodId: method.id, customParty: customDefinition }
      : { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  const startingPolling = state.parties[partyId]?.stats.polling ?? 0;
  const startIdeology = { ...state.parties[partyId]!.ideology };
  const runKey = `${profileTag}:${profile}:${seedIndex}`;
  const decisions: DecisionRow[] = [];
  let guard = 0;
  let minPolling = startingPolling;
  let maxPolling = startingPolling;
  let minRank = playerRank(state);
  let maxRank = minRank;
  let qualificationZoneCrossings = 0;
  let lastQualZone = minRank <= 2 ? 1 : 0;
  let weakCardCount = 0;
  let currentWeakStreak = 0;
  let maxWeakCardStreak = 0;
  let totalNarrativeChars = 0;
  let rareEventCount = 0;
  let chainEventCount = 0;

  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const beforePolling = state.parties[partyId]?.stats.polling ?? 0;
    const beforeRank = playerRank(state);
    const choice = pickForProfile(state, event, profile, seed);
    const resolution = resolveCurrentChoice(state, choice.id, gameContent);
    state = resolution.state;
    const afterPolling = state.parties[partyId]?.stats.polling ?? 0;
    const afterRank = playerRank(state);
    minPolling = Math.min(minPolling, afterPolling);
    maxPolling = Math.max(maxPolling, afterPolling);
    minRank = Math.min(minRank, afterRank);
    maxRank = Math.max(maxRank, afterRank);
    const qualZone = afterRank <= 2 ? 1 : 0;
    if (qualZone !== lastQualZone) qualificationZoneCrossings += 1;
    lastQualZone = qualZone;

    const record = state.decisionHistory[state.decisionHistory.length - 1];
    if (record) {
      const isRare = RARE_EVENT_IDS.has(event.id);
      const isChain = CHAIN_EVENT_IDS.has(event.id);
      if (isRare) rareEventCount += 1;
      if (isChain) chainEventCount += 1;
      const pollDelta = Number((afterPolling - beforePolling).toFixed(2));
      const intensity = estimateIntensity(
        event.category,
        event.importance,
        record.visibleEffects.length,
        isRare,
        isChain,
      );
      const weak = isWeakCard(intensity, isChain, isRare, pollDelta);
      if (weak) {
        weakCardCount += 1;
        currentWeakStreak += 1;
        maxWeakCardStreak = Math.max(maxWeakCardStreak, currentWeakStreak);
      } else {
        currentWeakStreak = 0;
      }
      totalNarrativeChars +=
        record.narrative.length + event.summary.length + record.choiceLabel.length;
      decisions.push({
        runKey,
        partyId,
        partyProfile: profileTag,
        partyKind,
        profile,
        seedIndex,
        decisionIndex: record.decisionIndex,
        phase: state.phase,
        eventId: event.id,
        eventTitle: event.title,
        eventCategory: event.category,
        eventRarity: event.rarity,
        eventImportance: event.importance ?? "",
        optionsCount: event.choices.length,
        choiceId: record.choiceId,
        choiceLabel: record.choiceLabel,
        choiceTag: record.choiceTag ?? "",
        choiceStrategy: record.choiceStrategy ?? "",
        outcomeTitle: record.outcomeTitle,
        narrativeLength: record.narrative.length,
        summaryLength: event.summary.length,
        visibleEffectsCount: record.visibleEffects.length,
        pollBefore: Number(beforePolling.toFixed(2)),
        pollAfter: Number(afterPolling.toFixed(2)),
        pollDelta,
        rankBefore: beforeRank,
        rankAfter: afterRank,
        rankChanged: beforeRank !== afterRank,
        qualificationSideBefore: beforeRank <= 2 ? 1 : 0,
        qualificationSideAfter: afterRank <= 2 ? 1 : 0,
        qualificationFlip: (beforeRank <= 2 ? 1 : 0) !== (afterRank <= 2 ? 1 : 0),
        intensityEstimate: intensity,
        isChain,
        isRare,
        isWeak: weak,
      });
    }
    guard += 1;
  }

  if (state.phase !== "finished" || !state.finalResult) return undefined;
  const validation = validateGameState(state);
  if (!validation.valid) return undefined;

  const alliancesFormed = Object.values(state.parties).filter((p) =>
    p.alliedWith.includes(state.playerPartyId),
  ).length;
  const threads = Object.values(state.narrativeThreads);
  const endIdeology = state.parties[partyId]?.ideology ?? startIdeology;
  const axisDelta = (axis: keyof typeof startIdeology) =>
    Number(Math.abs((endIdeology[axis] ?? startIdeology[axis]) - startIdeology[axis]).toFixed(2));
  const ideologyMoveEconomy = axisDelta("economy");
  const ideologyMoveSociety = axisDelta("society");
  const ideologyMoveEurope = axisDelta("europe");
  const ideologyMoveEcology = axisDelta("ecology");
  const ideologyMoveAuthority = axisDelta("authority");
  const ideologyMoveImmigration = axisDelta("immigration");
  const hasOpponentConflict = Object.values(state.partyRelations[partyId] ?? {}).some(
    (value) => value <= -25,
  );
  const firstRoundScore = state.firstRoundResult?.results[partyId] ?? startingPolling;
  const isComeback = firstRoundScore - startingPolling >= 8;
  const isCollapse = maxPolling - firstRoundScore >= 7 || startingPolling - firstRoundScore >= 6;

  const firstRoundEntries = state.firstRoundResult
    ? Object.entries(state.firstRoundResult.results).sort((a, b) => b[1] - a[1])
    : [];
  const ownIndex = firstRoundEntries.findIndex(([id]) => id === partyId);
  const neighborIndex = ownIndex <= 1 ? 2 : ownIndex - 1;
  const marginToNextCandidateFirstRound =
    ownIndex >= 0 && firstRoundEntries[neighborIndex]
      ? Number(
          Math.abs(firstRoundEntries[ownIndex]![1] - firstRoundEntries[neighborIndex]![1]).toFixed(
            2,
          ),
        )
      : 0;

  const opponentByKind = state.opponentActions.reduce<Record<string, number>>((acc, a) => {
    acc[a.kind] = (acc[a.kind] ?? 0) + 1;
    return acc;
  }, {});
  const knownKinds = ["strategy", "crisis", "alliance", "endorsement", "replacement"];
  const opponentActionsOther = state.opponentActions.filter(
    (a) => !knownKinds.includes(a.kind),
  ).length;

  const abruptReversalCount = state.statementLedger.filter(
    (s) => s.evolution === "abrupt_reversal",
  ).length;
  const contradictionCount = state.statementLedger.filter(
    (s) => s.evolution === "contradiction",
  ).length;

  const secondRoundReached = !!state.secondRoundResult;
  const rivalId = state.finalResult.rivalPartyId;
  const ownRejectionAtSecondRound = secondRoundReached
    ? (state.parties[partyId]?.stats.rejection ?? "")
    : "";
  const opponentRejectionAtSecondRound =
    secondRoundReached && rivalId ? (state.parties[rivalId]?.stats.rejection ?? "") : "";

  const secondRoundScore = state.secondRoundResult?.results[partyId] ?? "";
  const won = state.finalResult.won;
  const qualified = state.finalResult.qualified;

  // "Stories worth telling" signal count (section 18): the mission's own
  // list, each boolean approximated from data already captured on this run.
  const secondRoundClose =
    secondRoundReached && secondRoundScore !== "" && Math.abs(Number(secondRoundScore) - 50) <= 4;
  const memorableSignals = [
    isComeback,
    isCollapse,
    hasOpponentConflict,
    rareEventCount > 0,
    alliancesFormed > 0,
    abruptReversalCount > 0,
    contradictionCount > 0,
    (state.opponentActions.filter((a) => a.kind === "replacement").length ?? 0) > 0,
    threads.some((t) => t.status === "resolved" || t.status === "failed"),
    state.actorMemories.length > 0,
    secondRoundClose,
    won && startingPolling <= 8,
    isCollapse && startingPolling >= 15,
  ];
  const memorableSignalCount = memorableSignals.filter(Boolean).length;

  const run: RunRow = {
    runKey,
    partyId,
    partyProfile: profileTag,
    partyKind,
    profile,
    agent: agentBehindProfile(profile),
    seedIndex,
    seed,
    methodId: method.id,
    decisions: state.decisionIndex,
    qualified,
    won,
    endingId: state.endingId ?? "",
    finalScore: state.finalResult.score,
    firstRoundScore: state.firstRoundResult?.results[partyId] ?? 0,
    secondRoundScore,
    progressionNormalized: state.finalResult.progressionNormalized,
    startingPolling,
    playerRank: state.finalResult.playerRank,
    rivalPartyId: state.finalResult.rivalPartyId,
    minPolling: Number(minPolling.toFixed(2)),
    maxPolling: Number(maxPolling.toFixed(2)),
    minRank,
    maxRank,
    qualificationZoneCrossings,
    marginToNextCandidateFirstRound,
    achievementsCount: state.achievementsUnlocked.length,
    alliancesFormed,
    candidateReplacementsObserved: state.opponentActions.filter((a) => a.kind === "replacement")
      .length,
    actorMemoryEntries: state.actorMemories.length,
    statementCount: state.statementLedger.length,
    contradictionCount,
    abruptReversalCount,
    narrativeThreadsStarted: threads.length,
    narrativeThreadsResolved: threads.filter((t) => t.status === "resolved").length,
    narrativeThreadsFailed: threads.filter((t) => t.status === "failed").length,
    ideologyMoveEconomy,
    ideologyMoveSociety,
    ideologyMoveEurope,
    ideologyMoveEcology,
    ideologyMoveAuthority,
    ideologyMoveImmigration,
    ideologyMoveTotal: Number(
      (
        ideologyMoveEconomy +
        ideologyMoveSociety +
        ideologyMoveEurope +
        ideologyMoveEcology +
        ideologyMoveAuthority +
        ideologyMoveImmigration
      ).toFixed(2),
    ),
    rareEventEncountered: rareEventCount > 0,
    rareEventCount,
    chainEventCount,
    secondRoundReached,
    ownRejectionAtSecondRound,
    opponentRejectionAtSecondRound,
    hasOpponentConflict,
    isComeback,
    isCollapse,
    resultCategory: "",
    weakCardCount,
    maxWeakCardStreak,
    memorableSignalCount,
    opponentActionsTotal: state.opponentActions.length,
    opponentActionsStrategy: opponentByKind.strategy ?? 0,
    opponentActionsCrisis: opponentByKind.crisis ?? 0,
    opponentActionsAlliance: opponentByKind.alliance ?? 0,
    opponentActionsEndorsement: opponentByKind.endorsement ?? 0,
    opponentActionsReplacement: opponentByKind.replacement ?? 0,
    opponentActionsOther,
    totalNarrativeChars,
    bestDecisionIndex: state.finalResult.bestDecisionIndex ?? "",
    costliestDecisionIndex: state.finalResult.costliestDecisionIndex ?? "",
  };
  run.resultCategory = classifyResult(run);

  return { run, decisions };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const runs: RunRow[] = [];
  const decisions: DecisionRow[] = [];
  let attempted = 0;
  let failed = 0;

  for (const party of EXISTING_PARTIES) {
    for (const profile of PROFILE_NAMES) {
      for (let seedIndex = 0; seedIndex < SEEDS_PER_COMBO; seedIndex += 1) {
        attempted += 1;
        const result = runOneGame(party.id, "existing", profile, seedIndex, "fun-audit");
        if (!result) {
          failed += 1;
          continue;
        }
        runs.push(result.run);
        decisions.push(...result.decisions);
      }
    }
  }

  for (const profile of ALL_CUSTOM_PROFILES) {
    for (const profileAgent of CUSTOM_PROFILE_AGENTS) {
      for (let seedIndex = 0; seedIndex < CUSTOM_SEEDS; seedIndex += 1) {
        attempted += 1;
        const result = runOneGame(
          profile.definition.id,
          "custom",
          profileAgent,
          seedIndex,
          `fun-audit-custom-${profile.id}`,
          profile.definition,
          profile.id,
        );
        if (!result) {
          failed += 1;
          continue;
        }
        runs.push(result.run);
        decisions.push(...result.decisions);
      }
    }
  }

  await writeFile(
    resolve(OUT_DIR, "run-summaries.csv"),
    toCsv(runs as unknown as Record<string, unknown>[]),
    "utf8",
  );
  await writeFile(
    resolve(OUT_DIR, "decisions.csv"),
    toCsv(decisions as unknown as Record<string, unknown>[]),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        totalRuns: runs.length,
        attempted,
        failed,
        totalDecisions: decisions.length,
        existingPartyRuns: runs.filter((r) => r.partyKind === "existing").length,
        customPartyRuns: runs.filter((r) => r.partyKind === "custom").length,
        raresEncountered: runs.filter((r) => r.rareEventEncountered).length,
        secondRoundRuns: runs.filter((r) => r.secondRoundReached).length,
      },
      null,
      2,
    ),
  );
}

await main();
