// DEV-only synthetic analytics data generator. Never run in production —
// guarded below. Produces plausible-looking runs/decisions across the 9
// real parties so the /admin/analytics dashboard has something to show
// before any real player traffic exists. All seeded rows use a run_id
// prefixed "seed-", which is exactly what --clean deletes — nothing else in
// the analytics tables is touched.
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import { gameContent } from "../src/game/data/index";
import { parties } from "../src/game/data/parties";
import { ingestEvents } from "../src/analytics/server/ingest";
import type { AnalyticsEventEnvelope } from "../src/analytics/events";

const SEED_RUN_PREFIX = "seed-";
const RUNS_PER_PARTY = 15;

const versions = {
  appVersion: "0.1.0",
  engineVersion: "2",
  contentVersion: String(gameContent.contentVersion),
  analyticsSchemaVersion: "1",
  buildSha: "dev-seed",
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]!;
}

function isoMinusDays(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function buildRunEvents(partyId: string, index: number): AnalyticsEventEnvelope[] {
  const runId = `${SEED_RUN_PREFIX}${partyId}-${index}-${randomUUID()}`;
  const anonymousUserId = randomUUID();
  const sessionId = randomUUID();
  const startedAt = isoMinusDays(randomInt(0, 45));
  let sequence = 0;
  const events: AnalyticsEventEnvelope[] = [];

  const push = (
    eventType: AnalyticsEventEnvelope["eventType"],
    payload: Record<string, unknown>,
  ) => {
    sequence += 1;
    events.push({
      eventUuid: randomUUID(),
      eventType,
      anonymousUserId,
      sessionId,
      runId,
      clientSequence: sequence,
      occurredAt: startedAt,
      payload,
      versions,
    });
  };

  push("run_started", {
    mode: "existing_party",
    partyId,
    methodId: pick(gameContent.methods).id,
    seed: `seed-${randomUUID()}`,
  });

  const decisionsCount = randomInt(10, 24);
  for (let decisionIndex = 0; decisionIndex < decisionsCount; decisionIndex += 1) {
    const event = pick(gameContent.events);
    const choice = pick(event.choices);
    const outcome = pick(choice.outcomeGroups);
    push("decision_resolved", {
      decisionIndex,
      phase: decisionIndex < 24 ? "campaign" : "official_campaign",
      eventId: event.id,
      eventCategory: event.category,
      choiceId: choice.id,
      choiceTag: choice.visibleTag,
      choiceStrategy: choice.strategy,
      outcomeId: outcome.id,
      internalRoll: Math.random(),
    });
    if (decisionIndex % 5 === 0) {
      push("race_snapshot", {
        decisionIndex,
        playerRank: randomInt(1, 9),
        playerTrend: Math.random() * 4 - 2,
        resultsCount: parties.length,
      });
    }
  }

  const qualified = Math.random() < 0.35;
  push("first_round_result", {
    playerRank: qualified ? randomInt(1, 2) : randomInt(3, 9),
    qualified,
    turnout: 0.65 + Math.random() * 0.15,
  });
  push("milestone_reached", {
    milestone: qualified ? "qualified_first_round" : "eliminated_first_round",
  });

  let won = false;
  if (qualified) {
    won = Math.random() < 0.5;
    push("second_round_result", {
      playerRank: won ? 1 : 2,
      won,
      turnout: 0.7 + Math.random() * 0.15,
    });
    push("milestone_reached", { milestone: "entered_second_round" });
  }

  push("run_completed", {
    score: Math.round((qualified ? 50 + Math.random() * 50 : Math.random() * 50) * 10) / 10,
    won,
    qualified,
    endingId: won ? "ending-victory" : qualified ? "ending-runoff-loss" : "ending-first-round-loss",
    progressionNormalized: Math.random() * 2 - 1,
    decisionsCount,
  });
  push("milestone_reached", { milestone: "game_finished" });

  return events;
}

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.error("[analytics-seed] refusing to run with NODE_ENV=production.");
    process.exitCode = 1;
    return;
  }
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    console.error(
      "[analytics-seed] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. " +
        "This script only ever targets the Supabase project configured in your local .env — " +
        "see .env.example and docs/analytics/README.md before running it.",
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (process.argv.includes("--clean")) {
    console.log("[analytics-seed] deleting previously seeded rows (run_id like 'seed-%')…");
    await supabase.from("analytics_runs").delete().like("run_id", `${SEED_RUN_PREFIX}%`);
    await supabase.from("analytics_events").delete().like("run_id", `${SEED_RUN_PREFIX}%`);
    console.log("[analytics-seed] done.");
    return;
  }

  let totalEvents = 0;
  let totalRuns = 0;
  for (const party of parties) {
    for (let index = 0; index < RUNS_PER_PARTY; index += 1) {
      const events = buildRunEvents(party.id, index);
      const result = await ingestEvents(supabase, events);
      totalEvents += result.accepted;
      totalRuns += 1;
    }
  }
  console.log(
    `[analytics-seed] seeded ${totalRuns} runs (${parties.length} parties × ${RUNS_PER_PARTY}), ${totalEvents} events. Run with --clean to remove them.`,
  );
}

void seed();
