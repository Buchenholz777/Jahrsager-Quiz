# Spielfluss, Zeitleiste, Party und Endlos vorbereitet (10. November 2026)

## Einrichtung für den Betrieb (einmalig)
1. **Migration einspielen:** `supabase/migrations/20261110000002_party.sql` (Tabellen `parties`, `party_members`, Spalte `games.party_id`, Spielmodus `party`) und `20261110000001_foto_pflicht.sql`. Der GitHub-Workflow „Redaktion“ führt `npm run db:migrate` jetzt vor jedem Lauf aus (idempotent). Einmal von Hand starten: GitHub → Actions → „Redaktion“ → „Run workflow“.
2. **Erst danach den Code ausliefern**, der `games.party_id` benutzt (sonst schlägt das Anlegen von Partien fehl).
3. Keine neuen Secrets, keine neuen Dienste: Parteien liegen in derselben Supabase-Datenbank wie alle Spielstände (zwei Browser spielen dieselbe Party, weil Code → Party → festgelegter Aufgabensatz serverseitig gespeichert ist).

## Abnahmeliste

### 1 Schätzung abgeben
* Texte „Schätzung abgeben“, Einstiegssatz „Schätze das Jahr des Ereignisses. Je näher du liegst, desto mehr Punkte bekommst du.“ (Wertung: 1.000 − 50 × Abstand, passt zum Satz) – `src/components/game/round-question.tsx`.
* Gewähltes Jahr groß, beschriftetes Eingabefeld „Jahr eingeben (1900–2020)“ neben Zeitleiste, ein gemeinsamer Wert; Meldungen für Zahlenbereich und Nicht-Ziffern – `src/components/game/year-picker.tsx`.
* Abgabe nur per Knopf; bei Netzfehler bleibt der Wert, „Erneut versuchen“; Doppelklick/Wiederholung wertet serverseitig einmal (`answerRound`, Sperre je Partie) – `game-client.tsx`, `src/server/services/games.ts`.
* Geprüft: `e2e/aufloesung.spec.ts` (Synchronisierung Slider/Feld, Tastatur, Mausklick, Fehlermeldungen), bestehende Tests `e2e/spiel.spec.ts` (Doppelklick, Netzfehler).

### 2 Treffer und Abstand auf der Zeitleiste
* `src/lib/timeline.ts` (Positionen, Segment, Abstand/Richtung), `src/components/game/result-timeline.tsx`, `confetti.tsx`, `round-reveal.tsx`. Eine Skala für Eingabe und Auflösung.
* Volltreffer: grüner Marker + „Volltreffer!“, Konfetti genau einmal beim erstmaligen Auflösen (nicht beim Neuladen), bei reduzierter Bewegung statische Anzeige. Abweichung: „Dein Tipp“ und „Richtiges Jahr“ als beschriftete Marker, rotes Segment exakt dazwischen, Text „30 Jahre zu spät / 1 Jahr zu früh“ (auch ohne Farbe verständlich). Screenreader-Text einmal in `aria-live`.
* Geprüft: `tests/timeline.test.ts` (Beispiel 1920/1890 auf Skala 1850–2020, Richtung, Ränder), `e2e/aufloesung.spec.ts` (Volltreffer, 1 Jahr, 30 Jahre, Skalenränder, Segment-Pixel zwischen Markern, Konfetti einmalig, reduzierte Bewegung, 320 px Beschriftungen im Rahmen).
* **Hinweis:** Die Spielskala geht von 1900 bis 2020 (Datenbank-Regel). Das Beispiel 1890 liegt außerhalb und wurde deshalb als Funktionstest mit erweiterter Skala geprüft; „v. Chr./n. Chr.“ kommt im Spiel nicht vor und ist daher nicht anwendbar.

### 3 Spielfluss
* Rundenfortschritt („Ereignis x von 5“, Segmente), Punkte nach der Auflösung, Kontextsatz (erster Satz der Auflösung) plus Quellenlink direkt unter dem Ergebnis, Auflösung bleibt stehen bis „Nächste Runde“ / „Ergebnis ansehen“.
* Ergebnisseite: Gesamtpunkte, **Tabelle** „Übersicht deiner Runden“ (Tipp, richtig, Abweichung, Punkte), spoilerfreier Teilen-Text (bestehend: Modus, Punkte, Link; keine Lösungen).

