# Autonome Content-Engine – Ist-Stand gegen die Anforderungen (9. November 2026)

Legende: **implementiert** (Code vorhanden) · **getestet** (automatisierte Tests, Mock-Daten) · **aktiv** (läuft produktiv) · **offen**.

**Kurzfassung ehrlich:** Die Pipeline ist weitgehend gebaut und getestet, aber **nicht autonom aktiv**. Es fehlen drei Dinge außerhalb des Codes: ein **Anthropic-API-Schlüssel mit Guthaben** (ohne ihn erzeugt das System keine Quiztexte), die **GitHub-Secrets** für den Zeitplan und eine **Kontaktangabe** für die Wikimedia-Kennung. Der freigegebene Vorrat beträgt heute **3 Ereignisse** (Ziel 300); das System meldet das als *Produktionsblocker*.

## Pipeline-Stufen
| Stufe | Stand |
|---|---|
| DISCOVER (Wikidata-SPARQL: Ereignisse 1900–2020 mit tagesgenauem Datum, Bild, dt. Wikipedia) | implementiert, getestet (Regeln), real gegen Wikidata ausprobiert; **nicht aktiv** (kein Zeitplan-Secret) |
| NORMALIZE / Dedup (Wikidata-ID, Bild-Fundstelle, `pipeline_seen`) | implementiert, getestet; semantische Ähnlichkeit nur über `topic_key`/Schlagwörter bei der Auswahl, **nicht** bei der Recherche |
| FACT-CHECK | teilweise: Datum Ereignis ↔ Aufnahmedatum, Jahresbereich, ≥ 2 **unabhängige externe** Quellen (verschiedene Domains auf der Allowlist; Wikipedia/Wikidata zählen nicht), formale Textprüfung. **Offen:** Abgleich widersprüchlicher Jahresangaben mehrerer Quellen, Inhaltsprüfung der KI-Texte gegen Quellen |
| IMAGE-SEARCH | **implementiert, getestet, live gegen Wikimedia erprobt (nicht produktiv gelaufen):** je Ereignis wird in der Commons-Kategorie (Wikidata P373) ein Foto gesucht, das Lizenz-Allowlist, Aufnahmedatum = Ereignistag und Mindestgröße erfüllt; sonst bleibt das Wikidata-Standardbild. Zwei Suchwege: Ereignisse in den USA zuerst (Bilder von Bundesbehörden), dann weltweit. Messung (ohne KI): bei US-Ereignissen fand die Bildsuche für ca. 18 % (13 von 72) ein regelkonformes Foto, weltweit ca. 2 % (1 von 40) – z. B. Pearl Harbor, Hindenburg, San Francisco 1906 |
| LICENSE-CHECK | implementiert, getestet: **Allowlist CC0 und gemeinfreie Werke der US-Bundesregierung** (NASA, NARA, USGS …) mit Nachweis. **Abweichung zum Prompt:** CC BY 4.0 ist **nicht** automatisch zugelassen (geht in die manuelle Prüfung); Entscheidung siehe unten |
| AI-EDITOR | implementiert (Claude-API, strukturierte JSON-Ausgabe, formale Validierung, Bild-Veto), getestet mit Attrappen; **nicht aktiv ohne API-Schlüssel** |
| QUALITY-GATE | implementiert, getestet; Prüfprotokoll je Ereignis (`events.audit`) |
| CONTENT-POOL | implementiert; Status siehe Zuordnung unten |
| SCHEDULE | implementiert, getestet: Vielfaltsregeln, 30 Tage Vorlauf (Standard), reserviert nur aus freigegebenem Pool; Reservierung in Datenbank-Transaktion (Node/pg); Workflow `concurrency` verhindert parallele Läufe |
| PUBLISH | implementiert (vorhanden): Veröffentlichung hängt **nicht** von einem Cronjob ab, sondern wird bei jedem Abruf aus dem Berliner Datum abgeleitet (Zeitzone/Sommerzeit getestet); Paketversionierung für Korrekturen |
| MONITOR | **neu:** Vorratsstufen, KI-Budget, Veröffentlichungsprüfung, Alarm per fehlgeschlagenem GitHub-Lauf |

## Statuszuordnung (Anforderung → vorhanden)
DISCOVERED/FACT_PENDING/IMAGE_PENDING/RIGHTS_PENDING = Kandidat (noch nicht angelegt bzw. `pipeline_seen`) · FACT_VERIFIED/RIGHTS_VERIFIED/EDITORIAL_READY = Prüfschritte im `audit` · QUALITY_APPROVED = `pipeline_state = auto_approved`, `status = freigegeben` · MANUAL_REVIEW = `manual_review`/`entwurf` · REJECTED = `pipeline_seen.decision = rejected` bzw. `blocked` · SCHEDULED = `eingeplant` · PUBLISHED = `veroeffentlicht` · REVOKED = `blocked`. Es gibt **keinen Weg von der Entdeckung zur Veröffentlichung** ohne Freigabe (Test: Entwürfe nicht planbar/öffentlich).

