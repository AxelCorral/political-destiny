/**
 * Fast non-regression smoke test (Phase 0, section 6 of
 * PROMPT_CLAUDE_CODE_CORRECTIONS_POST_AUDIT.md). Meant to run in seconds, not
 * minutes — a small fixed-size simulation plus static catalog checks. Not a
 * replacement for `npm run audit:game`; a tripwire to run between edits.
 *
 * Exits with a non-zero code and a readable failure list if any check fails.
 */
import { gameContent } from "../../src/game/data/index";
import {
  createGame,
  currentEvent,
  resolveCurrentChoice,
  validateGameState,
} from "../../src/game/engine/index";
import type { GameState } from "../../src/game/types/index";
import { pickChoice } from "./lib/agents";

const SEEDS_PER_PARTY = Number.parseInt(process.env.AUDIT_SMOKE_SEEDS ?? "6", 10);
const failures: string[] = [];
const check = (label: string, ok: boolean, detail?: string) => {
  if (!ok) failures.push(detail ? `${label} — ${detail}` : label);
};

// --- Static catalog checks --------------------------------------------------

const events = gameContent.events;
const eventIds = new Set(events.map((e) => e.id));
check("identifiants d'événement uniques", eventIds.size === events.length);

const chainTargetsMissing = events.flatMap((event) =>
  event.choices.flatMap((choice) =>
    choice.outcomeGroups.flatMap((outcome) =>
      (outcome.followUps ?? [])
        .filter((f) => !eventIds.has(f.eventId))
        .map((f) => `${event.id}->${f.eventId}`),
    ),
  ),
);
check(
  "aucune chaîne cassée",
  chainTargetsMissing.length === 0,
  chainTargetsMissing.slice(0, 5).join(", "),
);

const classicTriptych = events.filter((event) => {
  const tags = event.choices.map((c) => c.visibleTag);
  return tags.includes("PRUDENT") && tags.includes("RISQUÉ") && tags.includes("RASSEMBLEUR");
});
check(
  "pas de retour massif du triptyque prudent/risqué/rassembleur (<=5 événements)",
  classicTriptych.length <= 5,
  `${classicTriptych.length} événements`,
);

const falseDilemmaEvents = events.filter((event) => {
  if (event.choices.length < 2) return false;
  const signatures = event.choices.map((choice) =>
    choice.outcomeGroups
      .map((o) => JSON.stringify(o.effects))
      .sort()
      .join("|"),
  );
  return new Set(signatures).size === 1;
});
check(
  "aucun faux dilemme évident (options mécaniquement identiques dans un même événement)",
  falseDilemmaEvents.length === 0,
  falseDilemmaEvents.map((e) => e.id).join(", "),
);

// --- Dynamic checks: small simulation grid ----------------------------------

const PARTIES = gameContent.parties;
const AGENTS = ["aleatoire", "prudent", "ideologiquement_coherent"] as const;

interface RunOutcome {
  state: GameState;
  eventIds: string[];
  outcomeTitles: string[];
  finalSignature: string;
}

function runCampaign(
  partyId: string,
  agent: (typeof AGENTS)[number],
  seedIndex: number,
): RunOutcome {
  const seed = `smoke-${seedIndex}`;
  const method = gameContent.methods[seedIndex % gameContent.methods.length]!;
  let state = createGame(
    { seed, mode: "existing_party", partyId, methodId: method.id },
    gameContent,
  );
  const visited: string[] = [];
  const titles: string[] = [];
  let guard = 0;
  while (state.phase !== "finished" && guard < 60) {
    const event = currentEvent(state, gameContent.events);
    const choice = pickChoice(state, event, agent, seed);
    const resolution = resolveCurrentChoice(state, choice.id, gameContent);
    visited.push(event.id);
    titles.push(resolution.record.outcomeTitle);
    state = resolution.state;
    guard += 1;
  }
  const finalSignature = JSON.stringify(
    state.decisionHistory.map((d) => [d.eventId, d.choiceId, d.outcomeId]),
  );
  return { state, eventIds: visited, outcomeTitles: titles, finalSignature };
}

