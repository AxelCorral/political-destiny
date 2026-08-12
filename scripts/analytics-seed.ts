// DEV-only synthetic analytics data generator. Never run in production —
// guarded below. Produces plausible-looking runs/decisions across the 9
// real parties so the /admin/analytics dashboard has something to show
// before any real player traffic exists. All seeded rows use a run_id
// prefixed "seed-", which is exactly what --clean deletes — nothing else in
// the analytics tables is touched.
//
// Phase 2 coverage: decision_viewed/choice_selected/decision_resolved
// triplets (with varied latency, including some abandoned-after-viewing
// decisions and a few very slow ones to exercise the latency clip), T1/T2
// scores + runoff opponent, player_dashboard_opened, game_error, several
// version profiles, some genuinely incomplete/stale runs, a bias toward
// rare events, and a dominant-vs-balanced mix of choice selection.
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import {
  validateEventPayload,
  type AnalyticsEventEnvelope,
  type AnalyticsEventName,
} from "../src/analytics/events";
import { ingestEvents } from "../src/analytics/server/ingest";
import { gameContent } from "../src/game/data/index";
import { parties } from "../src/game/data/parties";

const SEED_RUN_PREFIX = "seed-";
const RUNS_PER_PARTY = 14;

const GAME_ERROR_CODES = [
  "local_storage_unavailable",
  "save_corrupted",
  "save_version_incompatible",
  "game_creation_failed",
  "decision_resolution_failed",
] as const;

const VERSION_PROFILES = [
  {
    appVersion: "0.1.0",
    engineVersion: "1",
    saveSchemaVersion: "2",
    contentVersion: String(gameContent.contentVersion),
    analyticsSchemaVersion: "1",
    buildSha: "dev-seed-v1",
  },
  {
    appVersion: "0.1.0",
    engineVersion: "2",
    saveSchemaVersion: "2",
    contentVersion: String(gameContent.contentVersion),
    analyticsSchemaVersion: "1",
    buildSha: "dev-seed-v2",
  },
] as const;

const rareEvents = gameContent.events.filter((event) => event.category === "rare");

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]!;
}

interface RunOutcome {
  events: AnalyticsEventEnvelope[];
  incomplete: boolean;
}

