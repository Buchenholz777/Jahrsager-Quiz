import { expect, test, type Page } from "@playwright/test";

const INPUT = "Jahr eingeben (1900–2020)";

/** Spielt in der aktuellen Partie die offene Runde mit dem Jahr und liefert das richtige Jahr aus der Auflösung. */
async function answer(page: Page, year: number): Promise<number> {
  await page.getByLabel(INPUT).fill(String(year));
  await page.getByRole("button", { name: "Schätzung abgeben" }).click();
  await expect(page.getByTestId("deviation-text")).toBeVisible();
  return Number(await page.getByTestId("correct-year").innerText());
}

/** Findet ein vergangenes Paket im Archiv und liefert dessen Nummer. */
async function archivePack(page: Page): Promise<number> {
  await page.goto("/archiv");
  const href = await page.locator('a[href^="/archiv/"]').first().getAttribute("href");
  return Number(href!.split("/").pop());
}

/** Spielt eine Übungsrunde komplett mit 1960 und gibt die richtigen Jahre je Runde zurück (Reihenfolge ist je Partie gleich). */
async function learnYears(page: Page, n: number): Promise<number[]> {
  await page.goto(`/archiv/${n}`);
  const years: number[] = [];
  for (let i = 0; i < 5; i++) {
    years.push(await answer(page, 1960));
    await page.getByRole("button", { name: i === 4 ? "Ergebnis ansehen" : "Nächste Runde" }).click();
  }
  return years;
}

async function expectSegmentBetweenMarkers(page: Page) {
  const seg = page.getByTestId("deviation-segment");
  const a = page.getByTestId("marker-correct");
  const b = page.getByTestId("marker-guess");
  const [sb, ab, bb] = await Promise.all([seg.boundingBox(), a.locator("span").first().boundingBox(), b.locator("span").first().boundingBox()]);
  const centers = [ab!.x + ab!.width / 2, bb!.x + bb!.width / 2].sort((x, y) => x - y);
  expect(Math.abs(sb!.x - centers[0])).toBeLessThan(2);
  expect(Math.abs(sb!.x + sb!.width - centers[1])).toBeLessThan(2);
}

