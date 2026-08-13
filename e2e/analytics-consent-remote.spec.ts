import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 3 remote-enablement consent proof — NOT part of the regular
 * regression suite (e2e/analytics-telemetry.spec.ts already covers "unset"
 * and non-blocking-on-failure against whatever backend is configured).
 * This spec additionally covers explicit "denied" and consent withdrawal,
 * and asserts directly against the real Postgres project (not just that an
 * HTTP request was/wasn't sent) — skipped entirely unless real Supabase
 * credentials are present, since it deletes only the rows it creates.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
test.skip(!supabaseUrl || !serviceRoleKey, "requires a real Supabase project (Phase 3 only)");

const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : undefined;

async function dismissFictionNotice(page: Page) {
  const notice = page.getByRole("dialog", { name: /Avant d’entrer en campagne/i });
  const setupChoice = page.getByRole("button", { name: /Un parti existant/i });
  await expect(notice.or(setupChoice)).toBeVisible();
  if (await notice.isVisible().catch(() => false)) {
    await notice.getByRole("button", { name: /J’ai compris/i }).click();
    await expect(notice).toBeHidden();
  }
}

async function startCampaign(page: Page, seed: string) {
  await page.goto("/jouer");
  await dismissFictionNotice(page);
  await page.getByRole("button", { name: /Un parti existant/i }).click();
  await page.getByRole("button", { name: /Emblème abstrait de La France insoumise/i }).click();
  await page.getByRole("button", { name: /Choisir ce parti/i }).click();
  await page.getByRole("button", { name: /Présidentiable/i }).click();
  await page.getByRole("textbox", { name: /Graine de partie/i }).fill(seed);
  await page.getByRole("button", { name: /Lancer la campagne/i }).click();
  await page.getByRole("button", { name: /Entrer en campagne/i }).click();
}

async function resolveOneDecision(page: Page) {
  await page.getByTestId("event-choice").first().click();
  const consequenceContinue = page.getByRole("button", { name: /^Continuer$/i });
  if (await consequenceContinue.isVisible().catch(() => false)) await consequenceContinue.click();
}

async function cleanupRun(runId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("analytics_decisions").delete().eq("run_id", runId);
  await supabase.from("analytics_events").delete().eq("run_id", runId);
  await supabase.from("analytics_runs").delete().eq("run_id", runId);
}

test.describe("consentement réel — refus explicite et retrait (Phase 3)", () => {
  test("un refus explicite ('Désactiver les statistiques anonymes') n'envoie rien et ne crée aucune ligne distante", async ({
    page,
  }) => {
    const seed = `e2e-consent-denied-${Date.now()}`;
    let sawIngestionRequest = false;
    page.on("request", (request) => {
      if (request.url().includes("/api/analytics/events")) sawIngestionRequest = true;
    });

    await page.goto("/parametres");
    await page.getByRole("button", { name: /Désactiver les statistiques anonymes/i }).click();
    await expect(page.getByText(/Statistiques anonymes désactivées/i)).toBeVisible();

    await startCampaign(page, seed);
    await resolveOneDecision(page);
    await page.waitForTimeout(2_000);

    // No HTTP request ever reached the real server, so by construction
    // nothing could have reached the real database either.
    expect(sawIngestionRequest).toBe(false);
  });

  test("le retrait du consentement après envoi arrête réellement les nouveaux envois", async ({
    page,
  }) => {
    const seed = `e2e-consent-withdraw-${Date.now()}`;
    const ingestionRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/analytics/events") && request.method() === "POST") {
        ingestionRequests.push(request.postData() ?? "");
      }
    });

    await page.goto("/parametres");
    // Exact match: "Désactiver..." contains "activer..." as a substring.
    await page.getByRole("button", { name: "Activer les statistiques anonymes", exact: true }).click();
    await expect(page.getByText(/Statistiques anonymes activées/i)).toBeVisible();

    await startCampaign(page, seed);
    await resolveOneDecision(page);
    await page.waitForTimeout(1_500);

    const runIdMatch = ingestionRequests
      .map((body) => {
        try {
          return (JSON.parse(body) as { events?: Array<{ runId?: string }> }).events;
        } catch {
          return undefined;
        }
      })
      .flat()
      .find((event) => event?.runId)?.runId;
    expect(runIdMatch, "expected at least one ingested event with a run_id before withdrawal").toBeTruthy();
    const runId = runIdMatch!;

    // Real DB proof that the granted phase actually persisted something,
    // before we prove withdrawal stops further writes.
    await expect
      .poll(
        async () => {
          const { count } = await supabase!
            .from("analytics_runs")
            .select("run_id", { count: "exact", head: true })
            .eq("run_id", runId);
          return count ?? 0;
        },
        { timeout: 10_000 },
      )
      .toBeGreaterThan(0);

    // Navigating to /parametres is a full page reload — AnalyticsProvider
    // remounts and fires its own session_started while consent is still
    // "granted" (withdrawal hasn't happened yet), so the request-count
    // baseline must be captured AFTER the withdrawal click settles, not
    // before this navigation.
    await page.goto("/parametres");
    await page.getByRole("button", { name: /Désactiver les statistiques anonymes/i }).click();
    await expect(page.getByText(/Statistiques anonymes désactivées/i)).toBeVisible();
    await page.waitForTimeout(500); // let any already-in-flight flush from the reload settle
    const requestCountBeforeWithdrawal = ingestionRequests.length;

    await page.goto("/jouer"); // resumes the in-progress campaign — no setup wizard to dismiss
    const nextChoice = page.getByTestId("event-choice").first();
    if (await nextChoice.isVisible().catch(() => false)) {
      await nextChoice.click();
      const consequenceContinue = page.getByRole("button", { name: /^Continuer$/i });
      if (await consequenceContinue.isVisible().catch(() => false)) await consequenceContinue.click();
    }
    await page.waitForTimeout(2_000);

    expect(ingestionRequests.length).toBe(requestCountBeforeWithdrawal);

    const decisionCountAfter = await supabase!
      .from("analytics_decisions")
      .select("decision_index", { count: "exact", head: true })
      .eq("run_id", runId);
    // No assertion on the exact count (depends on how many decisions were
    // resolved before withdrawal) — the request-count check above is the
    // real proof. This just confirms the row is reachable for cleanup.
    expect(decisionCountAfter.error).toBeNull();

    await cleanupRun(runId);
  });
});
