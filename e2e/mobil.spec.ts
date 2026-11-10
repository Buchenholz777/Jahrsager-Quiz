import { expect, test } from "@playwright/test";

test("Smartphone: kein horizontales Scrollen, Jahresauswahl per Touch", async ({ page }) => {
  for (const path of ["/", "/so-funktionierts", "/archiv", "/datenschutz"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `Horizontaler Überlauf auf ${path}`).toBeLessThanOrEqual(0);
  }

  await page.goto("/");
  await expect(page.getByRole("link", { name: /Jetzt Tagesrätsel spielen|fortsetzen|Ergebnis/i }).first()).toBeVisible();
  await page.goto("/spielen");
  await expect(page.getByText(/Ereignis \d von 5|Übung|Tagesrätsel/).first()).toBeVisible();
  const slider = page.getByRole("slider", { name: "Jahr auswählen" });
  if (await slider.count()) {
    await slider.scrollIntoViewIfNeeded();
    const box = (await slider.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    const value = Number(await slider.getAttribute("aria-valuenow"));
    expect(value).toBeGreaterThan(1940);
    expect(value).toBeLessThan(1980);
    // Feinjustierung per Touch
    await page.getByRole("button", { name: "1 Jahr vor" }).tap();
    await expect(slider).toHaveAttribute("aria-valuenow", String(value + 1));
    // große Bedienelemente (≥ 44 px)
    for (const name of ["1 Jahr vor", "1 Jahr zurück", "Schätzung abgeben"]) {
      const b = (await page.getByRole("button", { name }).boundingBox())!;
      expect(b.height, name).toBeGreaterThanOrEqual(44);
    }
    // Bild → Beschreibung → Eingabe (Reihenfolge)
    const ys = await page.evaluate(() => {
      const y = (el: Element | null) => (el ? el.getBoundingClientRect().top + window.scrollY : -1);
      return [y(document.querySelector("figure")), y(document.querySelector("h1")), y(document.querySelector("[role=slider]"))];
    });
    expect(ys[0]).toBeLessThan(ys[1]);
    expect(ys[1]).toBeLessThan(ys[2]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});

test("Smartphone: Spielstart-Button ist auf kleinen Displays ohne Scrollen sichtbar", async ({ page }) => {
  for (const [w, h] of [[360, 640], [375, 667], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/");
    const b = (await page.getByTestId("cta-play").or(page.getByRole("link", { name: /Ergebnis ansehen/ })).first().boundingBox())!;
    expect(b.y + b.height, `Button bei ${w}×${h} unterhalb des sichtbaren Bereichs`).toBeLessThanOrEqual(h);
    expect(b.height).toBeGreaterThanOrEqual(48);
  }
});
