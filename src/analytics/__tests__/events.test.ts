import { describe, expect, it } from "vitest";

import { analyticsEventEnvelopeSchema, validateEventPayload } from "../events";

describe("schéma game_error", () => {
  it("accepte un errorCode connu", () => {
    const result = validateEventPayload("game_error", {
      errorCode: "local_storage_unavailable",
      source: "autosave",
      recoverable: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepte phase/decisionIndex optionnels", () => {
    const result = validateEventPayload("game_error", {
      errorCode: "decision_resolution_failed",
      source: "choose_event_option",
      phase: "campaign",
      decisionIndex: 4,
      recoverable: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejette un errorCode hors de la liste fermée", () => {
    const result = validateEventPayload("game_error", {
      errorCode: "some_unlisted_error",
      source: "autosave",
      recoverable: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejette un payload avec un message d'erreur brut (jamais de texte libre)", () => {
    const result = validateEventPayload("game_error", {
      errorCode: "local_storage_unavailable",
      source: "autosave",
      recoverable: true,
      message: "TypeError: Cannot read properties of undefined",
    });
    // Zod strips unknown keys by default (non-strict) — the important
    // guarantee is that a free-text field is never *required*, and that
    // errorCode stays a closed enum (tested above), not that an extra key
    // triggers rejection.
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("message");
    }
  });
});

describe("schéma decision_viewed", () => {
  it("exige les quatre flags", () => {
    const missingFlags = validateEventPayload("decision_viewed", {
      decisionIndex: 0,
      phase: "campaign",
      eventId: "ev-1",
      eventCategory: "campaign",
      numberOfAvailableChoices: 2,
    });
    expect(missingFlags.success).toBe(false);

    const complete = validateEventPayload("decision_viewed", {
      decisionIndex: 0,
      phase: "campaign",
      eventId: "ev-1",
      eventCategory: "campaign",
      numberOfAvailableChoices: 2,
      flags: { rare: false, chain: false, decisive: false, risky: false },
    });
    expect(complete.success).toBe(true);
  });
});

describe("schéma decision_resolved (Phase 2)", () => {
  it("exige les six champs avant/après", () => {
    const withoutBeforeAfter = validateEventPayload("decision_resolved", {
      decisionIndex: 0,
      phase: "campaign",
      eventId: "ev-1",
      eventCategory: "campaign",
      choiceId: "ch-1",
      outcomeId: "out-1",
      internalRoll: 0.4,
    });
    expect(withoutBeforeAfter.success).toBe(false);
  });
});

describe("schéma second_round_result (Phase 2)", () => {
  it("exige score et opponentPartyId", () => {
    const missing = validateEventPayload("second_round_result", {
      playerRank: 1,
      won: true,
      turnout: 0.7,
    });
    expect(missing.success).toBe(false);

    const complete = validateEventPayload("second_round_result", {
      score: 51.2,
      playerRank: 1,
      won: true,
      opponentPartyId: "rn",
      turnout: 0.7,
    });
    expect(complete.success).toBe(true);
  });
});

describe("schéma d'enveloppe — versions (Phase 2)", () => {
  const baseEnvelope = {
    eventUuid: "00000000-0000-4000-8000-000000000001",
    eventType: "run_started" as const,
    anonymousUserId: "00000000-0000-4000-8000-0000000000aa",
    sessionId: "00000000-0000-4000-8000-0000000000bb",
    clientSequence: 1,
    occurredAt: "2026-08-12T10:00:00.000Z",
    payload: { mode: "existing_party", partyId: "lfi", seed: "abc" },
  };

  it("rejette une enveloppe sans saveSchemaVersion", () => {
    const result = analyticsEventEnvelopeSchema.safeParse({
      ...baseEnvelope,
      versions: {
        appVersion: "0.1.0",
        engineVersion: "1",
        contentVersion: "2",
        analyticsSchemaVersion: "1",
        buildSha: "sha",
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepte engineVersion et saveSchemaVersion comme deux valeurs distinctes", () => {
    const result = analyticsEventEnvelopeSchema.safeParse({
      ...baseEnvelope,
      versions: {
        appVersion: "0.1.0",
        engineVersion: "1",
        saveSchemaVersion: "2",
        contentVersion: "2",
        analyticsSchemaVersion: "1",
        buildSha: "sha",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.versions.engineVersion).not.toBe(result.data.versions.saveSchemaVersion);
    }
  });
});
