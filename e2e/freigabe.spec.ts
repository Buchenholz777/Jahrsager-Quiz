import { expect, test } from "@playwright/test";

test("Freigabe-Assistent: Löschen ohne Rückfrage, Scrollposition bleibt erhalten", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto("/admin/login");
  await page.getByLabel("Passwort").fill("e2e-passwort-12345");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/freigabe");

  const cards = page.locator("form").filter({ has: page.getByRole("button", { name: "Löschen" }) });
  const before = await cards.count();
  expect(before).toBeGreaterThanOrEqual(3);

  // zur letzten Karte scrollen und dort löschen
  const last = page.getByRole("button", { name: "Löschen" }).last();
  await last.scrollIntoViewIfNeeded();
  const y0 = await page.evaluate(() => window.scrollY);
  expect(y0).toBeGreaterThan(300);
  await last.click(); // keine Rückfrage, kein Häkchen

  await expect(cards).toHaveCount(before - 1);
  const y1 = await page.evaluate(() => window.scrollY);
  expect(y1, "Seite darf nicht nach oben springen").toBeGreaterThan(y0 - 400);
  await expect(page).toHaveURL(/\/admin\/freigabe$/);
});
