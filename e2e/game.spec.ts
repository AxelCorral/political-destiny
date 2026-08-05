import { expect, test, type Page } from "@playwright/test";

import { gameContent } from "../src/game/data";
import { createGame, currentEvent, resolveCurrentChoice } from "../src/game/engine";
import type { CompletedRunSummary, GameState } from "../src/game/types";

async function dismissFictionNotice(page: Page) {
  const notice = page.getByRole("dialog", { name: /Avant d’entrer en campagne/i });
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: /J’ai compris/i }).click();
  await expect(notice).toBeHidden();
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

interface Milestones {
  firstRound?: string;
  secondRound?: string;
  governmentDecisions: number;
}

async function playCampaign(
  page: Page,
  options: { stopAtFirstRound?: boolean } = {},
): Promise<Milestones> {
  const milestones: Milestones = { governmentDecisions: 0 };

  for (let guard = 0; guard < 180; guard += 1) {
    if (
      await page
        .getByRole("button", { name: /^Rejouer$/i })
        .isVisible()
        .catch(() => false)
    ) {
      return milestones;
    }

    const firstRoundMarker = page.getByText(/Soirée électorale fictive · Premier tour/i);
    if (await firstRoundMarker.isVisible().catch(() => false)) {
      milestones.firstRound = (await page.getByRole("heading", { level: 1 }).textContent()) ?? "";
      if (options.stopAtFirstRound) return milestones;
      await page.getByRole("button", { name: /Entrer dans l’entre-deux-tours/i }).click();
      continue;
    }

    const secondRoundMarker = page.getByText(/Soirée électorale fictive · Second tour/i);
    if (await secondRoundMarker.isVisible().catch(() => false)) {
      milestones.secondRound = (await page.getByRole("heading", { level: 1 }).textContent()) ?? "";
      await page
        .getByRole("button", { name: /Former les premiers choix|Découvrir le bilan/i })
        .click();
      continue;
    }

    const consequence = page.getByText("Conséquence", { exact: true });
    if (await consequence.isVisible().catch(() => false)) {
      await page.getByRole("button", { name: /^Continuer$/i }).click();
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

    const pronounce = page.getByRole("button", { name: /Prononcer la conclusion/i });
    if (await pronounce.isVisible().catch(() => false)) {
      await page.locator('button[aria-pressed="false"]').first().click();
      await pronounce.click();
      continue;
    }

    const precision = page.getByRole("button", { name: /Précision/i }).first();
    if (await precision.isVisible().catch(() => false)) {
      await precision.click();
      continue;
    }

    const confirm = page.getByRole("button", { name: /Confirmer ma décision/i });
    if (await confirm.isVisible().catch(() => false)) {
      const eventCategory = await page
        .locator("article")
        .getAttribute("data-category")
        .catch(() => null);
      if (eventCategory === "government") milestones.governmentDecisions += 1;
      await page.locator('button[aria-pressed="false"]').first().click();
      await confirm.click();
      continue;
    }

    throw new Error(`Écran de campagne non reconnu après ${guard} transitions.`);
  }
  throw new Error("La campagne dépasse le garde-fou E2E.");
}

function finishFixture(seed: string, partyId = "ps"): GameState {
  let state = createGame(
    { seed, mode: "existing_party", partyId, methodId: "presidential" },
    gameContent,
  );
  for (let guard = 0; state.phase !== "finished" && guard < 60; guard += 1) {
    const event = currentEvent(state, gameContent.events);
    state = resolveCurrentChoice(state, event.choices[0]!.id, gameContent).state;
  }
  if (!state.finalResult) throw new Error("La fixture E2E n’a pas produit de bilan.");
  return state;
}

function archiveFromState(state: GameState): CompletedRunSummary {
  const party = state.parties[state.playerPartyId]!;
  const result = state.finalResult!;
  const best = result.bestDecisionIndex
    ? state.decisionHistory.find((decision) => decision.decisionIndex === result.bestDecisionIndex)
    : undefined;
  return {
    id: state.runId,
    version: state.version,
    completedAt: "2026-08-05T12:00:00.000Z",
    seed: state.seed,
    mode: state.mode,
    candidateName: state.player.displayName,
    partyId: party.id,
    partyName: party.displayName,
    partyShortName: party.shortName,
    partyVisual: party.visual,
    score: result.score,
    resultTitle: result.title,
    finalVoteShare: result.finalVoteShare,
    won: result.won,
    badges: result.unlockedAchievementIds,
    bestFeat: best?.outcomeTitle ?? result.title,
    finalResult: result,
    pollHistory: state.pollHistory,
    decisions: state.decisionHistory,
  };
}

async function importArchiveFixture(page: Page, state: GameState) {
  const archive = archiveFromState(state);
  const payload = {
    format: "vers-lelysee-local-data",
    exportedAt: "2026-08-05T12:00:00.000Z",
    schemaVersion: 1,
    archives: [archive],
    profile: {
      schemaVersion: 1,
      completedRuns: 1,
      victories: Number(archive.won),
      bestScore: archive.score,
      unlockedAchievementIds: archive.badges,
      playedPartyIds: [archive.partyId],
      discoveredEndingIds: [archive.finalResult.endingId],
      lastPlayedAt: archive.completedAt,
    },
    settings: { reducedMotion: true, soundEnabled: false, fictionNoticeSeen: true },
  };
  await page.goto("/parametres");
  await page.locator('input[type="file"]').setInputFiles({
    name: "fixture-vers-lelysee.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(payload)),
  });
  await expect(page.getByRole("status")).toContainText("Données importées");
  return archive;
}

test("1 · accueil, avertissement et navigation éditoriale", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Vers l’Élysée/i })).toBeVisible();
  await expect(page.getByText(/Simulation politique fictive/i).first()).toBeVisible();
  await page.getByRole("link", { name: "Méthodologie" }).click();
  await expect(page.getByRole("heading", { name: "Méthodologie" })).toBeVisible();
  await expect(
    page.getByText(/paramètres éditoriaux de gameplay, datés et révisables/i),
  ).toBeVisible();
});

