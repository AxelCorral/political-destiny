import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const BASE_URL = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3100";
const ROOT = resolve(import.meta.dirname, "../..");
const OUTPUT = resolve(ROOT, "audit/browser-resilience.json");

const browser = await chromium.launch({ channel: "msedge", headless: true });
const consoleMessages = [];
const pageErrors = [];

function observe(page, label) {
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) {
      consoleMessages.push({ label, type: message.type(), text: message.text() });
    }
  });
  page.on("pageerror", (error) => pageErrors.push({ label, message: error.message }));
}

async function pageGeometry(page) {
  return page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    document: {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      viewportHeights: Number(
        (document.documentElement.scrollHeight / Math.max(innerHeight, 1)).toFixed(2),
      ),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    },
    landmarks: {
      main: document.querySelectorAll("main").length,
      header: document.querySelectorAll("header").length,
      nav: document.querySelectorAll("nav").length,
      footer: document.querySelectorAll("footer").length,
    },
  }));
}

const mainContext = await browser.newContext({ serviceWorkers: "allow" });
const page = await mainContext.newPage();
observe(page, "main");
await page.goto(BASE_URL, { waitUntil: "networkidle" });

const viewportResults = [];
for (const viewport of [
  { label: "mobile-narrow", width: 360, height: 800 },
  { label: "phone", width: 412, height: 915 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "laptop", width: 1366, height: 768 },
  { label: "wide", width: 1920, height: 1080 },
]) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  viewportResults.push({ label: viewport.label, ...(await pageGeometry(page)) });
}

await page.setViewportSize({ width: 412, height: 915 });
await page.goto(BASE_URL, { waitUntil: "networkidle" });
const keyboardFocusOrder = [];
for (let index = 0; index < 8; index += 1) {
  await page.keyboard.press("Tab");
  keyboardFocusOrder.push(
    await page.evaluate(() => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return "";
      return (
        active.getAttribute("aria-label") ??
        active.getAttribute("title") ??
        active.textContent ??
        active.tagName
      )
        .replace(/\s+/gu, " ")
        .trim()
        .slice(0, 120);
    }),
  );
}

await page.emulateMedia({ reducedMotion: "reduce" });
await page.reload({ waitUntil: "networkidle" });
const reducedMotion = await page.evaluate(() => {
  const visible = [...document.querySelectorAll("body *")].filter((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none";
  });
  const parseDurations = (value) =>
    value.split(",").map((part) => {
      const trimmed = part.trim();
      return trimmed.endsWith("ms")
        ? Number.parseFloat(trimmed)
        : Number.parseFloat(trimmed) * 1_000;
    });
  return {
    mediaMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
    maximumAnimationDurationMs: Math.max(
      0,
      ...visible.flatMap((element) => parseDurations(getComputedStyle(element).animationDuration)),
    ),
    maximumTransitionDurationMs: Math.max(
      0,
      ...visible.flatMap((element) => parseDurations(getComputedStyle(element).transitionDuration)),
    ),
  };
});

let serviceWorker = {
  ready: false,
  controlsPageAfterReload: false,
  cachedCorePageWorksOffline: false,
  unknownNavigationFallsBackOffline: false,
  cachedPageTitle: "",
  fallbackHeading: "",
};
let offlineConsoleStart = consoleMessages.length;
try {
  serviceWorker.ready = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("service-worker-timeout")), 8_000),
      ),
    ]);
    return true;
  });
  await page.reload({ waitUntil: "networkidle" });
  serviceWorker.controlsPageAfterReload = await page.evaluate(
    () => navigator.serviceWorker.controller !== null,
  );
  offlineConsoleStart = consoleMessages.length;
  await mainContext.setOffline(true);
  await page.goto(`${BASE_URL}/methodologie`, { waitUntil: "domcontentloaded" });
  serviceWorker.cachedPageTitle = await page.title();
  serviceWorker.cachedCorePageWorksOffline = serviceWorker.cachedPageTitle.includes("Méthodologie");
  await page.goto(`${BASE_URL}/route-audit-hors-cache`, { waitUntil: "domcontentloaded" });
  serviceWorker.fallbackHeading =
    (
      await page
        .locator("h1")
        .first()
        .textContent()
        .catch(() => "")
    )?.trim() ?? "";
  serviceWorker.unknownNavigationFallsBackOffline = /hors (?:ligne|connexion)/iu.test(
    `${serviceWorker.fallbackHeading} ${await page.locator("body").innerText()}`,
  );
} catch (error) {
  serviceWorker = {
    ...serviceWorker,
    error: error instanceof Error ? error.message : String(error),
  };
} finally {
  await mainContext.setOffline(false);
}

