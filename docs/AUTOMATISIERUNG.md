# Automatisiertes Redaktionssystem

Stand: 9. November 2026. Getrennt nach **tatsächlich geprüft** und **offen**.

## Ablauf (täglich, GitHub Actions: `.github/workflows/redaktion.yml`, 03:17 UTC)
1. **Recherche** (`npm run pipeline -- research`): Wikidata-Ereignisse 1900–2020 mit tagesgenauem Datum, Bild (P18) und deutschem Wikipedia-Artikel → Commons-Metadaten → Wikipedia-Auszug und externe Quellen. Nur wenn der Vorrat unter 150 liegt; höchstens 25 Kandidaten je Lauf (Kosten/API-Limits).
2. **Prüfung je Kandidat** (`src/server/pipeline/`): Lizenz-Allowlist, Datierung, Bildqualität, Quellen, Dublette, Zeitspoiler, Wortzahlen, KI-Bildkontrolle (nur Veto). Entscheidung `auto_approved` / `manual_review` / `rejected`, vollständiges **Prüfprotokoll** (`events.audit`) mit Zeitpunkt, Regeln und Belegen.
3. **Texte**: Claude schreibt Rätselbeschreibung und Auflösung **ausschließlich aus dem Wikipedia-Auszug** (30–55 bzw. 60–100 Wörter). Reicht der Auszug nicht, wird nichts erzeugt. Ohne `ANTHROPIC_API_KEY` läuft keine Recherche.
4. **Planung** (`npm run pipeline -- plan`): fehlende Tagespakete der nächsten 14 Tage aus dem geprüften Pool (≥ 3 Themenfelder, Jahrzehnte gestreut, kein Ereignis zweimal). Reicht der Pool nicht, bleibt der Tag leer und das Dashboard warnt – es wird **nie** Ungeprüftes aufgefüllt.
5. **Veröffentlichung**: wie bisher durch die Website zum Stichtag 00:00 Europe/Berlin (Sommer-/Winterzeit berücksichtigt; begonnene Partien behalten ihre Fassung).

Statusabbildung: `auto_approved` = `status freigegeben`; `manual_review` = `entwurf`; `scheduled`/`published` = `eingeplant`/`veroeffentlicht`; `rejected` = nicht angelegt (`pipeline_seen`) bzw. gesperrt.

## Automatisch vs. manuell
* **Vollautomatisch:** Recherche, Metadatenabruf, Lizenz-/Datierungs-/Quellen-/Dublettenprüfung, Textentwurf, Bildverarbeitung, Freigabe regelkonformer Fälle, Paketplanung, Veröffentlichung.
* **Manuell nur für Ausnahmen** (Admin → *Automatik*): Personen im Bild, unklare/fehlende Aufnahmedatierung, Lizenz außerhalb der Allowlist (z. B. CC BY/BY-SA), „Public domain“ ohne Regierungswerk-Nachweis, zu wenig Quellen, formale Textmängel. Außerdem: Sperren und Entsperren.
* Die 10 Ereignisse aus dem Import (`docs/IMPORT-10-EREIGNISSE.md`) bleiben unverändert manuell.

## Lizenzen (strikte Allowlist, `pipeline/license.ts`)
Automatisch zulässig: **CC0** und **Public domain mit Nachweis eines Werks der US-Bundesregierung** (NASA, National Archives, White House Photo Office, US-Streitkräfte, USIA) im Credit/Urheber/Kategorien. **Nicht** automatisch: CC BY, CC BY-SA, „PD-alt“, Library of Congress (Drittrechte), Agenturbilder, Bilder mit Einschränkungshinweis. Nicht freie Lizenzen werden abgelehnt. Eine Commons-Angabe gilt nie allein als Garantie.

## Bildquellen
Wikimedia Commons (Bilddatei, Lizenzmetadaten), Wikidata (Ereignis, Datum, Bildzuordnung), Wikipedia (Faktenauszug). Fakten-Zusatzquellen nur von einer Domain-Allowlist (NASA, Archives.gov, Bundesarchiv, bpb, Smithsonian u. a.) und nur, wenn erreichbar. Europeana ist **nicht** angebunden.

