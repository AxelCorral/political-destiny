/**
 * Gameplay audit — corpus generator (PROMPT_CLAUDE_CODE_AUDIT_GAMEPLAY_FUN.md
 * sections 5-6). Runs the REAL production engine headlessly
 * (createGame/currentEvent/resolveCurrentChoice), never a reimplementation of
 * the rules. Captures richer per-decision data than the statistical audit
 * pipeline (poll before/after, phase, event importance, a heuristic dramatic
 * intensity score) needed for a qualitative gameplay read, not another η²
 * pass. No paid API, no external LLM call — this script only ever calls the
 * local deterministic engine.
 *
 * Outputs (audit-results/gameplay/):
 *   runs.csv       one row per completed game
 *   choices.csv    one row per decision (the full transcript)
 *   polls.csv      one row per poll snapshot encountered
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
import { AGENT_NAMES, type AgentName, pickChoice } from "../audit-post/lib/agents";
import { CUSTOM_PARTY_PROFILES } from "../audit-post/lib/custom-profiles";
import { toCsv } from "../audit-post/lib/csv";
import { EXTRA_CUSTOM_PROFILES } from "./lib/extra-profiles";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT_DIR = resolve(ROOT, "audit-results/gameplay");

const SEEDS_PER_COMBO = Math.max(
  2,
  Math.min(30, Number.parseInt(process.env.GAMEPLAY_SEEDS_PER_COMBO ?? "4", 10) || 4),
);
const EXISTING_PARTIES = gameContent.parties.filter((p) => p.isRealOrganization);
const ALL_CUSTOM_PROFILES = [...CUSTOM_PARTY_PROFILES, ...EXTRA_CUSTOM_PROFILES];

function importanceScore(importance: string | undefined): number {
  switch (importance) {
    case "decisive":
      return 6;
    case "major":
      return 5;
    default:
      return 0;
  }
}

/**
 * Heuristic dramatic-intensity estimate (section 11): combines the
 * content-authored `importance` field (when set) with category, effect
 * count/magnitude, and structural milestones (chain step, rare event). This
 * is a proxy, not a substitute for the manual qualitative pass done
 * separately on the 50 sampled timelines (section 41 of the mission) — the
 * report treats it explicitly as a computed signal, not a verified score.
 */
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

interface RunRow {
  runKey: string;
  partyId: string;
  partyProfile: string;
  partyKind: "existing" | "custom";
  agent: AgentName;
  seedIndex: number;
  seed: string;
  methodId: string;
  decisions: number;
  phaseAtEnd: string;
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
  achievementsCount: number;
  alliancesFormed: number;
  candidateReplacements: number;
  actorMemoryEntries: number;
  statementCount: number;
  contradictionCount: number;
  narrativeThreadsStarted: number;
  narrativeThreadsResolved: number;
  narrativeThreadsFailed: number;
  ideologyMovementTotal: number;
  rareEventEncountered: boolean;
  secondRoundReached: boolean;
  hasChainEvent: boolean;
  hasOpponentConflict: boolean;
  isComeback: boolean;
  isCollapse: boolean;
  resultCategory: string;
  bestDecisionIndex: number | "";
  costliestDecisionIndex: number | "";
}

interface ChoiceRow {
  runKey: string;
  partyId: string;
  partyProfile: string;
  partyKind: "existing" | "custom";
  agent: AgentName;
  seedIndex: number;
  decisionIndex: number;
  date: string;
  phase: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  eventImportance: string;
  optionsCount: number;
  choiceId: string;
  choiceLabel: string;
  choiceTag: string;
  choiceStrategy: string;
  outcomeId: string;
  outcomeTitle: string;
  narrative: string;
  narrativeLength: number;
  visibleEffectsCount: number;
  decisiveFactorsCount: number;
  statementEvolution: string;
  pollBefore: number;
  pollAfter: number;
  pollDelta: number;
  rankBefore: number;
  rankAfter: number;
  intensityEstimate: number;
  isChain: boolean;
  isRare: boolean;
}

