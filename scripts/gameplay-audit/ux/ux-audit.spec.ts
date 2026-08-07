import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

const SHOT_DIR = resolve(import.meta.dirname, "../../../audit-results/gameplay/screenshots");
const timingLog: Array<{ project: string; step: string; ms: number }> = [];

async function shot(page: Page, project: string, name: string) {
  await mkdir(resolve(SHOT_DIR, project), { recursive: true });
  await page.screenshot({ path: resolve(SHOT_DIR, project, `${name}.png`), fullPage: false });
}

async function timed<T>(project: string, step: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  timingLog.push({ project, step, ms: Date.now() - start });
  return result;
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

async function startExistingCampaign(page: Page, partyName: string, seed: string) {
  await page.goto("/jouer");
  await dismissFictionNotice(page);
  await page.getByRole("button", { name: /Un parti existant/i }).click();
  await page
    .getByRole("button", { name: new RegExp(`Emblème abstrait de ${partyName}`, "i") })
    .click();
  await page.getByRole("button", { name: /Choisir ce parti/i }).click();
  await page.getByRole("button", { name: /Présidentiable/i }).click();
  await page.getByRole("textbox", { name: /Graine de partie/i }).fill(seed);
  await page.getByRole("button", { name: /Lancer la campagne/i }).click();
  await page.getByRole("button", { name: /Entrer en campagne/i }).click();
  await expect(page.getByRole("button", { name: /Ouvrir le tableau de bord/i })).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("home, navigation editoriale, party select", async ({ page }, testInfo) => {
  const project = testInfo.project.name;

  await timed(project, "home-load", () => page.goto("/"));
  await expect(page.getByRole("heading", { name: /Vers l’Élysée/i })).toBeVisible();
  await shot(page, project, "01-accueil");

  await page.getByRole("link", { name: "Méthodologie" }).click();
  await expect(page.getByRole("heading", { name: "Méthodologie" })).toBeVisible();
  await shot(page, project, "02-methodologie");

  await page.goto("/jouer");
  await dismissFictionNotice(page);
  await shot(page, project, "03-selection-mode");

  await page.getByRole("button", { name: /Un parti existant/i }).click();
  await shot(page, project, "04-selection-parti");

  // Custom party creation flow: screenshot each step of the questionnaire.
  await page.goto("/jouer");
  await page.getByRole("button", { name: /Créer mon parti/i }).click();
  await shot(page, project, "05-creation-parti-etape1");
  for (let step = 0; step < 5; step += 1) {
    await page.getByRole("button", { name: /^Continuer$/i }).click();
    await shot(page, project, `05-creation-parti-etape${step + 2}`);
  }
  await expect(page.getByRole("button", { name: /Valider ce mouvement/i })).toBeVisible();
  await shot(page, project, "05-creation-parti-recapitulatif");
});

test("campagne complete, tableau de bord, elections, bilan", async ({ page }, testInfo) => {
  const project = testInfo.project.name;
  test.setTimeout(150_000);

  await timed(project, "start-campaign", () =>
    startExistingCampaign(page, "Parti socialiste", "e2e-ps-0"),
  );
  await shot(page, project, "06-carte-evenement-initiale");

  // Dashboard tabs (journal / poll-equivalent / programme / actualités).
  await page.getByRole("button", { name: /Ouvrir le tableau de bord/i }).click();
  await expect(page.getByRole("heading", { name: /Indicateurs principaux/i })).toBeVisible();
  await shot(page, project, "07-tableau-de-bord-indicateurs");
  await page.getByRole("tab", { name: /Décisions/i }).click();
  await shot(page, project, "08-tableau-de-bord-decisions");
  await page.getByRole("tab", { name: /Programme/i }).click();
  await shot(page, project, "09-tableau-de-bord-programme");
  await page.getByRole("tab", { name: /Actualités/i }).click();
  await shot(page, project, "10-tableau-de-bord-actualites");
  await page.keyboard.press("Escape").catch(() => {});

  // Play through decisions, screenshotting the first consequence panel and
  // milestones (first round / second round / final bilan).
  let capturedConsequence = false;
  let capturedFirstRound = false;
  let capturedSecondRound = false;
  for (let guard = 0; guard < 180; guard += 1) {
    if (
      await page
        .getByRole("button", { name: /^Rejouer$/i })
        .isVisible()
        .catch(() => false)
    ) {
      await shot(page, project, "14-bilan-final");
      break;
    }
    const firstRoundMarker = page.getByText(/Soirée électorale fictive · Premier tour/i);
    if (await firstRoundMarker.isVisible().catch(() => false)) {
      if (!capturedFirstRound) {
        await shot(page, project, "12-resultat-premier-tour");
        capturedFirstRound = true;
      }
      await page.getByRole("button", { name: /Entrer dans l’entre-deux-tours/i }).click();
      continue;
    }
    const secondRoundMarker = page.getByText(/Soirée électorale fictive · Second tour/i);
    if (await secondRoundMarker.isVisible().catch(() => false)) {
      if (!capturedSecondRound) {
        await shot(page, project, "13-resultat-second-tour");
        capturedSecondRound = true;
      }
      await page
        .getByRole("button", { name: /Former les premiers choix|Découvrir le bilan/i })
        .click();
      continue;
    }
    const consequence = page.getByText("Conséquence", { exact: true });
    if (await consequence.isVisible().catch(() => false)) {
      if (!capturedConsequence) {
        await shot(page, project, "11-carte-consequence");
        capturedConsequence = true;
      }
      await timed(project, "click-continuer", () =>
        page.getByRole("button", { name: /^Continuer$/i }).click(),
      );
      continue;
    }
    if (
      await page
        .getByRole("heading", { name: /État de la course/i })
        .isVisible()
        .catch(() => false)
    ) {
      await page.getByRole("button", { name: /Reprendre la campagne/i }).click();
      continue;
    }
    if (
      await page
        .getByRole("button", { name: /Entrer en campagne/i })
        .isVisible()
        .catch(() => false)
    ) {
      await page.getByRole("button", { name: /Entrer en campagne/i }).click();
      continue;
    }
    const firstChoice = page.getByTestId("event-choice").first();
    if (await firstChoice.isVisible().catch(() => false)) {
      await timed(project, "click-choice", () => firstChoice.click());
      continue;
    }
    throw new Error(`Écran de campagne non reconnu après ${guard} transitions.`);
  }

  await expect(page.getByRole("heading", { name: /Pourquoi ce score/i })).toBeVisible();
});

test.afterAll(async () => {
  await mkdir(SHOT_DIR, { recursive: true });
  await writeFile(resolve(SHOT_DIR, "timing-log.json"), JSON.stringify(timingLog, null, 2), "utf8");
});