test("2 · démarrage avec un parti existant sur mobile et ordinateur", async ({ page }) => {
  await startExistingCampaign(page, "Parti socialiste", "e2e-existing-start");
  await expect(page.getByText("Clara Villedieu").first()).toBeVisible();
  await expect(page.getByText(/J − 365/i)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("3 · partie complète avec un mouvement personnalisé", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Le parcours complet est couvert une fois, la création reste testée sur mobile par les composants.",
  );
  await page.goto("/jouer");
  await dismissFictionNotice(page);
  await page.getByRole("button", { name: /Créer mon parti/i }).click();
  for (let step = 0; step < 5; step += 1)
    await page.getByRole("button", { name: /^Continuer$/i }).click();
  await page.getByRole("button", { name: /Valider ce mouvement/i }).click();
  await page.getByRole("button", { name: /Présidentiable/i }).click();
  await page.getByRole("textbox", { name: /Graine de partie/i }).fill("e2e-custom-complete");
  await page.getByRole("button", { name: /Lancer la campagne/i }).click();
  await page.getByRole("button", { name: /Entrer en campagne/i }).click();
  await playCampaign(page);
  await expect(page.getByRole("button", { name: /^Rejouer$/i })).toBeVisible();
  await page.goto("/archives");
  await expect(page.getByText("Mouvement des possibles").first()).toBeVisible();
});

test("4 · mode tout aléatoire reproductible par sa graine", async ({ page }) => {
  await page.goto("/jouer");
  await dismissFictionNotice(page);
  await page.getByRole("button", { name: /Tout aléatoire/i }).click();
  await page.getByRole("textbox", { name: /Graine de partie/i }).fill("même-défi-e2e");
  await page.getByRole("button", { name: /Lancer la campagne/i }).click();
  const introduction = await page.getByRole("heading", { level: 1 }).textContent();
  await expect(page.getByText(/Graine : même-défi-e2e/i)).toBeVisible();
  expect(introduction).toMatch(/campagne commence/i);
});

test("5 · autosauvegarde et reprise après rechargement", async ({ page }) => {
  await startExistingCampaign(page, "Parti socialiste", "e2e-autosave");
  await page.locator('button[aria-pressed="false"]').first().click();
  await page.getByRole("button", { name: /Confirmer ma décision/i }).click();
  await expect(page.getByText("Conséquence", { exact: true })).toBeVisible();
  await page.waitForTimeout(250);
  await page.reload();
  await expect(page.getByRole("button", { name: /Ouvrir le tableau de bord/i })).toBeVisible();
  await page.getByRole("button", { name: /Ouvrir le tableau de bord/i }).click();
  await page.getByRole("tab", { name: /Décisions/i }).click();
  await expect(page.getByText(/Décision 1/i)).toBeVisible();
});

test("6 · tableau de bord, programme émergent et actualités", async ({ page }) => {
  await startExistingCampaign(page, "Parti socialiste", "e2e-dashboard");
  await page.getByRole("button", { name: /Ouvrir le tableau de bord/i }).click();
  await expect(page.getByRole("heading", { name: /Indicateurs principaux/i })).toBeVisible();
  await page.getByRole("tab", { name: /Programme/i }).click();
  await expect(page.getByRole("heading", { name: /Programme initial/i })).toBeVisible();
  await page.getByRole("tab", { name: /Actualités/i }).click();
  await expect(page.getByText(/campagne s’installe|Fil de campagne fictif/i).first()).toBeVisible();
});

test("7 · qualification contrôlée au second tour", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Fixture électorale longue exécutée sur Chromium desktop.",
  );
  await startExistingCampaign(page, "Parti socialiste", "e2e-ps-0");
  const milestones = await playCampaign(page, { stopAtFirstRound: true });
  expect(milestones.firstRound).toMatch(/second tour/i);
  await expect(page.getByText(/Participation simulée/i)).toBeVisible();
});