## Tatsächlich geprüft
* 80 Tests grün (u. a. Lizenzregeln, Datums-/Quellen-/Spoilerregeln, Dubletten, API-Ausfall, Paketplanung, Sperre, bestehende Spielstände).
* Echtlauf der Regeln gegen 25 echte Wikidata-/Commons-Kandidaten ohne KI: 15 abgelehnt (z. B. Foto aus 2010 zu Ereignis 1931), 10 manuell, **0 automatisch freigegeben**.

## Kuratierter Import (ohne API-Schlüssel)
`npm run import:kuratiert -- kuratiert-1` liest Kandidaten und Texte aus `content/recherche/kuratiert-N.json` (z. B. aus einer Redaktionssitzung) und lässt sie durch **dieselben Pipeline-Regeln** laufen. Erster Lauf (9. November 2026): 6 Ereignisse (Normandie, Apollo 11, Apollo 17, Voyager 1, Cassini, Challenger) – alle `auto_approved`; Texte aus dem Wikipedia-Auszug, Bilder vor dem Import gesichtet (Motiv, Personen, Beschriftung), zusätzliche Quellen einzeln abgerufen. Skylab, Mercury-Atlas 6, Mars Pathfinder, Apollo-Sojus u. a. wurden **zurückgestellt**, weil der Wikipedia-Auszug die nötigen Fakten (Startdatum) nicht enthielt.

## Offen / nicht geprüft
* **Kein Lauf mit Claude-API und Bildkontrolle** (Schlüssel fehlt), **kein Lauf in GitHub Actions**, noch keine automatisch freigegebenen Ereignisse im Produktivsystem.
* **Geringe Auto-Ausbeute zu erwarten:** Mit CC0/US-Regierungswerk und tagesgenauem Foto, ohne erkennbare Personen, bleibt nur ein kleiner Teil übrig. Der Vorrat von 150 wird deshalb nicht schnell erreicht; Hebel: weitere, fachlich geprüfte Quellen (z. B. NASA-Archiv direkt) oder gezielte manuelle Freigabe der Ausnahmefälle.
* Die KI-Bildkontrolle kann Ereignis-Zuordnung nur **vetieren**, nicht belegen.
* Gesperrte Ereignisse in laufenden/vergangenen Paketen: Bild wird nicht mehr ausgeliefert, das Paket selbst bleibt (Spielstände erhalten).

## Verbleibende rechtliche Risiken
Fehlerhafte Commons-/Wikidata-Angaben, falsche Urheberzuordnung, Persönlichkeits- und Markenrechte (bei Personen manuell), abweichende Rechtslage in Deutschland/EU, nachträglich zurückgezogene Lizenzen (Rechtsprüfung nur beim Import, nicht fortlaufend). Keine Rechtsberatung.

## Laufende Kosten
GitHub Actions (öffentliches/privates Repo im Freikontingent), Supabase Free (Speicherlimit der Bilder beachten), Cloudflare Pages. **Claude-API:** je Kandidat ein Aufruf mit Bild und Auszug (grob Cent-Bereich pro Ereignis; abhängig vom Modell, `PIPELINE_MODEL`).

## Zuverlässigkeit „5 neue Ereignisse täglich"
Hängt vollständig vom Vorrat ab. Heute: **0 automatisch freigegebene Ereignisse** → mit der Automatik allein gibt es noch kein tägliches Rätsel. Bis der Pool gefüllt ist, bleiben Tage ohne Rätsel (kein Auffüllen mit Ungeprüftem). Das Dashboard zeigt Vorrat in Tagen und warnt unter 30 Ereignissen.

