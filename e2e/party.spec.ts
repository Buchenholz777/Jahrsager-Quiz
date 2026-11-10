import { expect, test, type Browser, type Page } from "@playwright/test";

const INPUT = "Jahr eingeben (1900–2020)";

async function playAll(page: Page, years: number[]) {
  for (let i = 0; i < 5; i++) {
    await page.getByLabel(INPUT).fill(String(years[i]));
    await page.getByRole("button", { name: "Schätzung abgeben" }).click();
    await expect(page.getByTestId("deviation-text")).toBeVisible();
    await page.getByRole("button", { name: i === 4 ? "Ergebnis ansehen" : "Nächste Runde" }).click();
  }
}

async function newUser(browser: Browser, baseURL: string) {
  const ctx = await browser.newContext({ baseURL, locale: "de-DE" });
  return { ctx, page: await ctx.newPage() };
}

test("Startseite: Modusauswahl mit Party und Endlos als nicht startbare Vorschau", async ({ page }) => {
  await page.goto("/");
  const modes = page.getByTestId("mode-select");
  await expect(modes.getByRole("link", { name: "Tagesrätsel spielen" })).toBeVisible();
  await expect(page.getByTestId("home-party-create")).toBeVisible();
  await expect(page.getByTestId("home-party-join")).toBeVisible();
  const endless = page.getByTestId("mode-endless");
  await expect(endless).toContainText("Endlos");
  await expect(endless).toContainText("Bald verfügbar");
  await expect(endless.getByRole("link")).toHaveCount(0); // keine Verknüpfung, startet kein Spiel
  await expect(endless.getByRole("button")).toHaveCount(0);
});

test("Party: zwei unabhängige Browser, Link- und Code-Beitritt, zeitversetzt bis zum Ergebnis", async ({ browser, baseURL }) => {
  const base = baseURL!;
  const a = await newUser(browser, base);
  await a.ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });

  // A erstellt die Party
  await a.page.goto("/party");
  await a.page.getByLabel("Dein Anzeigename (optional)").fill("Anna");
  await a.page.getByTestId("party-create").click();
  await expect(a.page).toHaveURL(/\/party\/[A-Z0-9]{6}$/);
  const code = (await a.page.getByTestId("party-code").innerText()).trim();
  expect(code).toMatch(/^[A-Z2-9]{6}$/);
  const link = (await a.page.getByTestId("party-link").innerText()).trim();
  expect(link).toBe(`${base}/party/${code}`);

  // Einladungslink kopieren und WhatsApp-Text
  await a.page.getByRole("button", { name: "Einladungslink kopieren" }).click();
  await expect(a.page.getByRole("status").filter({ hasText: "kopiert" })).toBeVisible();
  expect(await a.page.evaluate(() => navigator.clipboard.readText())).toBe(link);
  const wa = await a.page.getByTestId("party-whatsapp").getAttribute("href");
  expect(wa).toMatch(/^https:\/\/wa\.me\/\?text=/);
  const waText = decodeURIComponent(wa!.split("text=")[1]);
  expect(waText).toContain(code);
  expect(waText).toContain(link);

  // B tritt über den Link bei (anderer Browserkontext = andere Person)
  const b = await newUser(browser, base);
  await b.page.goto(link);
  await b.page.getByLabel("Dein Anzeigename (optional)").fill("Ben");
  await b.page.getByTestId("party-join").click();
  await expect(b.page.getByTestId("party-play")).toBeVisible();

  // C tritt separat per Code bei (Leerzeichen am Rand, Kleinbuchstaben)
  const c = await newUser(browser, base);
  await c.page.goto("/party");
  await c.page.getByLabel("Gib den Code aus der Einladung ein.").fill(`  ${code.toLowerCase()} `);
  await c.page.getByRole("button", { name: "Party beitreten" }).click();
  await expect(c.page).toHaveURL(new RegExp(`/party/${code}$`));

  // Ungültiger Code: verständliche Meldung und nächste Aktion
  const d = await newUser(browser, base);
  await d.page.goto("/party");
  await d.page.getByLabel("Gib den Code aus der Einladung ein.").fill("ZZZZZZ");
  await d.page.getByRole("button", { name: "Party beitreten" }).click();
  await expect(d.page.locator("p[role=alert]")).toContainText("gibt es nicht");
  await expect(d.page.locator("p[role=alert]").getByRole("button", { name: "eine neue Party erstellen" })).toBeVisible();
  await d.page.getByLabel("Gib den Code aus der Einladung ein.").fill("   ");
  await d.page.getByRole("button", { name: "Party beitreten" }).click();
  await expect(d.page.locator("p[role=alert]")).toContainText("Party-Code ein");

  // A spielt zuerst; Fremde Ergebnisse bleiben verborgen, Wartemeldung erscheint
  await a.page.getByTestId("party-play").click();
  await expect(a.page.getByText("Ereignis 1 von 5")).toBeVisible();
  await a.page.reload(); // Neuladen setzt fort
  await expect(a.page.getByText("Ereignis 1 von 5")).toBeVisible();
  await playAll(a.page, [1950, 1960, 1970, 1980, 1990]);
  await expect(a.page).toHaveURL(new RegExp(`/party/${code}$`));
  await expect(a.page.getByTestId("party-waiting")).toBeVisible();
  await expect(a.page.getByTestId("party-my-points")).toBeVisible();

  // B hat noch nicht gespielt: keine Punktestände sichtbar
  await b.page.reload();
  await expect(b.page.getByTestId("party-results")).toHaveCount(0);

  // B spielt später; derselbe Aufgabensatz => gleiche richtige Jahre wie bei A
  await b.page.getByTestId("party-play").click();
  const yearsB: number[] = [];
  for (let i = 0; i < 5; i++) {
    await b.page.getByLabel(INPUT).fill("1950");
    await b.page.getByRole("button", { name: "Schätzung abgeben" }).click();
    await expect(b.page.getByTestId("deviation-text")).toBeVisible();
    yearsB.push(Number(await b.page.getByTestId("correct-year").innerText()));
    await b.page.getByRole("button", { name: i === 4 ? "Ergebnis ansehen" : "Nächste Runde" }).click();
  }
  await expect(b.page.getByTestId("party-results")).toBeVisible();
  await expect(b.page.getByTestId("party-results")).toContainText("Anna");
  await expect(b.page.getByTestId("party-results")).toContainText("Ben");
  await expect(b.page.getByTestId("party-waiting")).toHaveCount(0);

  // A sieht nach Neuladen beide Ergebnisse; C (nicht fertig) sieht keine Punkte
  await a.page.reload();
  await expect(a.page.getByTestId("party-results")).toContainText("Ben");
  await expect(c.page.getByTestId("party-results")).toHaveCount(0);

  // Gleicher Aufgabensatz bei A: Jahre der Auflösungen stimmen mit B überein
  await a.page.goto(`/party/${code}/spielen`);
  const yearsA: number[] = [];
  for (let i = 1; i <= 5; i++) {
    await a.page.getByRole("button", { name: new RegExp(`Ereignis ${i} \\(`) }).click();
    yearsA.push(Number(await a.page.getByTestId("correct-year").innerText()));
  }
  expect(yearsA).toEqual(yearsB);

  for (const u of [a, b, c, d]) await u.ctx.close();
});

test("Party: abgelaufener oder unbekannter Link zeigt verständliche Meldung", async ({ page }) => {
  await page.goto("/party/ZZZZZZ");
  await expect(page.getByTestId("party-problem")).toContainText("gibt es nicht");
  await expect(page.getByRole("link", { name: /Neue Party erstellen/ })).toBeVisible();
});
