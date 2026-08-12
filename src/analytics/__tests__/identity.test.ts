import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { getOrCreateAnonymousUserId, getOrCreateSessionId, newEventUuid } from "../identity";

describe("identifiants analytics", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("crée un anonymous_user_id une seule fois puis le réutilise", async () => {
    const first = await getOrCreateAnonymousUserId();
    const second = await getOrCreateAnonymousUserId();
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f-]{36}$/iu);
  });

  it("réutilise le même session_id pour l'onglet courant", () => {
    const first = getOrCreateSessionId();
    const second = getOrCreateSessionId();
    expect(first).toBe(second);
  });

  it("génère un event_uuid différent à chaque appel", () => {
    const ids = new Set(Array.from({ length: 20 }, () => newEventUuid()));
    expect(ids.size).toBe(20);
  });
});