## Einrichtung (einmalig, durch Sie)
GitHub → Repository → Settings → Secrets and variables → Actions: `DATABASE_URL`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`. Danach Actions → „Redaktion" → *Run workflow*.

---

## Vielfalt und Auswahlalgorithmus (9. November 2026)

**Datenmodell** (Migration `20261109000002_vielfalt.sql`): `category` (zwölf Themenfelder: Politik, Gesellschaft, Sport, Musik & Popkultur, Film & Fernsehen, Wissenschaft, Technik, Architektur, Natur & Umwelt, Wirtschaft, Entdeckungen, Raumfahrt & Astronomie; Altwert „kultur“ bleibt gültig), `subcategory`, `tags`, `region` (Europa, Nordamerika, Südamerika, Afrika, Asien, Ozeanien, global), `country`, `topic_key` (Ähnlichkeit); das Jahrzehnt folgt aus dem Ereignisjahr. Bestehende Ereignisse wurden zugeordnet (`npm run reklassifizieren`, ändert nur diese Metadaten; keine Texte, Bilder, Pakete oder Spielstände). Vor dem Umbau war der Bestand 8 von 16 Ereignissen Raumfahrt.

**Harte Regeln je Tagesrätsel** (`src/server/pipeline/select.ts`): ≥ 4 Themenfelder, ≤ 2 je Themenfeld, ≥ 3 Jahrzehnte, keine Region mit ≥ 3 von 5 (ohne „global“), höchstens 1 Raumfahrtereignis je Paket und höchstens 1 je 20 Ereignisse (zählt Kategorie **und** Schlagwort „raumfahrt“), keine ähnlichen Ereignisse (gleicher Themenschlüssel oder ≥ 2 gemeinsame Schlagwörter) im Paket und in den letzten 10 Ereignissen, Schwierigkeit 2 leicht / 2 mittel / 1 schwer (nur wenn nicht erreichbar, gelockert und protokolliert), keine Wiederholung. Ist keine regelkonforme Auswahl möglich, wird **nichts** geplant; das Dashboard und der Lauf warnen mit Gründen.

**Gewichtung der übrigen Auswahl:** Bevorzugt werden unterrepräsentierte Themenfelder (Ziel gleich verteilt, Raumfahrt 5 %), Regionen (Ziel Europa 30, Nordamerika 20, Asien 20, Afrika 10, Südamerika 10, Ozeanien 5, global 5 %), Jahrzehnte (gleich verteilt) und bessere Bildqualität; Wissenschaft + Technik werden ab 25 % Gesamtanteil gebremst. Die Gewichtung nutzt die letzten 60 Ereignisse aus Veröffentlichungen und Planung.

**Dashboard:** Admin → *Automatik* zeigt Verteilung nach Themenfeldern, Regionen und Jahrzehnten (Bestand und letzte 30 Tage), Raumfahrtanteil, Wissenschaft + Technik, ähnliche Ereignisse, Vorrat, Läufe. Admin → *Freigabe* ist der Freigabe-Assistent für Ausnahmefälle (Bild neben Urheber, Lizenz, Quelle und Prüfgründen; Freigabe nur mit drei Bestätigungen; Startseiten-Schalter).

**Simulation** (`docs/AUSWAHL-SIMULATION.md`, `npm run simulate:auswahl`): 30 Tage / 150 Plätze mit **synthetischen** Metadaten. Ausgewogener Pool: Raumfahrt 3,3 % der Auswahl, Wissenschaft + Technik 16,7 %. Einseitiger Pool (28 % Raumfahrt): Raumfahrt 4,0 % der Auswahl, Wissenschaft + Technik 29,3 %. Keine Regelverstöße, kein unplanbarer Tag. **Das beweist die Regeltreue des Algorithmus, nicht das Vorhandensein von 150 echten, freigegebenen Ereignissen.**

### Ehrlicher Stand
* **Echter Bestand:** 16 Ereignisse (6 automatisch freigegeben, 10 Entwürfe). Der Pool reicht für **kein** regelkonformes Tagesrätsel mehr; das erste Paket (heute) wurde vor den neuen Regeln geplant und enthält 4 Raumfahrt-/Technikereignisse. Es bleibt bestehen (bereits veröffentlicht).
* **Nicht umgesetzt:** (a) quoten-gesteuerte Themenrecherche (die automatische Recherche sucht weiterhin über Wikidata-Ereignistypen, nicht gezielt je Themenfeld); (b) weitere Bildquellen (Europeana, Library of Congress, Bundesarchiv, Deutsche Digitale Bibliothek) – sie brauchen teils API-Schlüssel und je eigene, fachlich zu prüfende Lizenzregeln; (c) „Eignung als Bilderrätsel“ und „historische Bedeutung“ als Bewertungsmerkmale (bisher nur Bildqualität); (d) Personen-Häufigkeit (nur über Schlagwörter/Themenschlüssel erfassbar).
* Der Freigabe-Assistent und das erweiterte Dashboard sind **nicht im Browser geprüft**.
