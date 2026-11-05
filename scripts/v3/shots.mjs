// Captures des scènes 3D (Chromium headless, WebGL logiciel).
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const out = "docs/v3/shots";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
page.on("console", (m) => {
  if (m.type() === "error") console.log("console:", m.text().slice(0, 200));
});
const shot = async (url, name, wait = 20000) => {
  await page.goto(base + url, { waitUntil: "domcontentloaded", timeout: 600000 });
  await page
    .waitForSelector("canvas", { timeout: 600000 })
    .catch(() => console.log("no canvas on", url));
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: name.endsWith("-full") });
  console.log("saved", name);
};
for (const arg of process.argv.slice(2)) {
  const [url, name] = arg.split("=");
  await shot(url, name);
}
await browser.close();