test("8 · élimination contrôlée au premier tour et bilan final", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Fixture électorale longue exécutée sur Chromium desktop.",
  );
  await startExistingCampaign(page, "Parti socialiste", "e2e-ps-5");
  const milestones = await playCampaign(page);
  expect(milestones.firstRound).toMatch(/5e au premier tour/i);
  await expect(page.getByRole("button", { name: /^Rejouer$/i })).toBeVisible();
});

test("9 · défaite contrôlée au second tour", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Fixture électorale longue exécutée sur Chromium desktop.",
  );
  await startExistingCampaign(page, "Rassemblement national", "e2e-rn-0");
  const milestones = await playCampaign(page);
  expect(milestones.firstRound).toMatch(/second tour/i);
  expect(milestones.secondRound).toMatch(/verdict des urnes/i);
  await expect(page.getByRole("button", { name: /^Rejouer$/i })).toBeVisible();
});

test("10 · victoire contrôlée, épilogue gouvernemental et bilan", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Fixture électorale longue exécutée sur Chromium desktop.",
  );
  await startExistingCampaign(page, "Parti socialiste", "e2e-ps-0");
  const milestones = await playCampaign(page);
  expect(milestones.secondRound).toMatch(/remportez l’élection/i);
  expect(milestones.governmentDecisions).toBe(2);
  await expect(page.getByRole("heading", { name: /Pourquoi ce score/i })).toBeVisible();
  await expect(page.getByText(/Graine déterministe/i)).toBeVisible();
  await page.waitForTimeout(250);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Pourquoi ce score/i })).toBeVisible();
});

test("11 · archive, badges et génération d’une carte PNG", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "La génération binaire est vérifiée une fois sur Chromium desktop.",
  );
  const state = finishFixture("e2e-ps-0");
  const archive = await importArchiveFixture(page, state);
  await page.goto("/archives");
  await expect(page.getByText(archive.candidateName).first()).toBeVisible();
  await page.getByRole("link", { name: "Ouvrir" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Partager la carrière/i }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/vers-lelysee-.*\.png/);
  await page.goto("/badges");
  await expect(page.getByText(/badges débloqués/i)).toBeVisible();
  await expect(page.getByText("Premier bulletin").first()).toBeVisible();
});

test("12 · export/import JSON, confidentialité, hors-ligne et 404", async ({ page }) => {
  await page.goto("/parametres");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Exporter en JSON/i }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.locator('input[type="file"]').setInputFiles(path!);
  await expect(page.getByRole("status")).toContainText("Données importées");
  await page.goto("/confidentialite");
  await expect(page.getByRole("heading", { name: "Confidentialité" })).toBeVisible();
  await page.goto("/hors-ligne");
  await expect(page.getByRole("heading", { name: /hors connexion/i })).toBeVisible();
  await page.goto("/cette-page-nexiste-pas");
  await expect(page.getByRole("heading", { name: /circonscription n’existe pas/i })).toBeVisible();
});
