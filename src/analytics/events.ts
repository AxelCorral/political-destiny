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
  "decision_resolved",
  "race_snapshot",
  "first_round_result",
  "second_round_result",
  "milestone_reached",
  "run_completed",
] as const;

export type AnalyticsEventName = (typeof analyticsEventTypes)[number];

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
export const uuidSchema = z.string().regex(uuidPattern, "invalid uuid");
export const isoDatetimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "invalid ISO datetime" });

export const analyticsVersionsSchema = z.object({
  appVersion: z.string().min(1).max(32),
  engineVersion: z.string().min(1).max(32),
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
  }),
  race_snapshot: z.object({
    decisionIndex: z.number().int().min(0),
    playerRank: z.number().int().min(1),
    playerTrend: z.number(),
    resultsCount: z.number().int().min(0),
  }),
  first_round_result: z.object({
    playerRank: z.number().int().min(1),
    qualified: z.boolean(),
    turnout: z.number().min(0).max(1),
  }),
  second_round_result: z.object({
    playerRank: z.number().int().min(1),
    won: z.boolean(),
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
