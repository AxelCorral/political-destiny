/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI evaluates this file as a function expression. */

async (page) => {
  const transitions = [];
  const milestones = [];
  let decisionCounter = 1;

  const pageState = async (kind) => ({
    kind,
    heading: await page
      .getByRole("heading", { level: 1 })
      .first()
      .textContent()
      .catch(() => null),
    documentHeight: await page.evaluate(() => document.documentElement.scrollHeight),
    viewportHeight: await page.evaluate(() => innerHeight),
  });

  for (let guard = 0; guard < 180; guard += 1) {
    if (
      await page
        .getByRole("button", { name: /^Rejouer$/i })
        .isVisible()
        .catch(() => false)
    ) {
      await page.screenshot({ path: "audit/screenshots/bilan-360x800-long.png", fullPage: true });
      return {
        completed: true,
        decisions: decisionCounter,
        transitions,
        milestones,
        final: await pageState("final"),
      };
    }

    const firstRoundMarker = page.getByText(/Soirée électorale fictive · Premier tour/i);
    if (await firstRoundMarker.isVisible().catch(() => false)) {
      const state = await pageState("first_round");
      milestones.push(state);
      await page.screenshot({
        path: "audit/screenshots/premier-tour-360x800-long.png",
        fullPage: true,
      });
      await page.getByRole("button", { name: /Entrer dans l’entre-deux-tours/i }).click();
      continue;
    }

    const secondRoundMarker = page.getByText(/Soirée électorale fictive · Second tour/i);
    if (await secondRoundMarker.isVisible().catch(() => false)) {
      const state = await pageState("second_round");
      milestones.push(state);
      await page.screenshot({
        path: "audit/screenshots/second-tour-360x800-long.png",
        fullPage: true,
      });
      await page
        .getByRole("button", { name: /Former les premiers choix|Découvrir le bilan/i })
        .click();
      continue;
    }

    if (
      await page
        .getByText("Conséquence", { exact: true })
        .isVisible()
        .catch(() => false)
    ) {
      const outcomeHeading = await page.getByRole("heading", { level: 1 }).first().textContent();
      const narrative = await page
        .locator("article p")
        .nth(1)
        .textContent()
        .catch(() => null);
      transitions.push({ kind: "outcome", outcomeHeading, narrative });
      await page.getByRole("button", { name: /^Continuer$/i }).click();
      continue;
    }

    if (
      await page
        .getByRole("heading", { name: /État de la course/i })
        .isVisible()
        .catch(() => false)
    ) {
      milestones.push(await pageState("poll_dashboard"));
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
      const options = page.locator('button[aria-pressed="false"]');
      const count = await options.count();
      const selected = options.nth(decisionCounter % Math.max(1, count));
      transitions.push({
        kind: "debate",
        eventHeading: await page.getByRole("heading", { level: 1 }).first().textContent(),
        selected: await selected.textContent(),
      });
      await selected.click();
      await pronounce.click();
      decisionCounter += 1;
      continue;
    }

    const precision = page.getByRole("button", { name: /Précision/i }).first();
    if (await precision.isVisible().catch(() => false)) {
      await precision.click();
      continue;
    }

    const confirm = page.getByRole("button", { name: /Confirmer ma décision/i });
    if (await confirm.isVisible().catch(() => false)) {
      const options = page.locator('button[aria-pressed="false"]');
      const count = await options.count();
      const index = decisionCounter % Math.max(1, count);
      const selected = options.nth(index);
      const eventHeading = await page.getByRole("heading", { level: 1 }).first().textContent();
      const allChoices = await options.allTextContents();
      const selectedLabel = await selected.textContent();
      transitions.push({ kind: "decision", eventHeading, allChoices, selected: selectedLabel });
      await selected.click();
      await confirm.click();
      decisionCounter += 1;
      continue;
    }

    throw new Error(`Écran non reconnu après ${guard} transitions : ${await page.title()}`);
  }

  return { completed: false, decisions: decisionCounter, transitions, milestones };
};
