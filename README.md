# JAHRSAGER

**JAHRSAGER – Das tägliche Geschichtsquiz. 5 Bilder. 5 Ereignisse. Rate das Jahr.** Kostenloses, deutschsprachiges Geschichtsrätsel (Rebranding von ZEITSPUR: [docs/REBRANDING.md](docs/REBRANDING.md); Startseite: [docs/STARTSEITE.md](docs/STARTSEITE.md)): Jeden Tag fünf historische Fotos, das richtige Jahr schätzen, Punkte sammeln und die Geschichte dahinter entdecken. Grundlage der Spielregeln ist `Zeitspur-Spielkonzept-v2.md` (Arbeitstitel des Konzepts; die Marke heißt jetzt JAHRSAGER).

> **Wichtig – Inhalte und Bilder:** Die mitgelieferten **15 Ereigniskarten** (3 Tagespakete) enthalten Texte, die nur aus geöffneten, genannten Quellen zusammengestellt wurden – sie sind aber **von keinem Menschen redaktionell freigegeben**; bei einigen Karten stützen sich Fakten teils auf Wikipedia als Hilfsquelle. Die Bilder wurden mit Zustimmung des Auftraggebers von Wikimedia Commons importiert und stehen auf **„noch zu prüfen“** (Platzhalter gibt es nur noch, wenn ein Import fehlt). Der Recherchedatensatz (Archivlink, Urheber, Lizenz, Datum, Risiken) steht je Karte im Redaktionsbereich. Alle Karten sind `is_demo`: Mit `ALLOW_DEMO_CONTENT=false` verschwinden sie aus Spiel, Wissensarchiv und Sitemap. **Offene Prüfpunkte:** [docs/OFFENE-PRUEFPUNKTE.md](docs/OFFENE-PRUEFPUNKTE.md), Recherche je Karte: [content/recherche/ereigniskarten-recherche.md](content/recherche/ereigniskarten-recherche.md).

## Schnellstart (lokal, ohne externe Dienste)

Voraussetzung: Node.js ≥ 22.

```bash
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
npm run db:seed                # Demo-Daten (lokale PostgreSQL via PGlite in .data/pglite)
npm run dev                    # http://localhost:3000
```

* Spiel: `http://localhost:3000/spielen` – Redaktion: `http://localhost:3000/admin` (lokales Passwort aus `.env.local`, Standard `zeitspur-dev`).
* Mit `DEMO_AUTOSCHEDULE=true` (nur Entwicklung) legt die App automatisch ein Demo-Paket für den aktuellen Tag an, falls keines geplant ist. `npm run db:reset` löscht die lokale Datenbank, danach `npm run db:seed`.
* `ZEITSPUR_FAKE_NOW=2026-03-29T21:59:00Z` simuliert eine feste Uhrzeit (nur außerhalb der Produktion).

| Befehl | Zweck |
|---|---|
| `npm run dev` / `build` / `start` | Entwicklung / Produktions-Build / Start |
| `npm run lint`, `npm run typecheck` | ESLint, TypeScript |
| `npm test` | Unit- und Integrationstests (Vitest, In-Memory-PostgreSQL) |
| `npm run test:e2e` | Playwright-E2E (baut die App, eigene DB `.data/e2e`, Port 3100) |
| `npm run db:migrate` / `db:seed` / `db:reset` | Migrationen / Demo-Daten / lokale DB löschen |
| `npm run admin:hash -- "Passwort"` | erzeugt `ADMIN_PASSWORD_HASH` |
| `npm run images:import -- [slug] [--yes]` | lädt recherchierte Kandidatenbilder (nur upload.wikimedia.org; ohne `--yes` Trockenlauf); Status danach „noch zu prüfen“ |
| `npm run cards:sync` | überträgt Textänderungen aus `content/ereigniskarten.ts` in eine befüllte Datenbank (neue Fassung je Änderung) |
| `node scripts/shots.mjs` | Screenshots und Überlaufprüfung in 6 Breiten (Server muss laufen; Ausgabe in `storage/shots/`) |
| `npm run research:report` | erzeugt den Rechercheübersicht-Bericht aus `content/ereigniskarten.ts` |

