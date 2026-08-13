import { expect, test, type Page, type Request } from "@playwright/test";

interface IngestedEvent {
  eventType: string;
  runId?: string;
  clientSequence: number;
  payload: Record<string, unknown>;
}

/** Collects every event from every ingestion batch sent during the test, in clientSequence order. */
function collectIngestionEvents(page: Page): () => IngestedEvent[] {
  const collected: IngestedEvent[] = [];
  page.on("request", (request: Request) => {
    if (!request.url().includes("/api/analytics/events") || request.method() !== "POST") return;
    try {
      const body = JSON.parse(request.postData() ?? "{}") as { events?: IngestedEvent[] };
      if (Array.isArray(body.events)) collected.push(...body.events);
    } catch {
      // Ignore malformed bodies — not what these tests are checking.
    }
  });
  return () => [...collected].sort((a, b) => a.clientSequence - b.clientSequence);
}

async function dismissFictionNotice(page: Page) {
  const notice = page.getByRole("dialog", { name: /Avant d’entrer en campagne/i });
  const setupChoice = page.getByRole("button", { name: /Un parti existant/i });
  await expect(notice.or(setupChoice)).toBeVisible();
  if (await notice.isVisible().catch(() => false)) {
    await notice.getByRole("button", { name: /J’ai compris/i }).click();
    await expect(notice).toBeHidden();
  }
}

async function grantAnalyticsConsent(page: Page) {
  await page.goto("/parametres");
  await page.getByRole("button", { name: /Activer les statistiques anonymes/i }).click();
  await expect(page.getByText(/Statistiques anonymes activées/i)).toBeVisible();
}

async function startCampaignAndResolveOneDecision(page: Page) {
  await page.goto("/jouer");
  await dismissFictionNotice(page);
  await page.getByRole("button", { name: /Un parti existant/i }).click();
  await page.getByRole("button", { name: /Emblème abstrait de La France insoumise/i }).click();
  await page.getByRole("button", { name: /Choisir ce parti/i }).click();
  await page.getByRole("button", { name: /Présidentiable/i }).click();
  await page
    .getByRole("textbox", { name: /Graine de partie/i })
    .fill(`e2e-analytics-${Date.now()}`);
  await page.getByRole("button", { name: /Lancer la campagne/i }).click();
  await page.getByRole("button", { name: /Entrer en campagne/i }).click();
  await page.getByTestId("event-choice").first().click();
}

test.describe("télémétrie de jeu (consentement + non-blocage)", () => {
  test("envoie des événements analytics une fois le consentement accordé", async ({ page }) => {
    await grantAnalyticsConsent(page);

    const ingestionRequest = page.waitForRequest(
      (request) => request.url().includes("/api/analytics/events") && request.method() === "POST",
      { timeout: 15_000 },
    );

    await startCampaignAndResolveOneDecision(page);
    // A second decision guarantees at least one flush has had time to fire
    // (track() schedules a flush ~250ms after enqueue).
    const consequenceContinue = page.getByRole("button", { name: /^Continuer$/i });
    if (await consequenceContinue.isVisible().catch(() => false)) await consequenceContinue.click();

    const request = await ingestionRequest;
    const body = JSON.parse(request.postData() ?? "{}") as { events: Array<{ eventType: string }> };
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.events.length).toBeGreaterThan(0);
  });

  test("envoie des événements sans action explicite (comportement par défaut, opt-out)", async ({
    page,
  }) => {
    const ingestionRequest = page.waitForRequest(
      (request) => request.url().includes("/api/analytics/events") && request.method() === "POST",
      { timeout: 15_000 },
    );

    await startCampaignAndResolveOneDecision(page);
    const consequenceContinue = page.getByRole("button", { name: /^Continuer$/i });
    if (await consequenceContinue.isVisible().catch(() => false)) await consequenceContinue.click();

    const request = await ingestionRequest;
    const body = JSON.parse(request.postData() ?? "{}") as { events: Array<{ eventType: string }> };
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.events.length).toBeGreaterThan(0);
  });

  test("le jeu reste jouable même si l'ingestion analytics échoue systématiquement", async ({
    page,
  }) => {
    await page.route("**/api/analytics/events", (route) =>
      route.fulfill({ status: 500, body: "{}" }),
    );
    await grantAnalyticsConsent(page);

    await startCampaignAndResolveOneDecision(page);
    // If gameplay were blocked by the analytics failure, this second choice
    // (or the "Continuer" consequence screen) would never become clickable.
    const consequenceContinue = page.getByRole("button", { name: /^Continuer$/i });
    if (await consequenceContinue.isVisible().catch(() => false)) await consequenceContinue.click();
    await expect(
      page
        .getByTestId("event-choice")
        .first()
        .or(page.getByRole("heading", { name: /État de la course/i })),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("émet decision_viewed -> choice_selected -> decision_resolved dans cet ordre pour la décision jouée", async ({
    page,
  }) => {
    await grantAnalyticsConsent(page);
    const getEvents = collectIngestionEvents(page);

    await startCampaignAndResolveOneDecision(page);
    // decision_resolved is only tracked once game-app.tsx's own effect
    // reacts to the store update (a render cycle after choice_selected),
    // and each enqueue schedules its own 250ms flush — poll instead of a
    // single fixed wait so this isn't flaky under a slow dev server.
    await expect
      .poll(
        () =>
          getEvents()
            .filter((event) => (event.payload as { decisionIndex?: number }).decisionIndex === 0)
            .some((event) => event.eventType === "decision_resolved"),
        { timeout: 8_000 },
      )
      .toBe(true);

    const decisionZero = getEvents()
      .filter(
        (event) => event.eventType.startsWith("decision_") || event.eventType === "choice_selected",
      )
      .filter((event) => (event.payload as { decisionIndex?: number }).decisionIndex === 0);

    const order = decisionZero.map((event) => event.eventType);
    expect(order).toContain("decision_viewed");
    expect(order).toContain("choice_selected");
    expect(order).toContain("decision_resolved");
    expect(order.indexOf("decision_viewed")).toBeLessThan(order.indexOf("choice_selected"));
    expect(order.indexOf("choice_selected")).toBeLessThan(order.indexOf("decision_resolved"));
  });

  test("run_id reste stable après un rechargement de page", async ({ page }) => {
    await grantAnalyticsConsent(page);
    const getEvents = collectIngestionEvents(page);

    await startCampaignAndResolveOneDecision(page);
    await page.waitForTimeout(1_500);
    const runStarted = getEvents().find((event) => event.eventType === "run_started");
    expect(runStarted?.runId).toBeTruthy();
    const originalRunId = runStarted!.runId;

    await page.reload();
    await page.waitForTimeout(500);
    const consequenceContinue = page.getByRole("button", { name: /^Continuer$/i });
    if (await consequenceContinue.isVisible().catch(() => false)) await consequenceContinue.click();
    const nextChoice = page.getByTestId("event-choice").first();
    if (await nextChoice.isVisible().catch(() => false)) await nextChoice.click();
    await page.waitForTimeout(1_500);

    const afterReload = getEvents().filter((event) => event.runId !== undefined);
    expect(afterReload.length).toBeGreaterThan(0);
    for (const event of afterReload) {
      expect(event.runId).toBe(originalRunId);
    }
  });
});
