import { expect, test, type Page } from "@playwright/test";

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

  test("n'envoie rien sans consentement explicite (comportement par défaut)", async ({ page }) => {
    let sawIngestionRequest = false;
    page.on("request", (request) => {
      if (request.url().includes("/api/analytics/events")) sawIngestionRequest = true;
    });

    await startCampaignAndResolveOneDecision(page);
    await page.waitForTimeout(2_000);

    expect(sawIngestionRequest).toBe(false);
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
});
