import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

import { GAME_CONFIG } from "../../src/config/game";
import { gameContent } from "../../src/game/data";
import { createGame, simulateOpponentTurn } from "../../src/game/engine";
import type { GameEffect, GameState } from "../../src/game/types";

const ROOT = resolve(import.meta.dirname, "../..");
const OUTPUT = resolve(ROOT, process.env.AUDIT_SYSTEM_OUTPUT ?? "audit/system-report.json");
const SOURCE_ROOT = resolve(ROOT, "src");

const PRIMARY_STATS = [
  "polling",
  "popularity",
  "mobilization",
  "finances",
  "credibility",
  "cohesion",
] as const;
const SECONDARY_STATS = [
  "members",
  "mediaPresence",
  "awareness",
  "rejection",
  "momentum",
  "localStrength",
  "electedSupport",
] as const;
const HIDDEN_STATS = [
  "baseSupport",
  "potentialSupport",
  "transferability",
  "scandalRisk",
  "cadreLoyalty",
  "rivalAmbition",
  "economicCompetence",
  "securityCompetence",
  "socialCompetence",
  "fatigue",
  "consistency",
] as const;

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return nested.flat();
}

function memorySignature(state: GameState): string {
  return JSON.stringify(
    Object.values(state.actors).map((actor) => ({ id: actor.id, memory: actor.memory })),
  );
}

function collectEffects(): {
  kindCounts: Record<string, number>;
  partyStatCounts: Record<string, number>;
  hiddenStatCounts: Record<string, number>;
  eventIdsByKind: Record<string, string[]>;
  delayedEffectGroups: number;
  endingTriggers: Array<{ eventId: string; choiceId: string; outcomeId: string; endingId: string }>;
} {
  const kindCounts: Record<string, number> = {};
  const partyStatCounts: Record<string, number> = {};
  const hiddenStatCounts: Record<string, number> = {};
  const eventIdsByKind = new Map<string, Set<string>>();
  const endingTriggers: Array<{
    eventId: string;
    choiceId: string;
    outcomeId: string;
    endingId: string;
  }> = [];
  let delayedEffectGroups = 0;

  const add = (effect: GameEffect, eventId: string) => {
    increment(kindCounts, effect.kind);
    const ids = eventIdsByKind.get(effect.kind) ?? new Set<string>();
    ids.add(eventId);
    eventIdsByKind.set(effect.kind, ids);
    if (effect.kind === "party_stat") increment(partyStatCounts, effect.stat);
    if (effect.kind === "hidden_stat") increment(hiddenStatCounts, effect.stat);
  };

  for (const event of gameContent.events) {
    for (const choice of event.choices) {
      for (const outcome of choice.outcomeGroups) {
        outcome.effects.forEach((effect) => add(effect, event.id));
        for (const delayed of outcome.delayedEffects ?? []) {
          delayedEffectGroups += 1;
          delayed.effects.forEach((effect) => add(effect, event.id));
        }
        if (outcome.endingTrigger) {
          endingTriggers.push({
            eventId: event.id,
            choiceId: choice.id,
            outcomeId: outcome.id,
            endingId: outcome.endingTrigger,
          });
        }
      }
    }
  }

  return {
    kindCounts,
    partyStatCounts,
    hiddenStatCounts,
    eventIdsByKind: Object.fromEntries(
      [...eventIdsByKind].map(([kind, ids]) => [kind, [...ids].sort()]),
    ),
    delayedEffectGroups,
    endingTriggers,
  };
}

