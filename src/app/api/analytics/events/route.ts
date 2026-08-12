import { NextResponse } from "next/server";

import {
  analyticsEventEnvelopeSchema,
  validateEventPayload,
  type AnalyticsEventEnvelope,
  type AnalyticsEventName,
} from "@/analytics/events";
import { ingestEvents } from "@/analytics/server/ingest";
import {
  getSupabaseAdminClient,
  isAnalyticsStorageConfigured,
} from "@/analytics/server/supabaseAdmin";

export const runtime = "nodejs";

// Batch contract: 1..50 events per request, request body capped well below
// any reasonable batch's size — a large body is rejected outright rather
// than partially parsed.
const MAX_BATCH_SIZE = 50;
const MAX_BODY_BYTES = 256 * 1024;

interface RejectedEvent {
  eventUuid?: string;
  reason: string;
}

/**
 * Analytics failures must never surface as gameplay errors — this handler
 * is the one place in the mission where that promise is actually kept, by
 * always responding with a definite status instead of throwing, and by
 * validating each event independently so one malformed item never rejects
 * an otherwise-valid batch.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const events = (parsedBody as { events?: unknown } | null)?.events;
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_BATCH_SIZE) {
    return NextResponse.json({ error: "invalid_batch_size" }, { status: 400 });
  }

  const accepted: AnalyticsEventEnvelope[] = [];
  const rejected: RejectedEvent[] = [];
  for (const candidate of events) {
    const envelopeResult = analyticsEventEnvelopeSchema.safeParse(candidate);
    if (!envelopeResult.success) {
      const eventUuid =
        typeof (candidate as { eventUuid?: unknown })?.eventUuid === "string"
          ? (candidate as { eventUuid: string }).eventUuid
          : undefined;
      rejected.push({ eventUuid, reason: "invalid_envelope" });
      continue;
    }
    const envelope = envelopeResult.data;
    const payloadResult = validateEventPayload(
      envelope.eventType as AnalyticsEventName,
      envelope.payload,
    );
    if (!payloadResult.success) {
      rejected.push({ eventUuid: envelope.eventUuid, reason: "invalid_payload" });
      continue;
    }
    accepted.push({ ...envelope, payload: payloadResult.data });
  }

  if (!isAnalyticsStorageConfigured()) {
    // Fail-open, by design: the game must work with zero Supabase env vars
    // configured. Responding 200 here lets the client drain its local
    // queue instead of retrying forever against a server that will never
    // be able to store anything.
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[analytics] ingestion endpoint called but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are not set — ${accepted.length} event(s) accepted but not stored.`,
      );
    }
    return NextResponse.json({ accepted: accepted.length, rejected, stored: false });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ accepted: accepted.length, rejected, stored: false });
  }

  try {
    const result = await ingestEvents(supabase, accepted);
    return NextResponse.json({
      accepted: result.accepted,
      rejected,
      stored: true,
      runsTouched: result.runsTouched,
    });
  } catch (error) {
    console.error(
      "[analytics] ingestion failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json({ error: "ingestion_failed" }, { status: 500 });
  }
}
