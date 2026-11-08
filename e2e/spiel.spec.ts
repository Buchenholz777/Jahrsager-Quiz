import { expect, test, type Page } from "@playwright/test";

async function guess(page: Page, year: number) {
  await page.getByLabel("Jahr eingeben (1900 bis 2020)").fill(String(year));
  await page.getByRole("button", { name: "Jahr einloggen" }).click();
  await expect(page.getByText("Richtiges Jahr")).toBeVisible();
}

test("kompletter Ablauf: spielen, Neuladen, Ergebnis, Teilen, Statistik", async ({ page }) => {
  // Startseite → Spiel
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("5 Bilder");
  await page.getByTestId("cta-play").click();
  await expect(page).toHaveURL(/\/spielen/);
  await expect(page.getByText("Ereignis 1 von 5")).toBeVisible();

  // Kein Tipp ohne bewusste Auswahl
  const submit = page.getByRole("button", { name: "Jahr einloggen" });
  await expect(submit).toBeDisabled();

  // Tastaturbedienung der Zeitleiste
  const slider = page.getByRole("slider", { name: "Jahr auswählen" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "1960");
  await page.keyboard.press("PageUp");
  await expect(slider).toHaveAttribute("aria-valuenow", "1970");
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "1900");

  // Ungültige Eingabe verbraucht nichts und blockiert das Absenden
  const input = page.getByLabel("Jahr eingeben (1900 bis 2020)");
  await input.fill("2099");
  await expect(page.getByRole("alert").filter({ hasText: "zwischen 1900 und 2020" })).toBeVisible();
  await expect(submit).toBeDisabled();

  // Runde 1 + Neuladen: Zustand bleibt erhalten
  await guess(page, 1955);
  await page.reload();
  await expect(page.getByText("Ereignis 2 von 5")).toBeVisible();
  // frühere Auflösung bleibt über die Navigation erreichbar
  await page.getByRole("button", { name: /Ereignis 1 \(aufgelöst/ }).click();
  await expect(page.getByText("Richtiges Jahr")).toBeVisible();

  // Rest spielen; Runde 3 ohne Tipp auflösen
  await page.getByRole("button", { name: /Ereignis 2 \(aktuell\)/ }).click();
  await guess(page, 1971);
  await page.getByRole("button", { name: "Nächstes Ereignis" }).click();
  await page.getByRole("button", { name: "Auflösen ohne Tipp" }).click();
  await page.getByRole("button", { name: "Ja, auflösen" }).click();
  await expect(page.getByText("Ohne Tipp aufgelöst").first()).toBeVisible();
  await page.getByRole("button", { name: "Nächstes Ereignis" }).click();
  await guess(page, 2000);
  await page.getByRole("button", { name: "Nächstes Ereignis" }).click();
  await guess(page, 1902);
  await page.getByRole("button", { name: "Ergebnis ansehen" }).click();

  // Ergebnis
  await expect(page).toHaveURL(/\/ergebnis\?spiel=/);
  const total = await page.getByTestId("total-points").locator(".sr-only").innerText();
  expect(total.replace(/\./g, "")).toMatch(/^\d+$/);
  const share = await page.getByTestId("share-text").innerText();
  expect(share).toContain("JAHRSAGER");
  expect(share).toContain("5 Bilder. 5 Ereignisse. Rate das Jahr.");
  expect(share).toContain("mein Ergebnis:");
  expect(share).toContain("/ 5.000");
  expect(share).not.toMatch(/\b(19|20)\d{2}\b/); // spoilerfrei: keine Jahreszahlen
  await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);

  // Statistik
  await page.goto("/statistik");
  await expect(page.getByTestId("stats")).toContainText("Abgeschlossene Tagespartien");
  await expect(page.getByTestId("stats").locator("dd").first()).toHaveText("1");

  // Startseite erkennt den Spielstand
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Ergebnis ansehen/ })).toBeVisible();
  await expect(page.getByText("Morgen gibt es neue Ereignisse")).toBeVisible();

  // Übung nach Abschluss: neue Partie, keine neue offizielle Wertung
  await page.goto("/spielen?uebung=1");
  await expect(page.getByText("Übung #")).toBeVisible();
  await page.goto("/statistik");
  await expect(page.getByTestId("stats").locator("dd").first()).toHaveText("1");
});

test("Doppelklick wertet nur einmal und Lösungen zukünftiger Runden sind nicht abrufbar", async ({ page }) => {
  let answerCalls = 0;
  await page.route("**/api/spiel/*/antwort", async (route) => {
    answerCalls++;
    await new Promise((r) => setTimeout(r, 1200)); // langsame Verbindung
    await route.continue();
  });
  const startBodies: string[] = [];
  page.on("response", async (r) => {
    if (r.url().endsWith("/api/spiel/start")) startBodies.push(await r.text());
  });
  await page.goto("/spielen");
  await expect(page.getByText("Ereignis 1 von 5")).toBeVisible();
  await page.getByLabel("Jahr eingeben (1900 bis 2020)").fill("1960");
  const submit = page.getByRole("button", { name: /Jahr einloggen|Wird eingeloggt/ });
  await submit.dblclick();
  await expect(page.getByText("Richtiges Jahr")).toBeVisible();
  expect(answerCalls).toBe(1);

  // Antwort der Start-API enthält keine Lösung und nur die erste offene Runde
  const body = JSON.parse(startBodies[0]);
  expect(body.state.rounds).toHaveLength(1);
  expect(JSON.stringify(body)).not.toContain('"correct"');
  expect(JSON.stringify(body)).not.toContain("explanation");
});