## Vorrat und Alarm (neu)
Schwellen konfigurierbar (`POOL_TARGET=300`, `POOL_BOOST=150`, `POOL_WARN=105`, `POOL_CRITICAL=35`, `POOL_BLOCKER=5`): ≥ 300 Ziel erreicht · < 150 erhöhte Produktion · < 105 Warnung (< 21 Tage) · < 35 kritisch (< 7 Tage) · < 5 Produktionsblocker. Bereits eingeplante Ereignisse zählen **nicht** zum freien Vorrat. Anzeige im Admin unter *Automatik*; der Zeitplan-Lauf (`npm run pipeline -- monitor`) endet bei *kritisch/Blocker* oder fehlendem Tagesrätsel von heute **mit Fehler**, wodurch GitHub den Inhaber per E-Mail benachrichtigt (kostenlos, bewusst kein eigener Mail-Dienst). Heute ausgelöst: **Produktionsblocker (Vorrat 3)**.

## Kosten- und Schutzmechanismen
Begrenzte Chargen (`--max 25`), KI-Aufrufe je Lauf/Tag/Monat (`AI_MAX_CALLS_PER_RUN=25`, `_PER_DAY=60`, `_PER_MONTH=1200`, protokolliert in `pipeline_runs`), bereits geprüfte Kandidaten werden nicht erneut recherchiert, Retry mit Wartezeit und `Retry-After` bei 429/5xx, Zeitlimits, keine Schlüssel in Logs. Kostenschätzung ohne Preisliste **nicht belastbar**: Aufrufe × Preis je Aufruf des gewählten Modells (Bild + Text); Obergrenze = Budget × Preis. Wikimedia-Kennung benötigt `PIPELINE_CONTACT`.

## Tests (automatisiert, Attrappen)
105 Unit-/Integrationstests, u. a.: Lizenz-Allowlist inkl. Ablehnung nichtfreier/NC-Lizenzen, Quellenanforderung (mind. 2 unabhängige Domains), Datumsabgleich, Dubletten, Zeitspoiler, KI-Entwurfsvalidierung, API-Ausfall, Paketplanung/Vielfalt (30-Tage-Simulation mit synthetischen Daten), Sperre, Vorratsstufen, KI-Budget, Paketversionierung, Wissensarchiv-Qualitätsschranke, Tageswechsel/Zeitzone. 13 Browser-Spieltests (Playwright). **Nicht getestet:** vollständiger Lauf mit echter Claude-API, Wiederanlauf nach Neustart in GitHub Actions, mehrtägige Live-Simulation.

## Offen / nicht umgesetzt
* Aktivierung: API-Schlüssel, GitHub-Secrets (`DATABASE_URL`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY`, `PIPELINE_CONTACT`).
* Eigene Tabellen laut Konzept (`event_sources`, `event_images`, `content_jobs`, `content_audit_log`): bewusst **nicht** neu angelegt – gleichwertig über `events.sources`/Bildfelder, `pipeline_runs`, `events.audit`; Normalisierung wäre eine größere Migration ohne Funktionsgewinn.
* Weitere Bildquellen (Europeana, Library of Congress, Bundesarchiv, DDB) und freie Commons-Suche je Ereignis; Ersatz-Tagespakete als eigene Ebene; manuelles „Bild austauschen", „Recherchejob starten" im Admin (derzeit nur per Skript/GitHub „Run workflow").
* Faktenabgleich mehrerer Quellen auf widersprüchliche Jahreszahlen.

## Entscheidungen, die bei Ihnen liegen
1. **Lizenzpolitik:** Der Prompt nennt CC0 und CC BY 4.0 als Auto-Allowlist. Aktuell: CC0 und US-Regierungswerke automatisch; CC BY/BY-SA nur manuell (Namensnennung-Pflichten, ShareAlike). Soll CC BY 4.0 automatisch zugelassen werden (größerer Pool, mehr Auflagen und Risiko)?
2. **KI-Anbieter/Kosten:** Ohne bezahlten API-Zugang bleibt die Recherche manuell (Sitzungen).
3. **Kontakt** für Wikimedia-Kennung und Alarm-E-Mail (GitHub-Konto-E-Mail).
