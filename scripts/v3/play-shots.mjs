// Joue une campagne aléatoire dans Chromium headless et capture les scènes 3D.
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const out = "docs/v3/shots";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(600000);
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e.stack ?? e).slice(0, 1200)));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 600)); });
const clickText = async (re) => {
  const el = page.getByRole("button", { name: re }).first();
  if (await el.isVisible().catch(() => false)) {
    await el.click();
    return true;
  }
  return false;
};
await page.goto(base + "/jouer", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(8000);
for (const re of [/J’ai compris/, /Tout aléatoire/, /Lancer la campagne/]) {
  const b = page.getByRole("button", { name: re }).first();
  if (await b.isVisible().catch(() => false)) await b.click();
  await page.waitForTimeout(3000);
}
const shots = { campaign: false, debate: false, podium: false, elysee: false };
for (let step = 0; step < 160 && !shots.elysee; step++) {
  const text = await page
    .locator("main, body")
    .first()
    .innerText()
    .catch(() => "");
  const hasCanvas = (await page.locator("canvas").count()) > 0;
  const choices = page.locator('[data-testid="event-choice"]');
  if (hasCanvas && /Soirée électorale/.test(text) && !shots.podium) {
    await page.waitForTimeout(12000);
    await page.screenshot({ path: `${out}/podium.png` });
    shots.podium = true;
  } else if (hasCanvas && /Fin de campagne/.test(text)) {
    await page.waitForTimeout(12000);
    await page.screenshot({ path: `${out}/elysee.png`, fullPage: false });
    shots.elysee = true;
    break;
  } else if (
    hasCanvas &&
    (await page.locator('[data-category="debate"]').count()) &&
    !shots.debate
  ) {
    await page.waitForTimeout(12000);
    await page.screenshot({ path: `${out}/debate.png` });
    shots.debate = true;
  } else if (hasCanvas && step >= 14 && !shots.campaign) {
    await page.waitForTimeout(12000);
    await page.screenshot({ path: `${out}/campaign.png` });
    shots.campaign = true;
  }
  // Avance : premier choix de la carte, sinon bouton de continuation.
  if (await choices.count()) await choices.first().click();
  else {
    let moved = false;
    for (const re of [
      /Continuer/,
      /Entrer/,
      /Commencer/,
      /Former/,
      /Découvrir/,
      /Fermer/,
      /bilan/i,
      /second tour/i,
      /Démarrer/,
      /Suivant/,
    ]) {
      if (await clickText(re)) {
        moved = true;
        break;
      }
    }
    if (!moved) {
      moved = await page.evaluate(() => {
        const wanted = [/Reprendre la campagne/, /Continuer/, /Entrer/, /Former/, /Découvrir/, /bilan/i, /second tour/i];
        const buttons = [...document.querySelectorAll("button")].filter((b) => b.offsetParent !== null && !b.disabled);
        for (const re of wanted) {
          const hit = buttons.find((b) => re.test(b.textContent ?? ""));
          if (hit) { hit.scrollIntoView(); hit.click(); return true; }
        }
        return false;
      });
    }
    if (!moved) console.log("bloqué:", text.slice(0, 160).replace(/\s+/g, " "));
  }
  await page.waitForTimeout(2500);
}
console.log(JSON.stringify(shots));
await browser.close();
