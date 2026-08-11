import { expect, test, type Page } from "@playwright/test";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase K (§27) — suite de captures
 * de référence Playwright pour les 11 cibles minimales du prompt, à
 * 390x844, 1366x768, et quelques cas à 1920x1080.
 *
 * Anti-flakiness :
 * - graines déterministes (chaque scénario est ancré sur une graine dont
 *   le déroulé a été vérifié manuellement pendant les phases C-J) ;
 * - `animations: "disabled"` fige toute animation/transition CSS sur son
 *   état final au moment de la capture (couvre animate-card-enter,
 *   animate-badge-reveal, animate-pill-reveal, animate-bar-grow,
 *   animate-score-pop, animate-overlay-in/animate-dialog-in) ;
 * - dates dérivées de la graine par le moteur, jamais de l'horloge système ;
 * - `document.fonts.ready` attendu avant chaque capture.
 *
 * Chaque test crée son propre contexte de navigateur isolé (fixture Page
 * par défaut de Playwright) : aucune réinitialisation manuelle de storage
 * n'est nécessaire entre scénarios.
 */

async function dismissFictionNotice(page: Page) {
  try {
    await page.getByRole("button", { name: /j.ai compris/i }).click({ timeout: 4000 });
  } catch {
    // already dismissed or not shown
  }
}

async function startExistingCampaign(
  page: Page,
  partyPattern: RegExp,
  methodPattern: RegExp,
  seed: string,
) {
  await page.goto("/jouer");
  await dismissFictionNotice(page);
  await page.getByRole("button", { name: /Un parti existant/i }).click();
  await page.getByRole("button", { name: partyPattern }).click();
  await page.getByRole("button", { name: "Choisir ce parti" }).click();
  await page.getByRole("button", { name: methodPattern }).click();
  await page.getByRole("textbox", { name: /Graine de partie/i }).fill(seed);
  await page.getByRole("button", { name: /Lancer la campagne/i }).click();
  await page.getByRole("button", { name: /Entrer en campagne/i }).click();
}

async function advanceUntil(page: Page, textOrRole: RegExp, maxSteps: number) {
  for (let i = 0; i < maxSteps; i += 1) {
    await page.waitForTimeout(60);
    if (
      await page
        .getByText(textOrRole)
        .isVisible()
        .catch(() => false)
    )
      return true;

    const choiceButtons = page.getByTestId("event-choice");
    if (await choiceButtons.count().catch(() => 0)) {
      await choiceButtons.first().click();
      continue;
    }
    const continueBtn = page.getByRole("button", { name: /^Continuer$/i });
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      continue;
    }
    const resumeRace = page.getByRole("button", { name: /Reprendre la campagne/i });
    if (await resumeRace.isVisible().catch(() => false)) {
      await resumeRace.click();
      continue;
    }
    const enterRunoff = page.getByRole("button", { name: /Entrer dans l.entre-deux-tours/i });
    if (await enterRunoff.isVisible().catch(() => false)) {
      await enterRunoff.click();
      continue;
    }
    const enterDuel = page.getByRole("button", { name: /Entrer dans la dernière ligne droite/i });
    if (await enterDuel.isVisible().catch(() => false)) {
      await enterDuel.click();
      continue;
    }
    const formFirstChoices = page.getByRole("button", { name: /Former les premiers choix/i });
    if (await formFirstChoices.isVisible().catch(() => false)) {
      await formFirstChoices.click();
      continue;
    }
    const discoverBilan = page.getByRole("button", { name: /Découvrir le bilan/i });
    if (await discoverBilan.isVisible().catch(() => false)) {
      await discoverBilan.click();
      continue;
    }
  }
  return page
    .getByText(textOrRole)
    .isVisible()
    .catch(() => false);
}

