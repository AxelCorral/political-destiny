import { describe, expect, it } from "vitest";

import {
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionCookieValue,
  safeStringEquals,
  verifyAdminSessionCookieValue,
} from "../adminSession";

describe("session admin signée", () => {
  it("valide un cookie fraîchement signé avec le bon secret", () => {
    const cookie = createAdminSessionCookieValue("secret-a");
    expect(verifyAdminSessionCookieValue(cookie, "secret-a")).toBe(true);
  });

  it("rejette un cookie signé avec un autre secret", () => {
    const cookie = createAdminSessionCookieValue("secret-a");
    expect(verifyAdminSessionCookieValue(cookie, "secret-b")).toBe(false);
  });

  it("rejette un cookie malformé", () => {
    expect(verifyAdminSessionCookieValue("not-a-valid-cookie", "secret-a")).toBe(false);
    expect(verifyAdminSessionCookieValue("a.b.c", "secret-a")).toBe(false);
  });

  it("rejette un cookie expiré", () => {
    const now = Date.now();
    const cookie = createAdminSessionCookieValue("secret-a", now);
    const afterExpiry = now + (ADMIN_SESSION_TTL_SECONDS + 60) * 1000;
    expect(verifyAdminSessionCookieValue(cookie, "secret-a", afterExpiry)).toBe(false);
  });

  it("accepte un cookie juste avant expiration", () => {
    const now = Date.now();
    const cookie = createAdminSessionCookieValue("secret-a", now);
    const justBefore = now + (ADMIN_SESSION_TTL_SECONDS - 1) * 1000;
    expect(verifyAdminSessionCookieValue(cookie, "secret-a", justBefore)).toBe(true);
  });
});

describe("safeStringEquals", () => {
  it("vrai pour deux chaînes identiques", () => {
    expect(safeStringEquals("mot-de-passe", "mot-de-passe")).toBe(true);
  });

  it("faux pour des chaînes différentes, y compris de longueurs différentes", () => {
    expect(safeStringEquals("mot-de-passe", "autre")).toBe(false);
    expect(safeStringEquals("a", "ab")).toBe(false);
  });
});