interface PollRow {
  runKey: string;
  decisionIndex: number;
  date: string;
  playerPolling: number;
  playerRank: number;
  playerTrend: number;
}

function playerRank(state: GameState): number {
  const own = state.parties[state.playerPartyId]?.stats.polling ?? 0;
  const higher = Object.values(state.parties).filter(
    (p) => p.active && p.id !== state.playerPartyId && p.stats.polling > own,
  ).length;
  return higher + 1;
}

function classifyResult(run: RunRow): string {
  if (run.isComeback) return "remontee_spectaculaire";
  if (run.isCollapse) return "effondrement";
  if (!run.qualified) return "elimination_precoce";
  if (run.won && run.secondRoundScore !== "" && Number(run.secondRoundScore) >= 56)
    return "victoire_confortable";
  if (run.won) return "victoire_serree";
  if (run.secondRoundReached && run.secondRoundScore !== "" && Number(run.secondRoundScore) >= 46)
    return "defaite_serree";
  return "defaite_lourde";
}

function runOneGame(
  partyId: string,
  partyKind: "existing" | "custom",
  agent: AgentName,
  seedIndex: number,
  seedPrefix: string,
  customDefinition?: (typeof gameContent.parties)[number],
  // buildCustomParty() hard-codes id: "custom_party" for every profile (see
  // src/game/data/customParty.ts) — a real finding reported in section 24 of
  // GAMEPLAY_AUDIT.md, not fixed here. Without a distinct tag, every custom
  // profile's runKey would collide (all share partyId "custom_party"); this
  // tag keeps rows joinable across runs.csv/choices.csv/polls.csv.
  profileTag: string = partyId,
): { run: RunRow; choices: ChoiceRow[]; polls: PollRow[] } | undefined {
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
  const runKey = `${profileTag}:${agent}:${seedIndex}`;
  const choices: ChoiceRow[] = [];
  const polls: PollRow[] = [];
  let alliancesFormed = 0;
  let guard = 0;
  let minPolling = startingPolling;
  let maxPolling = startingPolling;
  const chainEventIds = new Set(gameContent.events.filter((e) => e.chain).map((e) => e.id));
  const rareEventIds = new Set(
    gameContent.events
      .filter((e) => e.rarity === "rare" || e.rarity === "legendary" || e.rarity === "secret")
      .map((e) => e.id),
  );
  let rareEventEncountered = false;

  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const beforePolling = state.parties[partyId]?.stats.polling ?? 0;
    const beforeRank = playerRank(state);
    const choice = pickChoice(state, event, agent, seed);
    const resolution = resolveCurrentChoice(state, choice.id, gameContent);
    state = resolution.state;
    const afterPolling = state.parties[partyId]?.stats.polling ?? 0;
    const afterRank = playerRank(state);
    minPolling = Math.min(minPolling, afterPolling);
    maxPolling = Math.max(maxPolling, afterPolling);
    const record = state.decisionHistory[state.decisionHistory.length - 1];
    if (record) {
      const isRare = rareEventIds.has(event.id);
      if (isRare) rareEventEncountered = true;
      const isChain = chainEventIds.has(event.id);
      choices.push({
        runKey,
        partyId,
        partyProfile: profileTag,
        partyKind,
        agent,
        seedIndex,
        decisionIndex: record.decisionIndex,
        date: record.date,
        phase: state.phase,
        eventId: event.id,
        eventTitle: event.title,
        eventCategory: event.category,
        eventImportance: event.importance ?? "",
        optionsCount: event.choices.length,
        choiceId: record.choiceId,
        choiceLabel: record.choiceLabel,
        choiceTag: record.choiceTag ?? "",
        choiceStrategy: record.choiceStrategy ?? "",
        outcomeId: record.outcomeId,
        outcomeTitle: record.outcomeTitle,
        narrative: record.narrative,
        narrativeLength: record.narrative.length,
        visibleEffectsCount: record.visibleEffects.length,
        decisiveFactorsCount: record.decisiveFactors?.length ?? 0,
        statementEvolution: record.statementEvolution ?? "",
        pollBefore: Number(beforePolling.toFixed(2)),
        pollAfter: Number(afterPolling.toFixed(2)),
        pollDelta: Number((afterPolling - beforePolling).toFixed(2)),
        rankBefore: beforeRank,
        rankAfter: afterRank,
        intensityEstimate: estimateIntensity(
          event.category,
          event.importance,
          record.visibleEffects.length,
          isRare,
          isChain,
        ),
        isChain,
        isRare,
      });
      polls.push({
        runKey,
        decisionIndex: record.decisionIndex,
        date: record.date,
        playerPolling: afterPolling,
        playerRank: afterRank,
        playerTrend: Number((afterPolling - beforePolling).toFixed(2)),
      });
    }
    guard += 1;
  }

  if (state.phase !== "finished" || !state.finalResult) return undefined;
  alliancesFormed = Object.values(state.parties).filter((p) =>
    p.alliedWith.includes(state.playerPartyId),
  ).length;
  const validation = validateGameState(state);
  if (!validation.valid) return undefined;

  const threads = Object.values(state.narrativeThreads);
  const endIdeology = state.parties[partyId]?.ideology ?? startIdeology;
  const ideologyMovementTotal = (
    Object.keys(startIdeology) as Array<keyof typeof startIdeology>
  ).reduce(
    (sum, axis) => sum + Math.abs((endIdeology[axis] ?? startIdeology[axis]) - startIdeology[axis]),
    0,
  );
  const hasOpponentConflict = Object.values(state.partyRelations[partyId] ?? {}).some(
    (value) => value <= -25,
  );
  const firstRoundScore = state.firstRoundResult?.results[partyId] ?? startingPolling;
  const isComeback = firstRoundScore - startingPolling >= 8;
  const isCollapse = maxPolling - firstRoundScore >= 7 || startingPolling - firstRoundScore >= 6;
  const run: RunRow = {
    runKey,
    partyId,
    partyProfile: profileTag,
    partyKind,
    agent,
    seedIndex,
    seed,
    methodId: method.id,
    decisions: state.decisionIndex,
    phaseAtEnd: state.phase,
    qualified: state.finalResult.qualified,
    won: state.finalResult.won,
    endingId: state.endingId ?? "",
    finalScore: state.finalResult.score,
    firstRoundScore: state.firstRoundResult?.results[partyId] ?? 0,
    secondRoundScore: state.secondRoundResult?.results[partyId] ?? "",
    progressionNormalized: state.finalResult.progressionNormalized,
    startingPolling,
    playerRank: state.finalResult.playerRank,
    rivalPartyId: state.finalResult.rivalPartyId,
    achievementsCount: state.achievementsUnlocked.length,
    alliancesFormed,
    candidateReplacements: state.opponentActions.filter((a) => a.kind === "replacement").length,
    actorMemoryEntries: state.actorMemories.length,
    statementCount: state.statementLedger.length,
    contradictionCount: state.statementLedger.filter((s) => s.evolution === "contradiction").length,
    narrativeThreadsStarted: threads.length,
    narrativeThreadsResolved: threads.filter((t) => t.status === "resolved").length,
    narrativeThreadsFailed: threads.filter((t) => t.status === "failed").length,
    ideologyMovementTotal: Number(ideologyMovementTotal.toFixed(1)),
    rareEventEncountered,
    secondRoundReached: !!state.secondRoundResult,
    hasChainEvent: choices.some((c) => c.isChain),
    hasOpponentConflict,
    isComeback,
    isCollapse,
    resultCategory: "",
    bestDecisionIndex: state.finalResult.bestDecisionIndex ?? "",
    costliestDecisionIndex: state.finalResult.costliestDecisionIndex ?? "",
  };
  run.resultCategory = classifyResult(run);

  return { run, choices, polls };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const runs: RunRow[] = [];
  const choices: ChoiceRow[] = [];
  const polls: PollRow[] = [];
  let attempted = 0;
  let failed = 0;

  for (const party of EXISTING_PARTIES) {
    for (const agent of AGENT_NAMES) {
      for (let seedIndex = 0; seedIndex < SEEDS_PER_COMBO; seedIndex += 1) {
        attempted += 1;
        const result = runOneGame(party.id, "existing", agent, seedIndex, "gameplay-audit");
        if (!result) {
          failed += 1;
          continue;
        }
        runs.push(result.run);
        choices.push(...result.choices);
        polls.push(...result.polls);
      }
    }
  }

  const CUSTOM_AGENTS: AgentName[] = ["prudent", "aleatoire", "ideologiquement_coherent", "risque"];
  for (const profile of ALL_CUSTOM_PROFILES) {
    for (const agent of CUSTOM_AGENTS) {
      for (let seedIndex = 0; seedIndex < 3; seedIndex += 1) {
        attempted += 1;
        const result = runOneGame(
          profile.definition.id,
          "custom",
          agent,
          seedIndex,
          `gameplay-audit-custom-${profile.id}`,
          profile.definition,
          profile.id,
        );
        if (!result) {
          failed += 1;
          continue;
        }
        runs.push(result.run);
        choices.push(...result.choices);
        polls.push(...result.polls);
      }
    }
  }

  // Targeted supplementary search: guarantee at least a handful of runs in
  // every outcome bucket the mission requires (section 6), even if the base
  // grid under-samples a rare category (comeback, collapse, alliance...).
  const bucketCounts = new Map<string, number>();
  for (const r of runs)
    bucketCounts.set(r.resultCategory, (bucketCounts.get(r.resultCategory) ?? 0) + 1);
  const REQUIRED_BUCKETS = [
    "victoire_confortable",
    "victoire_serree",
    "defaite_serree",
    "defaite_lourde",
    "elimination_precoce",
    "remontee_spectaculaire",
    "effondrement",
  ];
  for (const bucket of REQUIRED_BUCKETS) {
    let extraSeed = 1000;
    let guardAttempts = 0;
    while ((bucketCounts.get(bucket) ?? 0) < 3 && guardAttempts < 120) {
      guardAttempts += 1;
      const party = EXISTING_PARTIES[extraSeed % EXISTING_PARTIES.length]!;
      const agent = AGENT_NAMES[extraSeed % AGENT_NAMES.length]!;
      attempted += 1;
      const result = runOneGame(party.id, "existing", agent, extraSeed, "gameplay-audit-search");
      extraSeed += 1;
      if (!result) {
        failed += 1;
        continue;
      }
      if (result.run.resultCategory === bucket) {
        runs.push(result.run);
        choices.push(...result.choices);
        polls.push(...result.polls);
        bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
      }
    }
  }

  await writeFile(
    resolve(OUT_DIR, "runs.csv"),
    toCsv(runs as unknown as Record<string, unknown>[]),
    "utf8",
  );
  await writeFile(
    resolve(OUT_DIR, "choices.csv"),
    toCsv(choices as unknown as Record<string, unknown>[]),
    "utf8",
  );
  await writeFile(
    resolve(OUT_DIR, "polls.csv"),
    toCsv(polls as unknown as Record<string, unknown>[]),
    "utf8",
  );

  const outcomeSummary = Object.fromEntries(bucketCounts.entries());
  console.log(
    JSON.stringify(
      {
        totalRuns: runs.length,
        attempted,
        failed,
        totalDecisions: choices.length,
        existingPartyRuns: runs.filter((r) => r.partyKind === "existing").length,
        customPartyRuns: runs.filter((r) => r.partyKind === "custom").length,
        outcomeSummary,
        raresEncountered: runs.filter((r) => r.rareEventEncountered).length,
        secondRoundRuns: runs.filter((r) => r.secondRoundReached).length,
        alliancesRuns: runs.filter((r) => r.alliancesFormed > 0).length,
      },
      null,
      2,
    ),
  );
}

await main();
