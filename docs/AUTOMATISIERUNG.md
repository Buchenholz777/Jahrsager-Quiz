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
