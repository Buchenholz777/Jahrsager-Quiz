// Visuelle Qualitätskontrolle: Screenshots der Hauptansichten in mehreren Breiten + Überlauf-Prüfung.
// Aufruf (Dev- oder Prod-Server auf BASE_URL läuft): node scripts/shots.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "storage/shots";
const WIDTHS = (process.env.WIDTHS ?? "320,375,430,768,1024,1440").split(",").map(Number);
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "msedge" });
const report = [];

async function overflow(page) {
  return page.evaluate(() => {
    const w = window.innerWidth;
    const bad = [...document.querySelectorAll("body *")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.right > w + 1 || r.left < -1) && getComputedStyle(el).position !== "fixed";
    });
    return { scrollW: document.documentElement.scrollWidth, innerW: w, offenders: bad.slice(0, 5).map((e) => e.tagName + "." + String(e.className).slice(0, 60)) };
  });
}

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 800 : 900 }, deviceScaleFactor: 1, locale: "de-DE", hasTouch: width < 700 });
  const page = await ctx.newPage();
  const shot = async (name, full = false) => {
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: full });
    const o = await overflow(page);
    report.push({ width, name, ...o, ok: o.scrollW <= o.innerW });
  };

  await page.goto(BASE + "/");
  await page.waitForLoadState("networkidle");
  await shot("home", true);

  await page.goto(BASE + "/spielen");
  await page.getByText(/Ereignis 1 von 5/).first().waitFor();
  await page.waitForLoadState("networkidle");
  await shot("spiel-frage");
  await page.getByRole("slider").scrollIntoViewIfNeeded();
  await shot("spiel-zeitleiste-leer");
  await page.getByLabel("Jahr eingeben (1900 bis 2020)").fill("1972");
  await shot("spiel-zeitleiste");
  await page.getByRole("button", { name: "Jahr einloggen" }).click();
  await page.getByTestId("correct-year").waitFor();
  await shot("aufloesung", true);

  // Rest schnell spielen
  for (let i = 2; i <= 5; i++) {
    await page.getByRole("button", { name: /Nächstes Ereignis/ }).click();
    await page.getByLabel("Jahr eingeben (1900 bis 2020)").fill(String(1900 + i * 17));
    await page.getByRole("button", { name: "Jahr einloggen" }).click();
    await page.getByTestId("correct-year").waitFor();
  }
  await page.getByRole("button", { name: "Ergebnis ansehen" }).click();
  await page.getByTestId("total-points").waitFor();
  await page.waitForTimeout(1300);
  await shot("ergebnis", true);

  for (const [name, path] of [["archiv", "/archiv"], ["statistik", "/statistik"], ["geschichte", "/geschichte"], ["regeln", "/so-funktionierts"]]) {
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle");
    await shot(name, true);
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
const bad = report.filter((r) => !r.ok);
console.log(`${report.length} Ansichten geprüft, ${bad.length} mit horizontalem Überlauf.`);
for (const b of bad) console.log(" ✗", b.width, b.name, `scrollW=${b.scrollW} innerW=${b.innerW}`, b.offenders.join(" | "));