E2E nutzt standardmäßig den installierten **Microsoft Edge** (`PW_CHANNEL=msedge`); alternativ `PW_CHANNEL=chrome` oder nach `npx playwright install chromium` `PW_CHANNEL=chromium`.

## Funktionsstand

### Vollständig implementiert und getestet
* Tagespartie mit 5 Ereignissen, Jahresauswahl (Zeitleiste per Maus/Touch/Tastatur, ±1/±10, Zahlenfeld), „Jahr einloggen“ erst nach bewusster Auswahl, Auflösen ohne Tipp (mit Bestätigung).
* Serverseitige Wertung `max(0, 1000 − 50·|Tipp − Lösung|)` mit Wertungsversion pro Partie; Lösungen offener/zukünftiger Runden verlassen den Server nicht.
* Idempotente Antworten (Doppelklick/Parallelanfragen, Sperre pro Partie), Neuladen setzt nichts zurück, Netzwerkfehler verbrauchen keinen Tipp.
* Erste offizielle Tageswertung je Spieler; Wiederholungen und Archiv sind Übung (verändern Statistik nie). Begonnene Partien können nach Mitternacht beendet werden.
* Tageswechsel 00:00 Europe/Berlin (Sommer-/Winterzeit getestet), Tageskennung serverseitig.
* Ergebnisseite (Animation, chronologische Auswertung, Statistik), spoilerfreies Teilen (nativ, WhatsApp, Kopieren), Freundesherausforderung per Link `/tagesraetsel/<Nr>`.
* Persönliche Statistik, Teilnahmeserie (aktuell/längste), Archiv, Startseite mit Spielstanderkennung.
* Bildverwaltung: Bildstatus (Platzhalter → recherchiert → noch zu prüfen → redaktionell freigegeben), Recherchedatensatz je Ereignis (Quelle, Urheber, Lizenz, Datum, Risiken, offene Punkte), Import des Kandidatenbildes, automatische Anzeige von Bildnachweis, Lizenz (mit Link) vor dem Tipp sowie Quellen und Originalfundstelle in der Auflösung; Freigabe nur bei Bildstatus „freigegeben“, bestätigten Rechten und ohne Platzhalter (bei Produktionsinhalten). Die Bildkomponente zeigt beliebige Seitenverhältnisse (Quer-, Hoch-, Quadratformat) ohne Verzerrung und Layoutsprünge.
* Redaktion: Login (Hash/Passwort, signierte Sitzung, Rate-Limit), Ereignisse anlegen/bearbeiten, Bildupload (Formatprüfung, Metadaten entfernt, WebP-Varianten), Rechte-/Quellenfelder, Prüfbestätigungen, Status-Workflow (Entwurf → In Prüfung → Freigegeben → Eingeplant → Veröffentlicht), Zeithinweis-Prüfung, Vorschau, Tagespakete planen/zurücknehmen, Versionshistorie, Fehlermeldungen, Kennzahlen.
* SEO: SSR, Titel/Descriptions, Canonicals, `robots.txt`, `sitemap.xml`, Open Graph (spoilerfrei), JSON-LD (`Article`, `BreadcrumbList`, `WebSite`, `Organization` – nur wo passend), Wissensarchiv `/geschichte/[slug]` (erst nach Ende des jeweiligen Tagesrätsels), noindex für Spielzustände, Demo- und Entwurfsinhalte.
* Datensparsame Eigenmessung ohne Cookies/IDs (DNT/GPC werden respektiert).

### Vorbereitet, aber nicht vollständig geprüft
* **PostgreSQL in Produktion** (`DATABASE_URL`, Treiber `pg`) – das SQL läuft in Tests gegen PGlite (echtes PostgreSQL in WASM); gegen eine echte Supabase-/Postgres-Instanz wurde es **nicht** getestet.
* **Supabase-Storage-Treiber** (`STORAGE_DRIVER=supabase`) – implementiert, nicht gegen eine echte Instanz getestet. Auf Vercel ist er Pflicht (Dateisystem ist dort schreibgeschützt).
* PWA: Manifest und Icons vorhanden, **kein** Service Worker.
* Google Search Console: Sitemap, Canonicals und `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` vorbereitet.
* Cron-Veröffentlichung (`vercel.json`, `CRON_SECRET`); zusätzlich veröffentlicht die App fällige Pakete beim ersten Aufruf selbst.

