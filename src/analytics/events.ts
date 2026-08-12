import { z } from "zod";

/**
 * The full analytics event catalog. Deliberately does not include a
 * "game_abandoned" event: a run's status (ongoing / completed /
 * stale_incomplete) is derived server-side from last_event_at, never
 * declared by the client. Resuming a stale run simply emits "run_resumed"
 * and the run reverts to "ongoing" on its next event.
 */
export const analyticsEventTypes = [
  "session_started",
  "setup_step_viewed",
  "consent_updated",
  "run_started",
  "run_resumed",
  "decision_viewed",
  "choice_selected",
  "decision_resolved",
  "race_snapshot",
  "first_round_result",
  "second_round_result",
  "milestone_reached",
  "run_completed",
  "player_dashboard_opened",
  "game_error",
] as const;

export type AnalyticsEventName = (typeof analyticsEventTypes)[number];

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
export const uuidSchema = z.string().regex(uuidPattern, "invalid uuid");
export const isoDatetimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "invalid ISO datetime" });

export const analyticsVersionsSchema = z.object({
  appVersion: z.string().min(1).max(32),
  /**
   * Engine LOGIC version (probabilities, selection weights, scoring
   * formulas, etc.) — NOT the save-file schema version. See
   * docs/analytics/VERSIONING_POLICY.md.
   */
  engineVersion: z.string().min(1).max(32),
  /** GameState save-file compatibility version (GAME_CONFIG.schemaVersion). */
  saveSchemaVersion: z.string().min(1).max(32),
  contentVersion: z.string().min(1).max(32),
  analyticsSchemaVersion: z.string().min(1).max(16),
  buildSha: z.string().min(1).max(64),
});

export type AnalyticsVersions = z.infer<typeof analyticsVersionsSchema>;

/**
 * One Zod schema per event type, describing only fields that actually exist
 * on GameState / DecisionRecord / FinalResult (src/game/types/index.ts). No
 * field here was invented — each is traceable to a real engine type. No
 * narrative text, no free-form strings from game content, no raw GameState.
 */