const corruptContext = await browser.newContext();
const corruptPage = await corruptContext.newPage();
observe(corruptPage, "corrupt-storage");
await corruptPage.goto(BASE_URL, { waitUntil: "networkidle" });
await corruptPage.evaluate(async () => {
  const db = await new Promise((resolveDb, reject) => {
    const request = indexedDB.open("vers-lelysee", 1);
    request.onupgradeneeded = () => {
      const created = request.result;
      if (!created.objectStoreNames.contains("active")) created.createObjectStore("active");
      if (!created.objectStoreNames.contains("archives")) {
        const archives = created.createObjectStore("archives", { keyPath: "id" });
        archives.createIndex("by-completed-at", "completedAt");
      }
      if (!created.objectStoreNames.contains("meta")) created.createObjectStore("meta");
      if (!created.objectStoreNames.contains("settings")) created.createObjectStore("settings");
    };
    request.onsuccess = () => resolveDb(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise((resolveTransaction, reject) => {
    const transaction = db.transaction(["active", "settings"], "readwrite");
    transaction.objectStore("active").put({ broken: true, decisionIndex: "NaN" }, "current");
    transaction.objectStore("settings").put({ reducedMotion: "yes" }, "preferences");
    transaction.oncomplete = resolveTransaction;
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
});
await corruptPage.goto(`${BASE_URL}/jouer`, { waitUntil: "networkidle" });
const recoveryAlert = (
  await corruptPage
    .locator('[role="alert"]')
    .allTextContents()
    .catch(() => [])
).find((text) => /sauvegarde active/iu.test(text));
const corruptStorage = await corruptPage.evaluate(async () => {
  const db = await new Promise((resolveDb, reject) => {
    const request = indexedDB.open("vers-lelysee", 1);
    request.onsuccess = () => resolveDb(request.result);
    request.onerror = () => reject(request.error);
  });
  const active = await new Promise((resolveValue, reject) => {
    const request = db.transaction("active").objectStore("active").get("current");
    request.onsuccess = () => resolveValue(request.result);
    request.onerror = () => reject(request.error);
  });
  const metaKeys = await new Promise((resolveValue, reject) => {
    const request = db.transaction("meta").objectStore("meta").getAllKeys();
    request.onsuccess = () => resolveValue(request.result.map(String));
    request.onerror = () => reject(request.error);
  });
  db.close();
  return {
    activeDeleted: active === undefined,
    recoveryKeys: metaKeys.filter((key) => key.startsWith("corrupt-")),
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    baseUrl: BASE_URL,
    browser: "Microsoft Edge (Chromium), headless",
    command: "node scripts/audit/browser-resilience.mjs",
    note: "The application must already be running in production mode at the base URL.",
  },
  viewports: viewportResults,
  keyboard: { firstEightFocusTargets: keyboardFocusOrder },
  reducedMotion,
  serviceWorker,
  corruptStorage: {
    warningDisplayed: Boolean(recoveryAlert),
    warningText: recoveryAlert?.replace(/\s+/gu, " ").trim() ?? "",
    ...corruptStorage,
  },
  browserDiagnostics: {
    unexpectedConsoleMessagesBeforeOffline: consoleMessages.slice(0, offlineConsoleStart),
    expectedNetworkErrorsDuringOfflineProbe: consoleMessages.slice(offlineConsoleStart),
    pageErrors,
  },
};

await mkdir(resolve(ROOT, "audit"), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await corruptContext.close();
await mainContext.close();
await browser.close();
console.log(JSON.stringify(report, null, 2));
