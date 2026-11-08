# Rebranding ZEITSPUR → JAHRSAGER

Stand: 8. November 2026. Dieses Dokument trennt **tatsächlich Geprüftes** von **ungeprüften Annahmen**.

## Markenauftritt

| Element | Umsetzung |
|---|---|
| Name | **JAHRSAGER** (Wortmarke überall gleich geschrieben; in Fließtext und SEO-Titeln „Jahrsager“) |
| Slogan | „5 Bilder. 5 Ereignisse. Rate das Jahr.“ (`CLAIM` in `src/lib/constants.ts`) |
| Untertitel | „Das tägliche Geschichtsquiz“ (`TAGLINE`) |
| Logo | **JAHRSAGER QUIZ**: das bereitgestellte Logo, transparent freigestellt (Hintergrund entfernt, Umriss und Inhalt unverändert) und um ein „QUIZ“-Schild im Stil des Banners ergänzt. Erzeugt mit `scripts/brand-logo.ts` aus `public/brand/jahrsager-logo-original.webp`; Ausgaben `public/brand/jahrsager-quiz-logo*.webp/png/jpg`. Verwendet in Header (alle Seiten, in der Partie kleiner), Footer, Admin/Anmeldung, Open Graph und allen Icons – bewusst **nicht** im Hero der Startseite. Das „QUIZ“-Schild ist eine nachträgliche Montage (kein Teil des Originalartworks); die Freistellung ist automatisch, am rechten Banner-Rand bleibt ein winziger Rest sichtbar. Annahme: „Ja-Sager-Quiz“ meint JAHRSAGER QUIZ (Domain `jahrsager-quiz.*`, nicht festgelegt, nicht geprüft). |
| Favicon / App-Icon | PNG-Icons aus dem vollständigen Logo (`public/brand/favicon-64.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`), eingebunden über `metadata.icons` und `manifest.ts`. Bei 16–32 px ist das detailreiche Logo kaum lesbar. |
| Open Graph | `src/server/og.tsx` (Logo-Artwork, Slogan, optional Rätselnummer; spoilerfrei) |
| Schriften | Outfit (Logo, Überschriften, Zahlen) und Inter (Text, UI), lokal über `@fontsource` beim Build eingebunden – keine Google-Fonts-Anfragen |

## Designsystem (`src/app/globals.css`)

Alle Farben sind Design-Tokens im `@theme`-Block; Komponenten verwenden nur Token-Klassen (`bg-ink`, `text-ink-soft`, `bg-sun`, `bg-paper` …).

| Token | Wert | Einsatz |
|---|---|---|
| `ink` | `#16283D` Mitternachtsblau | Text, Logo, Primär-Buttons, dunkle Flächen |
| `paper` | `#F7F5EF` Cremeweiß | Seitenhintergrund |
| `sun` | `#FFB34D` Sonnengelb | Jahreszahlen (Textmarker), Fortschritt, aktive Zustände, Zeitleisten-Punkt |
| `good` | `#1E746D` Petrolgrün | positive Rückmeldung (exakter Treffer, WhatsApp) |
| `card` | `#FFFFFF` | Karten, Fotobereiche |
| `ink-soft` / `line` / `paper-2` | `#526175` / `#E4E3DD` / `#F0EEE8` | Sekundärtext / Rahmen / Nebenflächen |
| abgeleitet | `ink-2`, `sun-2`, `sun-soft`, `good-soft`, `line-strong`, `field` | Hover- und Hilfstöne der Palette |

Kontrastregeln (berechnet, nicht per Tool geprüft): Mitternachtsblau auf Cremeweiß/Weiß ≈ 13–14:1; Mitternachtsblau auf Sonnengelb ≈ 8:1; Sonnengelb auf Mitternachtsblau ≈ 8:1; Petrolgrün auf Weiß ≈ 5,9:1. **Weißer Text steht nie auf Gelb.** Fehler- und Hinweiszustände nutzen helles Gelb mit dunkler Schrift (keine zusätzliche Rot-Akzentfarbe).

Komponenten: `Button` (primary/sun/secondary/quiet/ghost), `Card`, `Badge`, `Eyebrow`, `ProgressSegments` (fünf Segmente), `YearPicker`, `MiniTimeline`, `PhotoFrame`, `HeroPreview`.

## Was bewusst NICHT umbenannt wurde (Kompatibilität)

Bestehende Spielstände und Konfigurationen bleiben unverändert nutzbar:

* Cookie `zs_pid` (Spielerkennung) und `zs_admin`, sessionStorage-Schlüssel `zs_landed`
* Datenbanktabellen, Spalten, Migrationen, API-Routen, URLs (`/spielen`, `/archiv`, `/ergebnis`, `/geschichte` …)
* Umgebungsvariable `ZEITSPUR_FAKE_NOW`, Standard-Bucketname `zeitspur-images`, Paketname `zeitspur`, deterministische Platzhalter-Bild-IDs
* Es wurde **keine Domain** geändert oder festgelegt (`NEXT_PUBLIC_SITE_URL` bleibt Konfiguration).

