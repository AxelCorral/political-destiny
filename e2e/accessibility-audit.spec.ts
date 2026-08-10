import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * FORM_GAME_FEEL_IMPROVEMENTS_REPORT.md Phase I (§26) — l'audit de forme
 * précédent n'avait mesuré l'accessibilité qu'à l'œil. Cette passe mesure
 * réellement, avec axe-core (déjà présent dans node_modules, aucune
 * dépendance ajoutée) injecté directement dans la page réelle, plus des
 * vérifications ciblées de focus visible et de taille tactile. Écrit
 * audit-results/form-improvement/post/accessibility-post.csv.
 *
 * Ne s'exécute que sous le projet "chromium" (voir playwright.config.ts)
 * pour éviter une double écriture concurrente du même fichier CSV par le
 * projet "mobile" — les scénarios mobiles sont couverts en resizant la page
 * à l'intérieur du test, pas via le projet Playwright.
 */

interface Row {
  screen: string;
  viewport: string;
  category: "axe" | "focus" | "tap-target" | "reduced-motion";
  ruleOrCheck: string;
  impact: string;
  detail: string;
}

interface AxeCheckResult {
  data?: { fgColor: string; bgColor: string; contrastRatio: number; expectedContrastRatio: string };
}

interface AxeNode {
  target: string[];
  any: AxeCheckResult[];
}

interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  nodes: AxeNode[];
}

const AXE_PATH = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");

async function injectAxe(page: Page) {
  await page.addScriptTag({ path: AXE_PATH });
}

async function runAxe(page: Page, screen: string, viewport: string, rows: Row[]) {
  await injectAxe(page);
  const results: { violations: AxeViolation[] } = await page.evaluate(async () => {
    // @ts-expect-error axe is injected globally by addScriptTag
    return await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] });
  });
  if (results.violations.length === 0) {
    rows.push({
      screen,
      viewport,
      category: "axe",
      ruleOrCheck: "none",
      impact: "none",
      detail: "Aucune violation WCAG 2 A/AA détectée",
    });
    return;
  }
  for (const violation of results.violations) {
    const nodeDetail = violation.nodes
      .slice(0, 4)
      .map((node) => {
        const target = node.target.join(" ");
        const colorData = node.any.find((check) => check.data?.fgColor)?.data;
        const colors = colorData
          ? ` [${colorData.fgColor} sur ${colorData.bgColor}, ratio ${colorData.contrastRatio}, requis ${colorData.expectedContrastRatio}]`
          : "";
        return `${target}${colors}`;
      })
      .join(" ; ");
    rows.push({
      screen,
      viewport,
      category: "axe",
      ruleOrCheck: violation.id,
      impact: violation.impact ?? "unknown",
      detail: `${violation.help} (${violation.nodes.length} nœud(s)) — ${nodeDetail}`,
    });
  }
}

async function checkFocusVisible(page: Page, screen: string, viewport: string, rows: Row[]) {
  await page.keyboard.press("Tab");
  const outcome = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { visible: false, tag: "none" };
    const style = getComputedStyle(el);
    const hasOutline = style.outlineStyle !== "none" && style.outlineWidth !== "0px";
    const hasRing = style.boxShadow !== "none" && style.boxShadow !== "";
    return { visible: hasOutline || hasRing, tag: el.tagName.toLowerCase() };
  });
  rows.push({
    screen,
    viewport,
    category: "focus",
    ruleOrCheck: "premier-focus-visible-au-tab",
    impact: outcome.visible ? "none" : "serious",
    detail: outcome.visible
      ? `Focus visible sur <${outcome.tag}>`
      : `Aucun indicateur de focus détecté sur <${outcome.tag}>`,
  });
}

async function checkTapTargets(page: Page, screen: string, viewport: string, rows: Row[]) {
  const undersized = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("button, a[href]"));
    let count = 0;
    const examples: string[] = [];
    for (const el of elements) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue; // hidden/sr-only
      if (box.width < 44 || box.height < 44) {
        count += 1;
        if (examples.length < 5) {
          examples.push(
            (el.textContent ?? el.getAttribute("aria-label") ?? "?").trim().slice(0, 40),
          );
        }
      }
    }
    return { count, examples };
  });
  rows.push({
    screen,
    viewport,
    category: "tap-target",
    ruleOrCheck: "cible-tactile-44px",
    impact: undersized.count > 0 ? "moderate" : "none",
    detail:
      undersized.count > 0
        ? `${undersized.count} élément(s) sous 44px : ${undersized.examples.join(" | ")}`
        : "Toutes les cibles interactives visibles atteignent 44px",
  });
}