### Noch offen
* Persönliche „Chronik“ (Konzept: spätere Ausbaustufe), Konten/Gerätewechsel, Ranglisten, Werbung.
* Reale Inhalte: 15/75/175 redaktionell geprüfte Ereignisse mit rechtlich geprüften Originalfotos.
* Messung echter Web-Vitals (LCP/INP/CLS), formale WCAG-2.2-AA-Prüfung, Tests auf echten Geräten und mit Screenreadern.
* Rechtstexte (siehe Launch-Checkliste).

## Architektur

```
src/app/           Seiten, Route Handler (API), Server-Aktionen (Admin)
src/components/    UI (ui/, game/, result/, home/)
src/lib/           reine Logik: Wertung, Zeit/Tageswechsel, Serien, Teilen, Zeithinweise
src/server/        Datenbank, Dienste (games, packs, events, stats, knowledge, analytics, reports),
                   Auth, Bildspeicher, HTTP-Helfer
supabase/migrations/  versionierte SQL-Migrationen (auch für `supabase db push` nutzbar)
content/           Demo-Ereignisse und Platzhalter-Bildgenerator
tests/  e2e/       Vitest bzw. Playwright
```

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zod · Lucide · PostgreSQL. shadcn/ui wurde nicht per CLI installiert; die wenigen Bausteine (`Button`, `Card`, `Badge`) folgen dem shadcn-Muster (class-variance-authority + tailwind-merge) und sind eigene Komponenten.

**Datenbankzugriff:** Eine schmale eigene Schicht (`src/server/db/client.ts`) mit rohem SQL und einem winzigen Migrationsrunner. Lokal PGlite (PostgreSQL, Dateien in `.data/`), in Produktion `pg` mit `DATABASE_URL`. Beide sprechen dasselbe SQL. RLS ist auf allen Tabellen aktiv, ohne Policies: `anon`/`authenticated` haben keinen Zugriff, nur die Server-Verbindung.

**Datenmodell:** `events` (+ `event_revisions`), `daily_packs`/`daily_pack_events`, `players`, `games`, `game_rounds`, `error_reports`, `analytics_events`.

**Sicherheit des Spiels:**
* Der Client erhält pro Partie nur aufgelöste Runden plus die aktuelle offene Runde – ohne Lösung, Erklärung und Folgerunden.
* Bilder (`/bild/[id]`) werden nur ausgeliefert, wenn das Tagespaket erreicht ist (oder für Redakteure); Dateinamen sind zufällig.
* Spielerkennung: zufällige UUID im httpOnly-Cookie `zs_pid` (technisch erforderlich, keine Klarnamen). Schreibende Routen prüfen den `Origin` und sind per Rate-Limit (pro Prozess) begrenzt.
* Redaktionsbereich: Proxy-Schutz (`src/proxy.ts`) plus erneute Prüfung in jeder Seite und Server-Aktion.

## Entscheidungen und Annahmen (wo das Konzept offen war)
* **Übung am heutigen Paket erst nach Abschluss der offiziellen Partie** – sonst könnte man vorab Lösungen sehen und danach offiziell spielen.
* **Wissensseiten erscheinen erst am Tag nach dem Tagesrätsel** (Datum < heute) und nur, wenn der Redakteur sie freigeschaltet hat, damit sie nie die laufende Aufgabe verraten.
* Eine Partie behält die Ereignisfassung, mit der sie begonnen wurde (`event_version`); Korrekturen wirken für neue Partien, abgeschlossene Ergebnisse bleiben unverändert.
* Teilen-Text folgt dem Konzept (Abweichungen je Runde, kein Ereignisname, keine Jahreszahlen).
* Serie zählt Tage nach Tagesrätsel-Datum, an denen die offizielle Partie abgeschlossen wurde; sie bleibt bestehen, solange der heutige Tag noch offen ist.
* Passwort-Hash-Format `scrypt:<salt>:<hex>` – bewusst ohne `$`, weil Next.js `$…` in Umgebungsvariablen expandiert und Hashes sonst zerstört würden.

## Konfiguration
Alle Variablen mit Erklärung: `.env.example`. Pflicht für Produktion: `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` (≥ 32 Zeichen), `STORAGE_DRIVER=supabase` samt Supabase-Variablen, `CRON_SECRET`, `ALLOW_DEMO_CONTENT=false`, Betreiberangaben.