test("Schätzung abgeben: Einstiegstext, Slider und Eingabefeld teilen sich einen Wert, Fehlermeldungen", async ({ page }) => {
  const n = await archivePack(page);
  await page.goto(`/archiv/${n}`);
  await expect(page.getByTestId("guess-intro")).toHaveText("Schätze das Jahr des Ereignisses. Je näher du liegst, desto mehr Punkte bekommst du.");
  await expect(page.getByRole("button", { name: "Schätzung abgeben" })).toBeDisabled();
  const slider = page.getByRole("slider", { name: "Jahr auswählen" });
  const input = page.getByLabel(INPUT);
  await input.fill("1987");
  await expect(slider).toHaveAttribute("aria-valuenow", "1987");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(input).toHaveValue("1988");
  await page.getByRole("button", { name: "10 Jahre zurück" }).click();
  await expect(input).toHaveValue("1978");
  await input.fill("1899");
  await expect(page.getByRole("alert").filter({ hasText: "zwischen 1900 und 2020" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Schätzung abgeben" })).toBeDisabled();
  await input.fill("abc");
  await expect(page.getByRole("alert").filter({ hasText: "nur Ziffern" })).toBeVisible();
  // Mausklick auf die Leiste setzt denselben Wert
  await slider.scrollIntoViewIfNeeded();
  const box = (await slider.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const v = Number(await slider.getAttribute("aria-valuenow"));
  expect(v).toBeGreaterThan(1940);
  await expect(input).toHaveValue(String(v));
});

test("Auflösung: Volltreffer (einmal Konfetti), Abstand beider Richtungen, rotes Segment, Ränder", async ({ page }) => {
  const n = await archivePack(page);
  const years = await learnYears(page, n);

  // zweite Übungsrunde mit dem Wissen aus der ersten
  await page.goto(`/archiv/${n}`);
  await expect(page.getByText(/Ereignis 1 von 5/)).toBeVisible();

  // Runde 1: Volltreffer
  await answer(page, years[0]);
  await expect(page.getByTestId("marker-exact").locator("span").first()).toBeVisible();
  await expect(page.getByTestId("deviation-text")).toHaveText("Volltreffer!");
  await expect(page.getByTestId("deviation-segment")).toHaveCount(0);
  await expect(page.getByTestId("confetti")).toBeVisible();
  await expect(page.getByTestId("sr-resolution")).toContainText("Volltreffer");
  // Neuladen: Auflösung bleibt, kein erneutes Konfetti
  await page.reload();
  await page.getByRole("button", { name: /Ereignis 1 \(aufgelöst/ }).click();
  await expect(page.getByTestId("marker-exact").locator("span").first()).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.getByTestId("confetti")).toHaveCount(0);
  await page.getByRole("button", { name: /Ereignis 2 \(aktuell\)/ }).click();

  // Runde 2: ein Jahr Abstand
  const c2 = years[1];
  const g2 = c2 < 2020 ? c2 + 1 : c2 - 1;
  await answer(page, g2);
  await expect(page.getByTestId("deviation-text")).toHaveText(g2 > c2 ? "1 Jahr zu spät" : "1 Jahr zu früh");
  await expect(page.getByTestId("marker-guess")).toContainText(`Dein Tipp ${g2}`);
  await expect(page.getByTestId("marker-correct")).toContainText(`Richtiges Jahr ${c2}`);
  const seg = page.getByTestId("deviation-segment");
  const left = ((Math.min(c2, g2) - 1900) / 120) * 100;
  expect(Number(await seg.getAttribute("data-left-pct"))).toBeCloseTo(left, 3);
  expect(Number(await seg.getAttribute("data-width-pct"))).toBeCloseTo((1 / 120) * 100, 3);
  await expectSegmentBetweenMarkers(page);
  await page.getByRole("button", { name: "Nächste Runde" }).click();

  // Runde 3: 30 Jahre zu spät bzw. zu früh (je nach Platz auf der Skala)
  const c3 = years[2];
  const g3 = c3 + 30 <= 2020 ? c3 + 30 : c3 - 30;
  await answer(page, g3);
  await expect(page.getByTestId("deviation-text")).toHaveText(g3 > c3 ? "30 Jahre zu spät" : "30 Jahre zu früh");
  await expectSegmentBetweenMarkers(page);
  await page.getByRole("button", { name: "Nächste Runde" }).click();

  // Runde 4: Skalenränder (Tipp 1900 oder 2020, jeweils der weiter entfernte Rand)
  const c4 = years[3];
  const g4 = c4 > 1960 ? 1900 : 2020;
  await answer(page, g4);
  await expectSegmentBetweenMarkers(page);
  await expect(page.getByTestId("deviation-text")).toContainText(String(Math.abs(g4 - c4)));
  await page.getByRole("button", { name: "Nächste Runde" }).click();

  // Runde 5 + Rundenübersicht im Ergebnis
  await answer(page, years[4]);
  await page.getByRole("button", { name: "Ergebnis ansehen" }).click();
  await expect(page.getByTestId("round-table")).toContainText("Volltreffer");
  const rows = page.getByTestId("round-table").locator("tbody tr");
  await expect(rows).toHaveCount(5);
});

test("reduzierte Bewegung: statische Trefferanzeige ohne Konfetti", async ({ page }) => {
  const n = await archivePack(page);
  const years = await learnYears(page, n);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/archiv/${n}`);
  await answer(page, years[0]);
  await expect(page.getByTestId("marker-exact").locator("span").first()).toBeVisible();
  await expect(page.getByTestId("deviation-text")).toHaveText("Volltreffer!");
  await page.waitForTimeout(600);
  await expect(page.getByTestId("confetti")).toHaveCount(0);
});

test("schmale Displays (320 px): Beschriftungen bleiben im Rahmen, kein horizontales Scrollen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const n = await archivePack(page);
  await page.goto(`/archiv/${n}`);
  for (const [guess] of [[1900], [2020]]) {
    await answer(page, guess);
    const frame = (await page.getByTestId("result-timeline").boundingBox())!;
    for (const id of ["marker-correct", "marker-guess", "marker-exact"]) {
      const el = page.getByTestId(id);
      if (!(await el.count())) continue;
      for (const chip of await el.locator("span").all()) {
        const b = (await chip.boundingBox())!;
        expect(b.x, id).toBeGreaterThanOrEqual(frame.x - 1);
        expect(b.x + b.width, id).toBeLessThanOrEqual(frame.x + frame.width + 1);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: "Nächste Runde" }).click();
  }
});

test("Tastatur: komplette Runde ohne Maus", async ({ page }) => {
  const n = await archivePack(page);
  await page.goto(`/archiv/${n}`);
  const slider = page.getByRole("slider", { name: "Jahr auswählen" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("PageUp");
  await page.keyboard.press("Tab"); // zu −10
  await page.getByRole("button", { name: "Schätzung abgeben" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("deviation-text")).toBeVisible();
  await expect(page.getByRole("button", { name: "Nächste Runde" })).toBeVisible(); // Auflösung bleibt stehen, bis bewusst weitergegangen wird
});