export function buildRunEvents(partyId: string, index: number): RunOutcome {
  const runId = `${SEED_RUN_PREFIX}${partyId}-${index}-${randomUUID()}`;
  const anonymousUserId = randomUUID();
  const sessionId = randomUUID();
  const versions = VERSION_PROFILES[index % VERSION_PROFILES.length]!;
  const incomplete = Math.random() < 0.15;
  // Incomplete runs are backdated well past the default stale threshold
  // (48h) so some of them demonstrably show up as stale_incomplete rather
  // than ongoing — the rest of the incomplete runs stay recent (ongoing).
  const startDaysAgo = incomplete && Math.random() < 0.6 ? randomInt(5, 45) : randomInt(0, 3);
  let cursor = Date.now() - startDaysAgo * 24 * 60 * 60 * 1000;
  let sequence = 0;
  const events: AnalyticsEventEnvelope[] = [];

  const advance = (ms: number): string => {
    cursor += ms;
    return new Date(cursor).toISOString();
  };

  const pushAt = <Name extends AnalyticsEventName>(
    occurredAt: string,
    eventType: Name,
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
      occurredAt,
      payload,
      versions,
    });
  };

  pushAt(new Date(cursor).toISOString(), "run_started", {
    mode: "existing_party",
    partyId,
    methodId: pick(gameContent.methods).id,
    seed: `seed-${randomUUID()}`,
  });

  const decisionsCount = incomplete ? randomInt(2, 12) : randomInt(15, 24);
  let dashboardOpens = 0;
  for (let decisionIndex = 0; decisionIndex < decisionsCount; decisionIndex += 1) {
    const phase = decisionIndex < 24 ? "campaign" : "official_campaign";
    // ~15% of decisions are biased toward a rare event to make sure some
    // rare/chain/decisive exposures exist for the Gameplay/Content tabs.
    const event =
      rareEvents.length > 0 && Math.random() < 0.15 ? pick(rareEvents) : pick(gameContent.events);
    // ~30% of decisions always take the first choice (dominant-choice
    // pattern), the rest pick uniformly at random (balanced pattern) — a
    // simple, not over-engineered, approximation of both signals the
    // Gameplay tab's >80%/<5% flags are meant to catch.
    const choice = Math.random() < 0.3 ? event.choices[0]! : pick(event.choices);
    const outcome = pick(choice.outcomeGroups);

    const viewedAt = advance(randomInt(2_000, 30_000));
    pushAt(viewedAt, "decision_viewed", {
      decisionIndex,
      phase,
      eventId: event.id,
      eventCategory: event.category,
      numberOfAvailableChoices: event.choices.length,
      flags: {
        rare: event.category === "rare",
        chain: Boolean(
          event.chain && event.chain.step > 1 && (event.chain.followsEventIds?.length ?? 0) > 0,
        ),
        decisive: event.importance === "decisive",
        risky: event.choices.some((candidate) => candidate.visibleTag === "RISQUÉ"),
      },
    });

    // ~3% of viewed decisions are abandoned (never selected/resolved) —
    // simulates a reload/quit mid-decision.
    if (Math.random() < 0.03) continue;

    const latencyMs = Math.random() < 0.08 ? randomInt(90_000, 4_000_000) : randomInt(700, 40_000);
    const selectedAt = advance(latencyMs);
    pushAt(selectedAt, "choice_selected", {
      decisionIndex,
      eventId: event.id,
      choiceId: choice.id,
      choiceTag: choice.visibleTag,
      choiceStrategy: choice.strategy,
    });

    const pollBefore = randomInt(5, 35);
    const popularityBefore = randomInt(10, 60);
    const momentumBefore = Math.round((Math.random() * 4 - 2) * 10) / 10;
    const resolvedAt = advance(randomInt(50, 400));
    pushAt(resolvedAt, "decision_resolved", {
      decisionIndex,
      phase,
      eventId: event.id,
      eventCategory: event.category,
      choiceId: choice.id,
      choiceTag: choice.visibleTag,
      choiceStrategy: choice.strategy,
      outcomeId: outcome.id,
      internalRoll: Math.random(),
      playerPollBefore: pollBefore,
      playerPollAfter: Math.max(0, Math.min(100, pollBefore + (Math.random() * 6 - 3))),
      popularityBefore,
      popularityAfter: Math.max(0, Math.min(100, popularityBefore + (Math.random() * 6 - 3))),
      momentumBefore,
      momentumAfter: Math.round((momentumBefore + (Math.random() * 2 - 1)) * 10) / 10,
    });

    if (decisionIndex % 5 === 0) {
      const playerScore = randomInt(5, 30);
      pushAt(advance(500), "race_snapshot", {
        decisionIndex,
        phase,
        playerScore,
        playerRank: randomInt(1, 9),
        playerTrend: Math.random() * 4 - 2,
        resultsCount: parties.length,
      });
    }

    if (dashboardOpens < 3 && Math.random() < 0.08) {
      dashboardOpens += 1;
      pushAt(advance(200), "player_dashboard_opened", { phase, decisionIndex });
    }
  }

  if (Math.random() < 0.05) {
    pushAt(advance(100), "game_error", {
      errorCode: pick(GAME_ERROR_CODES),
      source: "seed_synthetic",
      phase: decisionsCount > 0 ? "campaign" : undefined,
      recoverable: true,
    });
  }

  if (incomplete) {
    return { events, incomplete: true };
  }

  const firstRoundScore = randomInt(3, 32);
  const qualified = firstRoundScore >= 18 || Math.random() < 0.15;
  pushAt(advance(60_000), "first_round_result", {
    score: firstRoundScore,
    playerRank: qualified ? randomInt(1, 2) : randomInt(3, 9),
    qualified,
    turnout: 0.65 + Math.random() * 0.15,
  });
  pushAt(advance(500), "milestone_reached", {
    milestone: qualified ? "qualified_first_round" : "eliminated_first_round",
  });

  let won = false;
  let secondRoundScore: number | undefined;
  let opponentPartyId: string | undefined;
  if (qualified) {
    won = Math.random() < 0.5;
    secondRoundScore = won ? randomInt(50, 62) : randomInt(38, 49);
    opponentPartyId = pick(parties.filter((party) => party.id !== partyId)).id;
    pushAt(advance(90_000), "second_round_result", {
      score: secondRoundScore,
      playerRank: won ? 1 : 2,
      won,
      opponentPartyId,
      turnout: 0.7 + Math.random() * 0.15,
    });
    pushAt(advance(500), "milestone_reached", { milestone: "entered_second_round" });
  }

  pushAt(advance(30_000), "run_completed", {
    score: Math.round((qualified ? 50 + Math.random() * 50 : Math.random() * 50) * 10) / 10,
    won,
    qualified,
    endingId: won ? "ending-victory" : qualified ? "ending-runoff-loss" : "ending-first-round-loss",
    progressionNormalized: Math.random() * 2 - 1,
    decisionsCount,
  });
  pushAt(advance(200), "milestone_reached", { milestone: "game_finished" });

  return { events, incomplete: false };
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
  let incompleteRuns = 0;
  for (const party of parties) {
    for (let index = 0; index < RUNS_PER_PARTY; index += 1) {
      const { events, incomplete } = buildRunEvents(party.id, index);
      // Same schemas the real ingestion endpoint enforces (src/analytics/
      // events.ts) — a self-check so this generator can never silently
      // write malformed synthetic rows.
      for (const event of events) {
        const result = validateEventPayload(event.eventType, event.payload);
        if (!result.success) {
          throw new Error(
            `[analytics-seed] generated an invalid "${event.eventType}" payload: ${result.error.message}`,
          );
        }
      }
      const result = await ingestEvents(supabase, events);
      totalEvents += result.accepted;
      totalRuns += 1;
      if (incomplete) incompleteRuns += 1;
    }
  }
  console.log(
    `[analytics-seed] seeded ${totalRuns} runs (${parties.length} parties × ${RUNS_PER_PARTY}, ` +
      `${incompleteRuns} incomplete/stale), ${totalEvents} events across ${VERSION_PROFILES.length} ` +
      "version profiles. Run with --clean to remove them.",
  );
}

void seed();
