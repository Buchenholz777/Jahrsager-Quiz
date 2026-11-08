import { expect, test } from "@playwright/test";

const WIDTHS = [320, 360, 375, 390, 430, 768, 1024, 1440];
const PAGES = ["/", "/so-funktionierts", "/archiv", "/statistik", "/geschichte", "/impressum", "/datenschutz", "/spielen"];

test("keine horizontalen Scrollbalken in allen Hauptansichten und Testbreiten", async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: width < 700 ? 800 : 900 });
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const o = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
      expect(o.s, `${path} bei ${width}px: scrollWidth ${o.s} > ${o.w}`).toBeLessThanOrEqual(o.w);
    }
  }
});

test("Bedienelemente der Jahresauswahl sind mindestens 44 px groß (alle Smartphone-Breiten)", async ({ page }) => {
  await page.goto("/spielen");
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 800 });
    for (const name of ["1 Jahr vor", "1 Jahr zurück", "10 Jahre vor", "10 Jahre zurück"]) {
      const b = await page.getByRole("button", { name }).first().boundingBox();
      if (!b) continue; // z. B. wenn die heutige Partie bereits abgeschlossen ist
      expect(b.height, `${name} @${width}`).toBeGreaterThanOrEqual(44);
      expect(b.width, `${name} @${width}`).toBeGreaterThanOrEqual(44);
    }
  }
});