test("Netzwerkfehler verbrauchen keinen Tipp (Erneut versuchen)", async ({ page }) => {
  await page.goto("/spielen");
  await expect(page.getByText(/Ereignis \d von 5/).first()).toBeVisible();
  let fail = true;
  await page.route("**/api/spiel/*/antwort", (route) => (fail ? route.abort("failed") : route.continue()));
  await page.getByLabel("Jahr eingeben (1900 bis 2020)").fill("1950");
  await page.getByRole("button", { name: "Jahr einloggen" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "nicht verbraucht" })).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Erneut versuchen" }).click();
  await expect(page.getByText("Richtiges Jahr")).toBeVisible();
});

test("Wissensseite des heutigen Rätsels verrät nichts, frühere Ereignisse sind lesbar", async ({ page, request }) => {
  const list = await request.get("/geschichte");
  expect(list.ok()).toBeTruthy();
  const html = await list.text();
  const slugs = [...html.matchAll(/\/geschichte\/([a-z0-9-]+)"/g)].map((m) => m[1]);
  expect(slugs.length).toBeGreaterThan(0);
  expect(slugs).not.toContain("tag-der-deutschen-einheit"); // gehört zum heutigen Rätsel
  expect((await request.get("/geschichte/tag-der-deutschen-einheit")).status()).toBe(404);
  await page.goto(`/geschichte/${slugs[0]}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/); // Demo-Inhalt
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/geschichte\//);
});

test("SEO-Grundlagen: Sitemap, robots, Canonical, Open Graph", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Sitemap:");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/geschichte/"); // Demo-Inhalte sind nicht in der Sitemap
  expect((await request.get("/opengraph-image")).headers()["content-type"]).toContain("image/png");
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await page.goto("/spielen");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("Admin: Anmeldung erforderlich, falsches Passwort scheitert, Redaktion erreichbar", async ({ page, request }) => {
  const res = await request.get("/admin/ereignisse", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  await page.goto("/admin/ereignisse");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Passwort").fill("falsch");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "fehlgeschlagen" })).toBeVisible();
  await page.getByLabel("Passwort").fill("e2e-passwort-12345");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("link", { name: "Ereignisse", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ereignisse" })).toBeVisible();
  await page.getByRole("link", { name: "Tagespakete" }).click();
  await expect(page.getByRole("heading", { name: "Tagespakete" })).toBeVisible();
  // Admin-Bilder sind nur mit Sitzung abrufbar – unbekannte Bilder nie
  expect((await request.get("/bild/doesnotexist")).status()).toBe(404);
});

test("Startseite: historischer Hero ohne Demokarte, ohne zweites Logo, direkter Spielstart", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("5 Bilder");
  await expect(page.getByText("Das tägliche Geschichtsquiz").first()).toBeVisible();
  // keine Demokarte
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(page.getByText("Selbst spielen")).toHaveCount(0);
  await expect(page.getByText("Designplatzhalter")).toHaveCount(0);
  await expect(page.getByLabel("Jahr eingeben (1900 bis 2020)")).toHaveCount(0);
  // kein großes Logo-Artwork im Hero (nur die Wortmarke im Header)
  await expect(page.locator("section.hero-bg img[alt*=\"JAHRSAGER\"]")).toHaveCount(0);
  await expect(page.locator("header").getByRole("img", { name: "JAHRSAGER QUIZ" })).toBeVisible();
  // Bildkomposition aus echten Bilddateien (im E2E-Datensatz stehen dafür Testbilder), geladen und mit Bildnachweis
  const hero = page.locator("section.hero-bg figure img");
  expect(await hero.count()).toBeGreaterThanOrEqual(2);
  await expect.poll(async () => hero.evaluateAll((els) => els.every((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.getByText("Bildnachweise zur Komposition")).toBeVisible();
  // der gelbe Startbutton führt ohne Zwischenschritt in die echte erste Runde
  const cta = page.getByTestId("cta-play");
  await expect(cta).toHaveText(/Jetzt Tagesrätsel spielen|Spiel fortsetzen/);
  await cta.click();
  await expect(page).toHaveURL(/\/spielen$/);
  await expect(page.getByText(/Ereignis \d von 5/).first()).toBeVisible();
  await expect(page.getByRole("slider", { name: "Jahr auswählen" })).toBeVisible();
});
