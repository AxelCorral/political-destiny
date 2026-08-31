import { expect, test, type Page } from "@playwright/test";

import { startExistingCampaign } from "./helpers/campaign";

interface ActiveSave {
  runId: string;
  seed: string;
  decisionIndex: number;
}

/**
 * Lit la sauvegarde active directement dans IndexedDB : l'identité réelle du
 * run est la seule preuve fiable qu'une campagne a été reprise plutôt que
 * recréée (et inversement) — l'écran seul ne le dit pas.
 */
async function readActiveSave(page: Page): Promise<ActiveSave | undefined> {
  return page.evaluate(async () => {
    const request = indexedDB.open("vers-lelysee");
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return new Promise<ActiveSave | undefined>((resolve) => {
      const get = db.transaction("active", "readonly").objectStore("active").get("current");
      get.onsuccess = () => {
        const value = get.result as ActiveSave | undefined;
        resolve(
          value
            ? { runId: value.runId, seed: value.seed, decisionIndex: value.decisionIndex }
            : undefined,
        );
      };
      get.onerror = () => resolve(undefined);
    });
  });
}

/** Une décision jouée, puis retour à l'écran de campagne quel que soit l'interstitiel. */
async function playOneDecision(page: Page) {
  await page.getByTestId("event-choice").first().click();
  // Les débats et crises titrent « Conséquence notable / majeure » : la graine
  // décide de la catégorie du premier événement, l'assertion doit couvrir les trois.
  await expect(page.getByText(/^Conséquence( notable| majeure)?$/)).toBeVisible();
  await page.getByRole("button", { name: /^Continuer$/i }).click();
  if (
    await page
      .getByRole("heading", { name: /État de la course/i })
      .isVisible()
      .catch(() => false)
  ) {
    await page.getByRole("button", { name: /Reprendre la campagne/i }).click();
  }
  await expect(page.getByRole("button", { name: /Ouvrir le tableau de bord/i })).toBeVisible();
}

/**
 * Retour à l'accueil par navigation applicative — et non par `page.goto`, qui
 * rechargerait la page et remettrait à zéro le store zustand : c'est justement
 * ce store survivant qui faisait retomber « Nouvelle partie » sur la campagne
 * sauvegardée.
 */
async function saveAndQuitToHome(page: Page) {
  await page.getByRole("button", { name: /Sauvegarder et quitter/i }).click();
  await expect(page.getByText(/Campagne sauvegardée/i)).toBeVisible();
}

async function expectSetupFlow(page: Page) {
  await expect(page.getByRole("button", { name: /Un parti existant/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ouvrir le tableau de bord/i })).toBeHidden();
}

test("13 · « Nouvelle partie » et « Lancer une campagne » ne reprennent jamais la sauvegarde active", async ({
  page,
}) => {
  await startExistingCampaign(page, "Parti socialiste", "e2e-new-campaign-flow");
  await playOneDecision(page);
  await saveAndQuitToHome(page);

  const initial = await readActiveSave(page);
  expect(initial?.decisionIndex).toBe(1);

  // « Reprendre » charge exactement le run existant.
  await page.getByRole("button", { name: /^Reprendre$/ }).click();
  await expect(page.getByRole("button", { name: /Ouvrir le tableau de bord/i })).toBeVisible();
  expect(await readActiveSave(page)).toEqual(initial);
  await page.getByRole("button", { name: /Ouvrir le tableau de bord/i }).click();
  await page.getByRole("tab", { name: /Décisions/i }).click();
  await expect(page.getByText(/Décision 1/i)).toBeVisible();
  await page
    .getByRole("button", { name: /Fermer/i })
    .first()
    .click();
  await saveAndQuitToHome(page);

  // « Nouvelle partie » confirme, puis ouvre réellement le flux initial.
  await page.getByRole("button", { name: /Nouvelle partie/i }).click();
  const confirmation = page.getByRole("dialog", { name: /Démarrer une nouvelle campagne/i });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: /^Démarrer une nouvelle campagne$/ }).click();
  await expectSetupFlow(page);
  expect(await readActiveSave(page)).toBeUndefined();

  // §12 — l'hydratation ne doit pas ramener l'ancienne campagne.
  await page.reload();
  await expectSetupFlow(page);
  expect(await readActiveSave(page)).toBeUndefined();

  // « Lancer une campagne » suit exactement la même intention.
  await startExistingCampaign(page, "Parti socialiste", "e2e-new-campaign-flow-2");
  await playOneDecision(page);
  await saveAndQuitToHome(page);
  const second = await readActiveSave(page);
  expect(second?.seed).toBe("e2e-new-campaign-flow-2");

  await page.getByRole("link", { name: /Lancer une campagne/i }).click();
  const heroConfirmation = page.getByRole("dialog", { name: /Une campagne est déjà en cours/i });
  await expect(heroConfirmation).toBeVisible();
  await heroConfirmation.getByRole("button", { name: /^Démarrer une nouvelle campagne$/ }).click();
  await expectSetupFlow(page);
  expect(await readActiveSave(page)).toBeUndefined();
});

