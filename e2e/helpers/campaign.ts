import { expect, type Page } from "@playwright/test";

export async function dismissFictionNotice(page: Page) {
  const notice = page.getByRole("dialog", { name: /Avant d’entrer en campagne/i });
  const setupChoice = page.getByRole("button", { name: /Un parti existant/i });
  await expect(notice.or(setupChoice)).toBeVisible();
  if (await notice.isVisible().catch(() => false)) {
    await notice.getByRole("button", { name: /J’ai compris/i }).click();
    await expect(notice).toBeHidden();
  }
}

export async function startExistingCampaign(page: Page, partyName: string, seed: string) {
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
