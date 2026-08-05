import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { gameContent } from "../src/game/data/index";
import {
  createGame,
  currentEvent,
  resolveCurrentChoice,
  validateGameState,
} from "../src/game/engine/index";
import { hashSeed } from "../src/game/engine/rng";

const requestedRuns = Number.parseInt(process.env.SIM_RUNS ?? "1000", 10);
const runCount = Number.isFinite(requestedRuns)
  ? Math.max(100, Math.min(10_000, requestedRuns))
  : 1_000;

interface PartyMetric {
  runs: number;
  qualifications: number;
  wins: number;
  totalScore: number;
  totalProgression: number;
}

const partyMetrics = Object.fromEntries(
  gameContent.parties.map((party) => [
    party.id,
    {
      runs: 0,
      qualifications: 0,
      wins: 0,
      totalScore: 0,
      totalProgression: 0,
    } satisfies PartyMetric,
  ]),
);
const endings: Record<string, number> = {};
const eventCounts: Record<string, number> = Object.fromEntries(
  gameContent.events.map((event) => [event.id, 0]),
);
const choiceCounts: Record<string, number> = {};
let blockedRuns = 0;
let invalidRuns = 0;
let totalDecisions = 0;

for (let runIndex = 0; runIndex < runCount; runIndex += 1) {
  const party = gameContent.parties[runIndex % gameContent.parties.length];
  const method = gameContent.methods[runIndex % gameContent.methods.length];
  if (!party || !method) throw new Error("La simulation ne dispose pas de parti ou de méthode.");
  const seed = `balance-${runIndex}-${party.id}`;
  let state = createGame(
    { seed, mode: "existing_party", partyId: party.id, methodId: method.id },
    gameContent,
  );
  let guard = 0;
  try {
    while (state.phase !== "finished" && guard < 40) {
      const event = currentEvent(state, gameContent.events);
      eventCounts[event.id] = (eventCounts[event.id] ?? 0) + 1;
      const choiceIndex = hashSeed(`${seed}:choice:${state.decisionIndex}`) % event.choices.length;
      const choice = event.choices[choiceIndex];
      if (!choice) throw new Error(`Choix automatique absent pour ${event.id}`);
      choiceCounts[choice.id] = (choiceCounts[choice.id] ?? 0) + 1;
      state = resolveCurrentChoice(state, choice.id, gameContent).state;
      guard += 1;
    }
  } catch (error) {
    blockedRuns += 1;
    console.error(
      `Simulation bloquée ${seed}: ${error instanceof Error ? error.message : String(error)}`,
    );
    continue;
  }
  if (state.phase !== "finished") blockedRuns += 1;
  const validation = validateGameState(state);
  if (!validation.valid) invalidRuns += 1;
  const result = state.finalResult;
  if (!result) continue;
  const metric = partyMetrics[party.id];
  if (!metric) continue;
  metric.runs += 1;
  metric.qualifications += Number(result.qualified);
  metric.wins += Number(result.won);
  metric.totalScore += result.score;
  metric.totalProgression += result.pollingProgression;
  endings[result.endingId] = (endings[result.endingId] ?? 0) + 1;
  totalDecisions += state.decisionIndex;
}

const byParty = Object.fromEntries(
  Object.entries(partyMetrics).map(([partyId, metric]) => [
    partyId,
    {
      runs: metric.runs,
      qualificationRate: metric.runs ? metric.qualifications / metric.runs : 0,
      winRate: metric.runs ? metric.wins / metric.runs : 0,
      averageScore: metric.runs ? metric.totalScore / metric.runs : 0,
      averageProgression: metric.runs ? metric.totalProgression / metric.runs : 0,
    },
  ]),
);
const unseenEvents = Object.entries(eventCounts)
  .filter(([, count]) => count === 0)
  .map(([id]) => id);
const rareTriggered = gameContent.events
  .filter((event) => ["rare", "legendary", "secret"].includes(event.rarity))
  .reduce((sum, event) => sum + (eventCounts[event.id] ?? 0), 0);
const totalEvents = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);
const report = {
  generatedAt: new Date().toISOString(),
  runCount,
  byParty,
  endings,
  rareEventRate: totalEvents ? rareTriggered / totalEvents : 0,
  unseenEvents,
  choiceCounts,
  blockedRuns,
  invalidRuns,
  blockedRate: blockedRuns / runCount,
  averageDecisions: runCount ? totalDecisions / runCount : 0,
  alerts: [
    ...(blockedRuns > 0 ? [`${blockedRuns} parties bloquées`] : []),
    ...(invalidRuns > 0 ? [`${invalidRuns} états invalides`] : []),
    ...(unseenEvents.length > gameContent.events.length * 0.45
      ? [`${unseenEvents.length} événements jamais déclenchés`]
      : []),
    ...Object.entries(byParty)
      .filter(([, metrics]) => metrics.winRate > 0.75)
      .map(([partyId]) => `${partyId} gagne plus de 75 % de ses campagnes`),
  ],
};

await mkdir(resolve("reports"), { recursive: true });
await writeFile(
  resolve("reports", "simulation-latest.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

console.log(`Simulations : ${runCount}`);
console.table(byParty);
console.log(`Durée moyenne : ${report.averageDecisions.toFixed(2)} décisions`);
console.log(`Événements rares : ${(report.rareEventRate * 100).toFixed(3)} %`);
console.log(
  `Bloquées : ${blockedRuns}; invalides : ${invalidRuns}; événements jamais vus : ${unseenEvents.length}`,
);
if (report.alerts.length) console.warn(`Alertes : ${report.alerts.join(" | ")}`);
else console.log("Aucun seuil d’alerte franchi.");

if (blockedRuns > 0 || invalidRuns > 0) process.exitCode = 1;