### 4 Tagesrätsel als Haupteinstieg
* Primäre Aktion auf der Startseite bleibt „Jetzt Tagesrätsel spielen“; Zeitzone `Europe/Berlin` (`GAME_TIMEZONE`), Fortschritt serverseitig, Neuladen setzt fort, abgeschlossenes Rätsel zeigt Ergebnis (bestehende Tests `e2e/spiel.spec.ts`).

### 5 Party
* Seiten: `/party` (erstellen/beitreten), `/party/CODE` (Einladung, Stand), `/party/CODE/spielen`. API: `src/app/api/party/**`. Logik: `src/server/services/parties.ts`, `src/lib/party-code.ts`. Migration siehe oben.
* Code: 6 Zeichen ohne verwechselbare Zeichen, Beitritt mit Leerzeichen/Kleinschreibung. Link öffnet die Party. Gäste ohne Anmeldung. „Einladungslink kopieren“ und „Über WhatsApp teilen“ (vorbereiteter Text mit Link und Code; Absenden macht die Person selbst).
* Aufgabensatz wird bei Erstellung als Snapshot (Ereignis + Fassung) gespeichert, Wertung serverseitig mit derselben Formel, Wiederholungen ändern nichts, fremde Punkte erst nach eigenem Abschluss, Wartemeldung solange niemand sonst fertig ist, 20 Teilnehmende maximal, 30 Tage gültig. Fehlerzustände: leerer/ungültiger/abgelaufener Code, Netzfehler (Erneut versuchen), Neuladen.
* Der Aufgabensatz stammt aus bereits veröffentlichten Ereignissen (nicht aus dem heutigen Tagesrätsel, damit nichts vorweggenommen wird). Bei zu wenig Bestand meldet das System das verständlich.
* Geprüft: `tests/party.test.ts` (Zuordnung, gleicher Aufgabensatz, Wiederholung, Sichtbarkeit, fixer Satz), `e2e/party.spec.ts` (zwei unabhängige Browserkontexte, Link-Beitritt, separater Code-Beitritt, zeitversetzt bis zum Ergebnis, Neuladen, ungültiger Code, WhatsApp-Text, Link kopieren).
* Nicht vorhanden war: eine Live-Party mit gleichzeitiger Anzeige. Der Ablauf ist asynchron; die Wartemeldung aktualisiert sich alle 15 Sekunden.

### 6 Endlos und Bestand
* Modusauswahl auf der Startseite (`src/components/home/mode-select.tsx`): Tagesrätsel, Party, **Endlos** mit „Bald verfügbar“, ohne Link und ohne Spielstart (`e2e/party.spec.ts`).
* Bestandscheck: `npm run bestand` (liest nur; Regeln in `src/server/pipeline/bestand.ts`, Test `tests/bestand.test.ts`). Prüfregeln: Status freigegeben/eingeplant/veröffentlicht, kein Demo, echtes Foto, Quelle mit URL, Jahr 1900–2020, keine Dubletten (Wikidata-ID, Themenschlüssel, gleiches Jahr + zwei Schlagwörter), Verteilung nach Jahrzehnt/Thema/Region, Lücken, Anzahl vollständiger Spiele ohne Wiederholung = ⌊spielbare ÷ 5⌋. Der Workflow „Redaktion“ schreibt den Bericht ins Protokoll.
* **Nicht verifiziert:** die tatsächlichen Zahlen der Produktionsdatenbank (Zugangsdaten nur in GitHub/Cloudflare). Ergänzungen sollen weiter über die Pipeline kommen (Wikidata CC0 als Ausgangspunkt, Foto und Text getrennt geprüft, Foto-Pflicht und Lizenzregeln unverändert).

### 7 Abnahme
* Unit-Tests: 126+ (vitest); Browsertests (Desktop und Pixel 7): siehe unten; `npx next build` läuft im E2E-Start mit.
* Nicht verifiziert (externe Voraussetzung): echter Versand per WhatsApp; echtes iOS-Gerät; Produktionsdatenbank ohne die neue Migration.
