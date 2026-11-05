import { chromium } from "@playwright/test";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(600000);
page.on("console", (m) => console.log("CONSOLE", m.type(), m.text().slice(0, 700)));
page.on("pageerror", (e) => console.log("PAGEERROR", String(e.stack ?? e).slice(0, 900)));
await page.goto("http://localhost:3100/casting", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(15000);
// Rend directement les scènes de fin via le module paresseux, dans un conteneur de test.
const ok = await page.evaluate(() => document.querySelectorAll("canvas").length);
console.log("canvas on casting", ok);
await browser.close();