test("14 · annuler la confirmation laisse la campagne sauvegardée strictement intacte", async ({
  page,
}) => {
  await startExistingCampaign(page, "Parti socialiste", "e2e-new-campaign-cancel");
  await playOneDecision(page);
  await saveAndQuitToHome(page);
  const before = await readActiveSave(page);

  const trigger = page.getByRole("button", { name: /Nouvelle partie/i });
  await trigger.click();
  const confirmation = page.getByRole("dialog", { name: /Démarrer une nouvelle campagne/i });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: /^Annuler$/ }).click();

  await expect(confirmation).toBeHidden();
  await expect(page.getByText(/Campagne sauvegardée/i)).toBeVisible();
  expect(page.url()).toMatch(/\/$/);
  expect(await readActiveSave(page)).toEqual(before);
  // Le focus revient sur le déclencheur (§15).
  await expect(trigger).toBeFocused();

  // La campagne reste reprenable après l'annulation.
  await page.getByRole("button", { name: /^Reprendre$/ }).click();
  await expect(page.getByRole("button", { name: /Ouvrir le tableau de bord/i })).toBeVisible();
  expect(await readActiveSave(page)).toEqual(before);
});

test("15 · « Lancer une campagne » laisse le choix entre reprendre et recommencer", async ({
  page,
}) => {
  await startExistingCampaign(page, "Parti socialiste", "e2e-new-campaign-choice");
  await playOneDecision(page);
  await saveAndQuitToHome(page);
  const before = await readActiveSave(page);
  expect(before?.decisionIndex).toBe(1);

  const cta = page.getByRole("link", { name: /Lancer une campagne/i });
  const choice = page.getByRole("dialog", { name: /Une campagne est déjà en cours/i });

  // Le dialogue identifie la campagne concernée et propose les trois issues.
  await cta.click();
  await expect(choice).toBeVisible();
  await expect(choice).toContainText(/Parti socialiste/i);
  await expect(choice).toContainText(/1 décision prise/i);
  await expect(choice.getByRole("button", { name: /^Annuler$/ })).toBeVisible();
  await expect(choice.getByRole("button", { name: /^Reprendre la campagne$/ })).toBeVisible();
  await expect(
    choice.getByRole("button", { name: /^Démarrer une nouvelle campagne$/ }),
  ).toBeVisible();

  // Annuler : on reste sur l'accueil, la sauvegarde est intacte, le focus revient.
  await choice.getByRole("button", { name: /^Annuler$/ }).click();
  await expect(choice).toBeHidden();
  expect(page.url()).toMatch(/\/$/);
  expect(await readActiveSave(page)).toEqual(before);
  await expect(cta).toBeFocused();

  // Reprendre : la campagne existante repart, avec sa progression.
  await cta.click();
  await choice.getByRole("button", { name: /^Reprendre la campagne$/ }).click();
  await expect(page.getByRole("button", { name: /Ouvrir le tableau de bord/i })).toBeVisible();
  expect(await readActiveSave(page)).toEqual(before);
  await page.getByRole("button", { name: /Ouvrir le tableau de bord/i }).click();
  await page.getByRole("tab", { name: /Décisions/i }).click();
  await expect(page.getByText(/Décision 1/i)).toBeVisible();
  await page
    .getByRole("button", { name: /Fermer/i })
    .first()
    .click();
  await saveAndQuitToHome(page);

  // Démarrer une nouvelle campagne : le flux initial, et l'ancienne ne revient pas.
  await cta.click();
  await choice.getByRole("button", { name: /^Démarrer une nouvelle campagne$/ }).click();
  await expectSetupFlow(page);
  expect(await readActiveSave(page)).toBeUndefined();
  await page.reload();
  await expectSetupFlow(page);
  expect(await readActiveSave(page)).toBeUndefined();
});