async function checkReducedMotion(page: Page, screen: string, viewport: string, rows: Row[]) {
  const durations = await page.evaluate(() => {
    const animated = Array.from(document.querySelectorAll("*")).filter((el) => {
      const style = getComputedStyle(el);
      return style.animationName !== "none" || style.transitionDuration !== "0s";
    });
    return animated.map((el) => {
      const style = getComputedStyle(el);
      return Math.max(
        parseFloat(style.animationDuration || "0") * 1000,
        parseFloat(style.transitionDuration || "0") * 1000,
      );
    });
  });
  const maxDuration = durations.length ? Math.max(...durations) : 0;
  rows.push({
    screen,
    viewport,
    category: "reduced-motion",
    ruleOrCheck: "duree-sous-reduced-motion",
    impact: maxDuration > 1 ? "serious" : "none",
    detail:
      maxDuration > 1
        ? `Durée max observée ${maxDuration.toFixed(1)}ms alors que prefers-reduced-motion:reduce est actif`
        : "Toutes les durées d'animation/transition sont ramenées à ~0 sous prefers-reduced-motion",
  });
}

async function dismissFictionNotice(page: Page) {
  try {
    await page.getByRole("button", { name: /j.ai compris/i }).click({ timeout: 3000 });
  } catch {
    // already dismissed or not shown
  }
}

test("audit accessibilité réel sur les écrans critiques", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "un seul projet écrit le CSV");
  test.setTimeout(180_000);
  const rows: Row[] = [];

  async function auditCurrentScreen(screen: string, viewport: string, reducedMotion = false) {
    if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
    await runAxe(page, screen, viewport, rows);
    await checkFocusVisible(page, screen, viewport, rows);
    await checkTapTargets(page, screen, viewport, rows);
    if (reducedMotion) {
      await checkReducedMotion(page, screen, viewport, rows);
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
  }

  // 1. Accueil — desktop
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await auditCurrentScreen("accueil", "1366x768");

  // 2. Accueil — mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await auditCurrentScreen("accueil", "390x844");

  // 3. Sélection du parti — desktop
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/jouer");
  await dismissFictionNotice(page);
  await page.getByRole("button", { name: /Un parti existant/i }).click();
  await auditCurrentScreen("choix-parti", "1366x768");

  // 4. Carte d'événement de campagne — desktop et mobile, avec reduced motion
  await page.getByRole("button", { name: /Emblème abstrait de La France insoumise/i }).click();
  await page.getByRole("button", { name: /Choisir ce parti/i }).click();
  await page.getByRole("button", { name: /Le terrain d.abord/i }).click();
  await page.getByRole("button", { name: /Lancer la campagne/i }).click();
  await page.getByRole("button", { name: /Entrer en campagne/i }).click();
  await expect(page.getByTestId("event-choice").first()).toBeVisible();
  await auditCurrentScreen("evenement-campagne", "1366x768", true);

  await page.setViewportSize({ width: 390, height: 844 });
  await auditCurrentScreen("evenement-campagne", "390x844");

  // 5. Tableau de bord (Dialog) — desktop
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole("button", { name: "Ouvrir le tableau de bord" }).click();
  await expect(page.getByRole("heading", { name: "Quartier général" })).toBeVisible();
  await auditCurrentScreen("tableau-de-bord", "1366x768");
  await page.keyboard.press("Escape");

  // 6. Conséquence — desktop
  await page.getByTestId("event-choice").first().click();
  await expect(page.getByRole("button", { name: /^Continuer$/i })).toBeVisible();
  await auditCurrentScreen("consequence", "1366x768");

  const outDir = path.join(process.cwd(), "audit-results", "form-improvement", "post");
  mkdirSync(outDir, { recursive: true });
  const header = "screen,viewport,category,rule_or_check,impact,detail\n";
  const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const body = rows
    .map((row) =>
      [row.screen, row.viewport, row.category, row.ruleOrCheck, row.impact, row.detail]
        .map(csvEscape)
        .join(","),
    )
    .join("\n");
  writeFileSync(path.join(outDir, "accessibility-post.csv"), header + body + "\n", "utf-8");

  const seriousOrCritical = rows.filter((r) => r.impact === "serious" || r.impact === "critical");
  console.log(
    `Audit accessibilité : ${rows.length} lignes, ${seriousOrCritical.length} problème(s) serious/critical.`,
  );
});