async function main(): Promise<void> {
  const sourceFiles = (await walk(SOURCE_ROOT)).filter((path) =>
    [".ts", ".tsx", ".css"].includes(extname(path)),
  );
  const sourceRows = await Promise.all(
    sourceFiles.map(async (path) => {
      const body = await readFile(path, "utf8");
      const info = await stat(path);
      return {
        path: relative(ROOT, path).replaceAll("\\", "/"),
        lines: body.split(/\r?\n/u).length,
        bytes: info.size,
      };
    }),
  );

  const sameSeedPs = createGame(
    {
      seed: "audit-run-id-collision",
      mode: "existing_party",
      partyId: "ps",
      methodId: "field_first",
    },
    gameContent,
  );
  const sameSeedRn = createGame(
    {
      seed: "audit-run-id-collision",
      mode: "existing_party",
      partyId: "rn",
      methodId: "field_first",
    },
    gameContent,
  );

  let opponentState = createGame(
    {
      seed: "audit-opponent-memory",
      mode: "existing_party",
      partyId: "ps",
      methodId: "field_first",
    },
    gameContent,
  );
  const beforeMemory = memorySignature(opponentState);
  const beforeStrategies = Object.fromEntries(
    Object.values(opponentState.actors).map((actor) => [actor.id, actor.strategy]),
  );
  for (let index = 0; index < 20; index += 1)
    opponentState = simulateOpponentTurn(opponentState, gameContent.electorateBlocs);
  const afterMemory = memorySignature(opponentState);
  const changedStrategies = Object.values(opponentState.actors).filter(
    (actor) => beforeStrategies[actor.id] !== actor.strategy,
  ).length;

  const effects = collectEffects();
  const allPartyStats = [...PRIMARY_STATS, ...SECONDARY_STATS];

  const report = {
    generatedAt: new Date().toISOString(),
    methodology: {
      auditedCommit: "96c0ae2",
      scope: "Static source metrics and deterministic engine probes; game data is read only.",
      commands: ["npx tsx scripts/audit/system-audit.ts"],
    },
    configuration: {
      electionDate: GAME_CONFIG.electionDate,
      schemaVersion: GAME_CONFIG.schemaVersion,
      targetDecisionsBeforeFirstRound: GAME_CONFIG.targetDecisionsBeforeFirstRound,
      targetDecisionsBetweenRounds: GAME_CONFIG.targetDecisionsBetweenRounds,
      targetGovernmentDecisions: GAME_CONFIG.targetGovernmentDecisions,
    },
    source: {
      files: sourceRows.length,
      lines: sourceRows.reduce((sum, row) => sum + row.lines, 0),
      bytes: sourceRows.reduce((sum, row) => sum + row.bytes, 0),
      largestFiles: sourceRows.sort((left, right) => right.lines - left.lines).slice(0, 20),
    },
    identifiers: {
      sameSeedAcrossParties: {
        seed: "audit-run-id-collision",
        psRunId: sameSeedPs.runId,
        rnRunId: sameSeedRn.runId,
        collision: sameSeedPs.runId === sameSeedRn.runId,
      },
    },
    eventMechanics: {
      ...effects,
      unusedEffectKinds: ["trait", "ideology", "bloc_trust", "flag", "candidate_status"].filter(
        (kind) => !effects.kindCounts[kind],
      ),
      unaffectedPartyStats: allPartyStats.filter((key) => !effects.partyStatCounts[key]),
      unaffectedHiddenStats: HIDDEN_STATS.filter((key) => !effects.hiddenStatCounts[key]),
      eventsWithIdeologicalStatements: gameContent.events.filter((event) =>
        event.choices.some((choice) => choice.statement?.ideology),
      ).length,
      eventsWithPlayerPartyCondition: gameContent.events.filter((event) =>
        event.eligibility.some((condition) => condition.kind === "player_party"),
      ).length,
    },
    opponents: {
      simulatedTurns: 20,
      actorsWhoseCurrentStrategyChanged: changedStrategies,
      actorMemoryChanged: beforeMemory !== afterMemory,
      alliancesCreatedByOpponentTurn: Object.values(opponentState.parties).reduce(
        (sum, party) => sum + party.alliedWith.length,
        0,
      ),
      activeCandidatesAfterProbe: Object.values(opponentState.actors).filter(
        (actor) => actor.role === "candidate" && actor.active,
      ).length,
    },
    contentTotals: {
      parties: gameContent.parties.length,
      actors: gameContent.actors.length,
      electorateBlocs: gameContent.electorateBlocs.length,
      events: gameContent.events.length,
      achievements: gameContent.achievements.length,
      endings: gameContent.endings.length,
      secretEndings: gameContent.endings.filter((ending) => ending.secret).length,
    },
  };

  await mkdir(resolve(ROOT, "audit"), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

await main();