## Deployment (Vercel + Supabase)
1. Supabase-Projekt anlegen, Storage-Bucket `zeitspur-images` (privat) erstellen.
2. Migrationen anwenden: `DATABASE_URL=… npm run db:migrate` (oder `supabase db push`). Empfehlung: dedizierte Datenbankrolle mit nur den nötigen Rechten statt Superuser.
3. Vercel-Projekt verbinden, Umgebungsvariablen setzen, deployen. `vercel.json` enthält den täglichen Veröffentlichungs-Cron (UTC 22:05/23:05, deckt Sommer-/Winterzeit ab).
4. Admin-Hash erzeugen (`npm run admin:hash -- "…"`) und als `ADMIN_PASSWORD_HASH` setzen.
5. Erste Inhalte im Redaktionsbereich anlegen, freigeben, Pakete einplanen. Demo-Seed **nicht** in Produktion ausführen (das Skript verweigert es ohne `ALLOW_DEMO_SEED=true`).

## Redaktion
Qualitätsregeln des Konzepts sind im Workflow verankert: keine Zeitangaben vor dem Tipp (automatische Warnprüfung), kein Platzhalterbild bei Produktionsinhalten, Freigabe nur mit bestätigter Rechte-, Fakten- und Foto-Ereignis-Prüfung, Lizenz und Originalfundstelle Pflicht, Pakete mit 5 verschiedenen Ereignissen aus ≥ 3 Themenfeldern, nicht freigegebene Inhalte kommen nie ins öffentliche Spiel. Nach Veröffentlichung ist für Änderungen eine Notiz Pflicht; jede Änderung erzeugt eine neue Fassung.

## Launch-Checkliste (vor dem öffentlichen Start)
- [ ] Impressum (§ 5 DDG) mit echten Betreiberangaben; Datenschutzerklärung rechtlich prüfen und ergänzen (Verantwortlicher, Hosting, Rechtsgrundlagen, Fristen, Betroffenenrechte). Die Texte im Projekt sind **Entwürfe**.
- [ ] Prüfen, ob die Cookie-Nutzung (`zs_pid`, technisch erforderlich) und die Eigenmessung ohne Einwilligung zulässig dokumentiert sind; bei Einführung von Werbung/Drittanbietern Einwilligungsverwaltung ergänzen.
- [ ] Echte Inhalte: Ereignisse recherchieren, Bildrechte je Foto dokumentieren (auch für spätere Werbefinanzierung), Quellen mit URL, Freigabe durch einen Menschen.
- [ ] `ALLOW_DEMO_CONTENT=false`, `DEMO_AUTOSCHEDULE` nicht setzen, starke Secrets, Domain als `NEXT_PUBLIC_SITE_URL`.
- [ ] Gegen echtes PostgreSQL/Supabase und echten Storage testen (Migrationen, Upload, Bildauslieferung, Last).
- [ ] Core Web Vitals messen (Ziele: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1), Lighthouse/WebPageTest auf echten Geräten und langsamen Netzen.
- [ ] Manuelle Barrierefreiheitsprüfung (Screenreader, Zoom, Kontrast) und Nutzertest der Jahreszeitleiste auf iOS/Android.
- [ ] Rate-Limits sind pro Prozess; für Serverless/mehrere Instanzen ein verteiltes Limit (z. B. Edge-Firewall/Redis) ergänzen.
- [ ] Search Console einrichten (Sitemap einreichen), Monitoring/Fehlerberichte, Backups der Datenbank.
- [ ] Redaktionsprozess klären: 35 geprüfte Ereignisse pro Woche sind eine Betriebsannahme des Konzepts.

## Teststand
Ausführung: siehe Befehlstabelle oben. Abgedeckt sind u. a. Wertung und Grenzjahre, Tageswechsel inkl. Sommer-/Winterzeit, ungültige Eingaben, doppelte/parallele Antworten, Wiederaufnahme, Lösungsschutz, offizielle vs. Übungswertung, Serien, Redaktionsworkflow und Berechtigungen sowie der vollständige Nutzerablauf per Playwright (Desktop + Smartphone-Emulation).