export const analyticsPayloadSchemas = {
  session_started: z.object({
    entryPath: z.string().max(256),
  }),
  setup_step_viewed: z.object({
    screen: z.enum(["mode", "party_list", "party_detail", "custom_party", "method"]),
  }),
  consent_updated: z.object({
    state: z.enum(["granted", "denied"]),
  }),
  run_started: z.object({
    mode: z.enum(["existing_party", "custom_party", "random"]),
    partyId: z.string().max(64),
    methodId: z.string().max(64).optional(),
    candidateProfileId: z.string().max(64).optional(),
    seed: z.string().max(128),
  }),
  run_resumed: z.object({
    decisionIndex: z.number().int().min(0),
    phase: z.string().max(32),
  }),
  /**
   * A new decision becomes visible to the player. Deduplicated client-side
   * by (run_id, decisionIndex, eventId) — see CampaignEventScreen
   * (src/features/campaign/campaign-screens.tsx) — so a React re-render can
   * never inflate exposure counts.
   */
  decision_viewed: z.object({
    decisionIndex: z.number().int().min(0),
    phase: z.string().max(32),
    eventId: z.string().max(128),
    eventCategory: z.string().max(32),
    numberOfAvailableChoices: z.number().int().min(1),
    flags: z.object({
      rare: z.boolean(),
      chain: z.boolean(),
      decisive: z.boolean(),
      risky: z.boolean(),
    }),
  }),
  /** Emitted on click, before resolution — the denominator for choice_selected is decision_viewed, never itself. */
  choice_selected: z.object({
    decisionIndex: z.number().int().min(0),
    eventId: z.string().max(128),
    choiceId: z.string().max(128),
    choiceTag: z.string().max(64).optional(),
    choiceStrategy: z.string().max(64).optional(),
  }),
  decision_resolved: z.object({
    decisionIndex: z.number().int().min(0),
    phase: z.string().max(32),
    eventId: z.string().max(128),
    eventCategory: z.string().max(32),
    choiceId: z.string().max(128),
    choiceTag: z.string().max(64).optional(),
    choiceStrategy: z.string().max(64).optional(),
    outcomeId: z.string().max(128),
    internalRoll: z.number().min(0).max(1),
    // Read directly from GameState.parties[playerPartyId].stats immediately
    // before/after resolveCurrentChoice — never a recomputed engine formula.
    playerPollBefore: z.number(),
    playerPollAfter: z.number(),
    popularityBefore: z.number(),
    popularityAfter: z.number(),
    momentumBefore: z.number(),
    momentumAfter: z.number(),
  }),
  race_snapshot: z.object({
    decisionIndex: z.number().int().min(0),
    phase: z.string().max(32),
    playerScore: z.number(),
    playerRank: z.number().int().min(1),
    playerTrend: z.number(),
    resultsCount: z.number().int().min(0),
  }),
  first_round_result: z.object({
    score: z.number(),
    playerRank: z.number().int().min(1),
    qualified: z.boolean(),
    turnout: z.number().min(0).max(1),
  }),
  second_round_result: z.object({
    score: z.number(),
    playerRank: z.number().int().min(1),
    won: z.boolean(),
    opponentPartyId: z.string().max(64),
    turnout: z.number().min(0).max(1),
  }),
  milestone_reached: z.object({
    milestone: z.enum([
      "qualified_first_round",
      "eliminated_first_round",
      "entered_second_round",
      "entered_government",
      "game_finished",
    ]),
  }),
  run_completed: z.object({
    score: z.number(),
    won: z.boolean(),
    qualified: z.boolean(),
    endingId: z.string().max(128),
    progressionNormalized: z.number(),
    decisionsCount: z.number().int().min(0),
  }),
  /** A user-initiated open, not a re-render — see campaign-screens.tsx. */
  player_dashboard_opened: z.object({
    phase: z.string().max(32),
    decisionIndex: z.number().int().min(0),
  }),
  /**
   * Categorized technical errors only — never a raw stack/message/Error
   * object. errorCode is a closed enum limited to real catch sites
   * (src/features/campaign/gameStore.ts, game-app.tsx,
   * src/lib/storage/game-database.ts) — see docs/analytics/EVENT_CATALOG.md.
   */
  game_error: z.object({
    errorCode: z.enum([
      "local_storage_unavailable",
      "save_corrupted",
      "save_version_incompatible",
      "game_creation_failed",
      "decision_resolution_failed",
    ]),
    source: z.string().max(64),
    phase: z.string().max(32).optional(),
    decisionIndex: z.number().int().min(0).optional(),
    recoverable: z.boolean(),
  }),
} as const satisfies Record<AnalyticsEventName, z.ZodTypeAny>;

export type AnalyticsEventPayload<Name extends AnalyticsEventName> = z.infer<
  (typeof analyticsPayloadSchemas)[Name]
>;

export const analyticsEventEnvelopeSchema = z.object({
  eventUuid: uuidSchema,
  eventType: z.enum(analyticsEventTypes),
  anonymousUserId: uuidSchema,
  sessionId: uuidSchema,
  runId: z.string().min(1).max(128).optional(),
  clientSequence: z.number().int().min(1),
  occurredAt: isoDatetimeSchema,
  payload: z.record(z.string(), z.unknown()),
  versions: analyticsVersionsSchema,
  experimentId: z.string().max(64).optional(),
  variantId: z.string().max(64).optional(),
});

export type AnalyticsEventEnvelope = z.infer<typeof analyticsEventEnvelopeSchema>;

export const analyticsBatchSchema = z.object({
  events: z.array(analyticsEventEnvelopeSchema).min(1).max(50),
});

export function validateEventPayload(eventType: AnalyticsEventName, payload: unknown) {
  return analyticsPayloadSchemas[eventType].safeParse(payload);
}
