# Google-Darstellung und Marken-SEO (Stand 9. November 2026)

## Ursachen der Beobachtungen
| Beobachtung | Ursache im Projekt | Maßnahme |
|---|---|---|
| Titel/Beschreibung entsprachen nicht der gewünschten Marke | `SITE_TITLE`/`SITE_DESCRIPTION` in `src/lib/site.ts` waren anders formuliert; Titelvorlage `%s · JAHRSAGER` | Neue Texte, Vorlage `%s – JAHRSAGER` |
| Markenname uneinheitlich | WebSite-Daten hatten zwei lange `alternateName`-Einträge | WebSite: `name` JAHRSAGER, `alternateName` „Jahrsager Quiz“, `og:site_name` JAHRSAGER |
| Generisches Favicon | Nur `/brand/favicon-64.png` (kein Vielfaches von 48 px), `/favicon.ico` lieferte 404 | Neues, vereinfachtes Marken-Favicon: `/favicon.ico` (16/32/48), `/favicon-48.png`, `/favicon-96.png`, `/apple-touch-icon.png` |
| Bildunterschrift-Fragmente im Snippet („Farbfoto: Viele …“) | Bildnachweise und Fototexte stehen im sichtbaren Text der Startseite und können von Google als Snippet genutzt werden | `data-nosnippet` gezielt auf die technischen Bildnachweise (Komposition, Fotoband). Nachweise bleiben sichtbar. Kein globales `nosnippet`/`noindex`/`max-snippet:0` |
| Vorschaubild fehlte | Dynamische OG-Bild-Route lieferte auf Cloudflare Fehler 500 | Statisches Marken-Bild `/brand/og-jahrsager-1200x630.png` (ohne historische Fotos), dynamische Route entfernt |

## Neue Metadaten
* Startseite: **JAHRSAGER – Das tägliche Geschichtsquiz** / „5 historische Bilder, 5 Jahreszahlen: Wie gut kennst du die Weltgeschichte? Spiele das kostenlose Tagesquiz – jeden Tag neu und ohne Anmeldung.“
* Tagesrätsel: „Tagesrätsel spielen – JAHRSAGER“ (nicht indexiert, Spielzustand)
* Spielregeln: „So funktioniert JAHRSAGER – Spielregeln“
* Wissensarchiv: „Weltgeschichte entdecken – JAHRSAGER“; Ereignisse: „[Name] ([Jahr]) – JAHRSAGER“; Themen: „[Thema]: Ereignisse der Weltgeschichte – JAHRSAGER“
* Archiv: „Rätselarchiv: frühere Tagesrätsel nachspielen – JAHRSAGER“; Impressum/Datenschutz: „Impressum – JAHRSAGER“ / „Datenschutz – JAHRSAGER“
* Die Startseite hat einen sichtbaren Einleitungstext (Marke, Spielprinzip, kostenlos, ohne Anmeldung).

## Dateien
`src/lib/site.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, Unterseiten (`spielen`, `so-funktionierts`, `archiv`, `geschichte/**`, `tagesraetsel/[nummer]`), `src/components/home/hero-collage.tsx`, `photo-band.tsx`, `scripts/make-brand-assets.mjs` (erzeugt die Marken-Dateien neu: `node scripts/make-brand-assets.mjs`), `scripts/build-pages.mjs` (statische Pfade), `public/favicon*.png|ico`, `public/apple-touch-icon.png`, `public/brand/og-jahrsager-1200x630.png`.

## Was Sie in der Search Console tun (keine Indexing-API nötig)
1. **URL-Prüfung** → `https://www.jahrsagerquiz.de/` eingeben → „Live-URL testen“ → prüfen, dass Titel/Favicon/Canonical stimmen → **„Indexierung beantragen“**.
2. Optional gleiches für `/so-funktionierts` und `/geschichte`.
3. **Sitemaps**: `sitemap.xml` ist eingereicht; Status prüfen.
4. Favicon: Google übernimmt es nach erneutem Crawl der Startseite; das dauert **Tage bis Wochen**. Auch Titel/Snippet ändern sich erst nach Neu-Indexierung; Google darf Titel und Beschreibung weiterhin selbst umschreiben. Garantien gibt es nicht.
5. Erfolg nur an echten Daten messen: Search Console → Leistung (Impressionen, Klicks, CTR für die Marke) über mehrere Wochen.

## Offene Punkte
* Keine Search-Console-Daten vorhanden: Wirkung ist **nicht gemessen**.
* Interne SEO-Vorschau-Seite (Simulation) nicht umgesetzt (P2); bei Bedarf separat.
* Impressum und Datenschutz sind inhaltlich noch Startbausteine (Launch-Blocker).