async function readyToShoot(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

test.describe("visual regression — captures de référence", () => {
  test.beforeEach(({}, testInfo) => {
    // Chaque test fixe déjà ses propres viewports via setViewportSize ; ne
    // s'exécute que sous le projet "chromium" pour éviter des baselines
    // dupliquées et divergentes (UA/touch différents) sous le projet
    // "mobile" pour les mêmes tailles d'écran.
    test.skip(testInfo.project.name !== "chromium", "un seul projet gère les baselines visuelles");
  });

  test("routine card — 1366x768 et 390x844", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await startExistingCampaign(
      page,
      /Emblème abstrait de La France insoumise/i,
      /Le terrain d.abord/i,
      "visual-regression-routine-4",
    );
    await expect(page.getByTestId("event-choice").first()).toBeVisible();
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("routine-card-1366.png", { animations: "disabled" });

    await page.setViewportSize({ width: 390, height: 844 });
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("routine-card-390.png", { animations: "disabled" });
  });

  test("rare card — 1366x768 et 390x844", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await startExistingCampaign(
      page,
      /Emblème abstrait de La France insoumise/i,
      /Le terrain d.abord/i,
      "always-first-rare-lfi-1",
    );
    await advanceUntil(page, /Édition spéciale/i, 50);
    await expect(page.getByText("Édition spéciale")).toBeVisible();
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("rare-card-1366.png", { animations: "disabled" });

    await page.setViewportSize({ width: 390, height: 844 });
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("rare-card-390.png", { animations: "disabled" });
  });

  test("chain + decisive card (même événement, deux signaux combinés) — 1366x768", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await startExistingCampaign(
      page,
      /Emblème abstrait de La France insoumise/i,
      /Le terrain d.abord/i,
      "always-first-chain-lfi-7",
    );
    await advanceUntil(page, /Retour de dossier/i, 40);
    await expect(page.getByText("Retour de dossier")).toBeVisible();
    await expect(page.getByText("Décisif")).toBeVisible();
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("chain-decisive-card-1366.png", {
      animations: "disabled",
    });
  });

  test("government — 1366x768 et 1920x1080", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await startExistingCampaign(
      page,
      /Emblème abstrait de La France insoumise/i,
      /Le terrain d.abord/i,
      "always-first-gov-lfi-1",
    );
    await advanceUntil(page, /Vous gouvernez désormais/i, 90);
    await expect(page.getByText("Vous gouvernez désormais")).toBeVisible();
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("government-card-1366.png", { animations: "disabled" });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("government-card-1920.png", { animations: "disabled" });
  });

  test("résultat premier tour — 1366x768 et 1920x1080", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await startExistingCampaign(
      page,
      /Emblème abstrait de La France insoumise/i,
      /Le terrain d.abord/i,
      "always-first-gov-lfi-1",
    );
    await advanceUntil(page, /Soirée électorale · Premier tour/i, 60);
    await expect(page.getByText(/Soirée électorale · Premier tour/i)).toBeVisible();
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("first-round-result-1366.png", {
      animations: "disabled",
    });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("first-round-result-1920.png", {
      animations: "disabled",
    });
  });

  test("résultat second tour — 1366x768", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await startExistingCampaign(
      page,
      /Emblème abstrait de La France insoumise/i,
      /Le terrain d.abord/i,
      "always-first-gov-lfi-1",
    );
    await advanceUntil(page, /Soirée électorale · Second tour/i, 90);
    await expect(page.getByText(/Soirée électorale · Second tour/i)).toBeVisible();
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("second-round-result-1366.png", {
      animations: "disabled",
    });
  });

  test("victoire — 1366x768 et 390x844", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await startExistingCampaign(
      page,
      /Emblème abstrait de La France insoumise/i,
      /Le terrain d.abord/i,
      "always-first-gov-lfi-1",
    );
    await advanceUntil(page, /^Rejouer$/i, 100);
    await expect(page.getByRole("button", { name: /^Rejouer$/i })).toBeVisible();
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("victory-1366.png", { animations: "disabled" });

    await page.setViewportSize({ width: 390, height: 844 });
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("victory-390.png", { animations: "disabled" });
  });

  test("défaite — 1366x768", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await startExistingCampaign(
      page,
      /Emblème abstrait de La France insoumise/i,
      /Le terrain d.abord/i,
      "always-first-defeat-lfi-2",
    );
    await advanceUntil(page, /^Rejouer$/i, 90);
    await expect(page.getByRole("button", { name: /^Rejouer$/i })).toBeVisible();
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("defeat-1366.png", { animations: "disabled" });
  });

  test("tableau de bord mobile — 390x844", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await startExistingCampaign(
      page,
      /Emblème abstrait de La France insoumise/i,
      /Le terrain d.abord/i,
      "visual-regression-routine-4",
    );
    await page.getByRole("button", { name: "Ouvrir le tableau de bord" }).click();
    await expect(page.getByRole("heading", { name: "Quartier général" })).toBeVisible();
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("dashboard-390.png", { animations: "disabled" });
  });

  test("titre long, mobile (non-régression bug P1) — 390x844", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await startExistingCampaign(
      page,
      /Emblème abstrait de Nouvelle Énergie/i,
      /Le terrain d.abord/i,
      "seedhunt-0",
    );
    await advanceUntil(page, /Le permis d.entreprendre doit être défini/i, 10);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Le permis d’entreprendre doit être défini",
    );
    await readyToShoot(page);
    await expect(page).toHaveScreenshot("title-long-mobile-390.png", { animations: "disabled" });
  });
});
