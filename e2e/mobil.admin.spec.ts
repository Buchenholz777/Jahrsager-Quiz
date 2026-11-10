import { expect, test, type Page } from "@playwright/test";

const OUT = "C:/Users/alex-/AppData/Local/Temp/claude/7ff44978b1a5c90b/9839902c-aad1-460c-8d3a-8a98b93590f0/scratchpad";
const PAGES = ["/admin", "/admin/ereignisse", "/admin/freigabe", "/admin/automatik", "/admin/pakete", "/admin/meldungen", "/admin/kennzahlen", "/admin/seo"];

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Passwort").fill("e2e-passwort-12345");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("Admin auf dem Smartphone: kein horizontales Scrollen, Navigation und Hauptaktionen bedienbar", async ({ page }) => {
  await login(page);
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `${OUT}/admin-${path.replace(/\W+/g, "_")}.png`, fullPage: false });
    expect(overflow, `Horizontaler Überlauf auf ${path}`).toBeLessThanOrEqual(0);
    // Der Inhalt beginnt weit oben (kompakter Kopf), nicht erst nach einem Bildschirm Navigation
    const h1 = await page.getByRole("heading", { level: 1 }).first().boundingBox();
    if (h1) expect(h1.y, `Überschrift auf ${path} zu weit unten`).toBeLessThan(260);
  }
  // Navigation: jeder Eintrag ist per Tippen erreichbar (≥ 44 px hoch)
  await page.goto("/admin");
  for (const l of await page.getByRole("navigation", { name: "Redaktion" }).getByRole("link").all()) {
    expect((await l.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole("navigation", { name: "Redaktion" }).getByRole("link", { name: "SEO-Vorschau" }).scrollIntoViewIfNeeded();
  await page.getByRole("navigation", { name: "Redaktion" }).getByRole("link", { name: "SEO-Vorschau" }).tap();
  await expect(page).toHaveURL(/\/admin\/seo$/);
  // Freigabe-Assistent: Entwurf kann per Touch gelöscht werden, Bedienelemente groß genug
  await page.goto("/admin/freigabe");
  const del = page.getByRole("button", { name: "Löschen" }).first();
  await del.scrollIntoViewIfNeeded();
  expect((await del.boundingBox())!.height).toBeGreaterThanOrEqual(36);
  await page.screenshot({ path: `${OUT}/admin-freigabe-karte.png` });
  const count = await page.getByRole("button", { name: "Löschen" }).count();
  await del.tap();
  await expect(page.getByRole("button", { name: "Löschen" })).toHaveCount(count - 1);
});