Geändert wurden Texte, Metadaten, JSON-LD-Namen, Share-Text, Manifest, Icons und Bilder. Der Share-Text hat jetzt das Format: `JAHRSAGER` / Slogan / `Tagesrätsel #N – mein Ergebnis: x / 5.000` / Frage / Link.

## Mobile-first-Verbesserungen
* Startseite: Reihenfolge Logo → Slogan → Text → Startbutton → Spielvorschau; Logo-Artwork erst ab Tablet, damit der Start ohne Scrollen sichtbar bleibt.
* Spielansicht: Fortschritt in fünf Segmenten (jeweils ≥ 44 px Touchhöhe), Foto in begrenzter Höhe (Hochformate dominieren die Seite nicht), Reihenfolge Bild → Text → Eingabe, großer „Jahr einloggen“-Button, kein zusätzlicher „Spielen“-Button im Header während der Partie.
* Jahreszeitleiste: Einladung zur Bedienung – ohne Auswahl ist die Leiste gelb hinterlegt, ein „Regler-Geist“ mit Pfeilsymbol liegt in der Mitte, bewegt sich viermal hin und her und ruht dann (bei „weniger Bewegung“ statisch); Hinweistexte unterscheiden Finger („Hier wischen oder tippen“) und Maus („Hier ziehen oder klicken“); danach: großes Jahr, gelber Auswahlpunkt mit Blase, ±1/±10-Schaltflächen (≥ 44 px), Zahlenfeld, Tastatur.
* Gitter nutzen `minmax(0,1fr)`, Überschriften `hyphens:auto`, Code/Pre umbrechen; Statistik-Verlauf als Kartenliste statt Tabelle auf dem Smartphone.

## Tatsächlich ausgeführte Prüfungen
* `npm run lint`, `npm run typecheck`, `npm test` (55 Tests), `npm run test:e2e` (11 Tests, Production-Build, Edge): grün.
* E2E `responsive.spec.ts`: kein horizontaler Überlauf auf Startseite, Regeln, Archiv, Statistik, Wissensarchiv, Impressum, Datenschutz und `/spielen` bei **320, 360, 375, 390, 430, 768, 1024 und 1440 px**; Schaltflächen der Jahresauswahl ≥ 44 × 44 px bei 320–430 px.
* `scripts/shots.mjs`: Screenshots und Überlaufprüfung für Startseite, Frage, Zeitleiste, Auflösung, Ergebnis, Archiv, Statistik, Wissensarchiv und Regeln bei denselben Breiten; Sichtprüfung ausgewählter Ansichten (375 und 1440 px).
* Lokale Messung im Production-Build (Smartphone-Emulation, **ohne Netzwerkdrosselung**, daher nur Plausibilität): Startseite LCP ≈ 0,2 s, CLS 0; `/spielen` LCP ≈ 0,4 s, CLS 0. INP wurde nicht gemessen.

## Nicht geprüft / offen
* Echte Core Web Vitals auf Geräten und mit gedrosseltem Netz (PageSpeed Insights, Lighthouse CI).
* Test auf echten iPhones/Android-Geräten, Screenreader-Test, formale WCAG-Prüfung (Kontraste nur berechnet).
* Das Logo-Artwork ist ein Rasterbild (Beige-Hintergrund, nicht transparent) und wird deshalb als abgerundete Karte gezeigt. Eine Vektor-Reinzeichnung für alle Größen und eine transparente Fassung wären sinnvoll.
* Die Hero-Vorschau nutzt einen klar gekennzeichneten Designplatzhalter (keine Lösung des Tagesrätsels).

## Namens-, Marken- und Domainprüfung (ungeprüft – kein Rechtsurteil)
Eine allgemeine Websuche (drei Anfragen: „Jahrsager“ mit Quiz-/Spielbezug, „jahrsager.de“, „Jahrsager Marke DPMA“) lieferte **keine Treffer** zu einem Spiel, einer Website oder einer eingetragenen Marke dieses Namens. **Das ist keine Markenrecherche**: Die Suchmaschine ersetzt weder die Register noch deckt sie ähnliche Schreibweisen oder Klänge ab. Vor dem öffentlichen Launch klären:

1. Registerrecherche: DPMAregister, EUIPO/TMview, WIPO Global Brand Database (identische und ähnliche Marken in den Klassen u. a. 9, 38, 41); Recherche durch Anwalt/Markenanwalt empfohlen.
2. Domain: Verfügbarkeit von `jahrsager.de`/`.com` und Social-Media-Namen, WHOIS-Abfrage.
3. Ähnlichkeit zu „Wahrsager“ (Wortspiel, eingebürgerter Begriff) und zu bestehenden Geschichts-/Jahreszahlen-Quiz: auf Verwechslungsgefahr prüfen lassen.
4. App-Store-/Suchmaschinen-Konflikte, Aussprache und Schreibweise („Jahrsager“ vs. „Jahressager“) in Texten konsistent halten.
Das Rebranding darf bis dahin technisch weiterlaufen; eine rechtlich bestätigte Markenfreiheit wird **nicht** behauptet.