let validRuns = 0;
let totalRuns = 0;
let runsWithIdeologyMovement = 0;
let runsWithActorMemory = 0;
let repeatedTitleRuns = 0;
let nanOrOutOfBounds = 0;
const reachedEventIds = new Set<string>();

for (const party of PARTIES) {
  for (const agent of AGENTS) {
    for (let seedIndex = 0; seedIndex < SEEDS_PER_PARTY; seedIndex += 1) {
      totalRuns += 1;
      const { state, eventIds, outcomeTitles } = runCampaign(party.id, agent, seedIndex);
      for (const id of eventIds) reachedEventIds.add(id);

      if (state.phase === "finished" && state.finalResult && state.firstRoundResult) validRuns += 1;

      const startIdeology = party.ideology;
      const endIdeology = state.parties[party.id]?.ideology;
      if (endIdeology) {
        const moved = (Object.keys(startIdeology) as Array<keyof typeof startIdeology>).some(
          (axis) => Math.abs(endIdeology[axis] - startIdeology[axis]) > 0.01,
        );
        if (moved) runsWithIdeologyMovement += 1;
      }
      if (state.actorMemories.length > 0) runsWithActorMemory += 1;

      const uniqueTitles = new Set(outcomeTitles);
      if (uniqueTitles.size !== outcomeTitles.length) repeatedTitleRuns += 1;

      const score = state.finalResult?.score;
      if (score !== undefined && (Number.isNaN(score) || score < 0 || score > 100))
        nanOrOutOfBounds += 1;
      const firstRound = Object.values(state.firstRoundResult?.results ?? {});
      if (firstRound.some((v) => Number.isNaN(v) || v < 0 || v > 100)) nanOrOutOfBounds += 1;

      const validation = validateGameState(state);
      if (!validation.valid) nanOrOutOfBounds += 1;
    }
  }
}

check("taux de parties valides = 100%", validRuns === totalRuns, `${validRuns}/${totalRuns}`);
check(
  "idéologie utilisée (>=50% des parties bougent)",
  runsWithIdeologyMovement / totalRuns >= 0.5,
  `${runsWithIdeologyMovement}/${totalRuns}`,
);
check(
  "mémoire d'acteur utilisée (>=30% des parties)",
  runsWithActorMemory / totalRuns >= 0.3,
  `${runsWithActorMemory}/${totalRuns}`,
);
check(
  "aucune répétition de titre d'issue au sein d'une partie",
  repeatedTitleRuns === 0,
  `${repeatedTitleRuns} parties concernées`,
);
check(
  "aucune valeur NaN ou hors bornes",
  nanOrOutOfBounds === 0,
  `${nanOrOutOfBounds} occurrences`,
);

// Determinism: same seed/party/agent must reproduce exactly.
let determinismFailures = 0;
for (const party of PARTIES.slice(0, 3)) {
  const a = runCampaign(party.id, "aleatoire", 0);
  const b = runCampaign(party.id, "aleatoire", 0);
  if (a.finalSignature !== b.finalSignature) determinismFailures += 1;
}
check(
  "déterminisme parfait à seed identique",
  determinismFailures === 0,
  `${determinismFailures} écarts`,
);

const rareEvents = events.filter((e) => ["rare", "legendary", "secret"].includes(e.rarity));
const unreachedRare = rareEvents.filter((e) => !reachedEventIds.has(e.id));
// A small smoke sample won't necessarily reach every rare event — this is
// informational, not a hard failure, unless literally none are reached.
check(
  "au moins un événement rare atteint dans l'échantillon",
  rareEvents.length === 0 || unreachedRare.length < rareEvents.length,
);

console.log(
  JSON.stringify(
    {
      totalRuns,
      validRuns,
      runsWithIdeologyMovement,
      runsWithActorMemory,
      reachedEvents: reachedEventIds.size,
      totalEvents: events.length,
      rareEventsReached: rareEvents.length - unreachedRare.length,
      rareEventsTotal: rareEvents.length,
      failures: failures.length,
    },
    null,
    2,
  ),
);

if (failures.length > 0) {
  console.error("\nÉCHECS DU SMOKE TEST:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("\naudit:smoke — tout est vert.");
