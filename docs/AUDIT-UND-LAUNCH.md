# Audit und Launch-Reife – Stand 9. November 2026

Abgleich mit dem Master-Prompt „Website-, Game-Design- und Growth-Upgrade“. **Geprüft** = tatsächlich ausgeführt/gemessen; **vorhanden** = früher gebaut, in dieser Runde nicht neu bewertet; **offen** = nicht umgesetzt.

## Tatsächlich geprüft in dieser Runde
* **13 Playwright-Spieltests** gegen einen lokalen Produktions-Build (Microsoft Edge, Desktop und Pixel 7): kompletter Ablauf (spielen, Neuladen, Ergebnis, Teilen, Statistik), Doppelklick wertet nur einmal, Lösungen zukünftiger Runden nicht abrufbar, Netzwerkfehler verbrauchen keinen Tipp, Wissensseite des heutigen Rätsels verrät nichts, SEO-Grundlagen (Sitemap, robots, Canonical, Open Graph), Admin-Anmeldung, Startseite, keine horizontalen Scrollbalken in allen Hauptansichten, Touch-Ziele ≥ 44 px, Web Vitals lokal.
* **1 echter Befund, behoben:** Auf Smartphones mit 360 × 640 lag der Spielstart-Button nach der neuen Fotoreihe unter der Falz (y = 752 px). Auf Displays unter 700 px Höhe steht die Fotoreihe jetzt **nach** dem Button; der Test (Button ohne Scrollen sichtbar) besteht wieder.
* **95 Unit-/Integrationstests**, Typecheck, Lint grün (vorheriger Stand).
* Live (Produktion, 9. November): Startseite, Banner/Consent (ablehnen, akzeptieren, widerrufen), Sitemap, robots, Bestätigungsdatei, Spielstart über die API mit Bildauslieferung, Paketversionierung.
* **Nicht** getan: Durchspielen auf der Produktion mit echten Spielerdaten (bewusst keine Tests auf Echtdaten; Ablauf ist durch die E2E-Tests abgedeckt), Sommerzeit-Umstellung (nur Unit-Logik, kein E2E), echte Geräte/Safari, Lighthouse-Feldmessung, vollständige WCAG-Prüfung mit Screenreader.

## Zu den sechs Audit-Befunden
1. **Impressum unvollständig:** stimmt – **LAUNCH-BLOCKER** (siehe unten). Es werden bewusst keine erfundenen Angaben gezeigt.
2. **Datenschutzerklärung als Entwurf:** stimmt – **LAUNCH-BLOCKER**; muss zusätzlich Google Analytics (Einwilligung, Widerruf, Speicherdauer), Cloudflare, Supabase und die eigene Messung beschreiben.
3. **Rätselarchiv leer:** kein Programmfehler. Das Archiv zeigt nur Rätsel **vor dem heutigen Tag**; das erste Rätsel lief heute. Ab morgen erscheint Paket Nr. 2 (die ersetzte Fassung Nr. 1 wird bewusst nicht doppelt gelistet).
4. **Wissensarchiv leer:** Wissensseiten gibt es nur für Ereignisse mit eingeschaltetem „knowledge_enabled“ **nach** ihrem Rätseltag; derzeit ist keines eingeschaltet (bewusst, siehe docs/SEO-ANALYTICS.md: Qualitätsschranke fehlt).
5. **/spielen Ladezustand:** durch E2E (Ablauf, Neuladen, Netzfehler) als funktionierend bestätigt; der Ladezustand ist ein kurzer Skeleton, danach das Spiel.
6. **robots/sitemap/Social-Preview:** live geprüft (robots.txt, sitemap.xml mit 3 URLs, Canonical, Open-Graph-Bild 1200 × 630). Die Sitemap lieferte nach einer meiner Änderungen ca. zehn Minuten einen Fehler (500, SQL-Anführungszeichen), behoben.

## Launch-Blocker (müssen Sie liefern/entscheiden)
**Impressum** (Umgebungsvariablen `NEXT_PUBLIC_OPERATOR_NAME`, `NEXT_PUBLIC_OPERATOR_ADDRESS` (Zeilen mit `;` trennen), `NEXT_PUBLIC_OPERATOR_EMAIL`): vollständiger Name bzw. Firma und Rechtsform, ladungsfähige Anschrift, E-Mail, ggf. Telefon, Vertretungsberechtigte, Registereintrag, USt-ID, Verantwortlicher nach § 18 MStV. **Datenschutz:** Verantwortlicher samt Kontakt, ggf. Datenschutzbeauftragter, Auftragsverarbeiter (Cloudflare, Supabase, Google bei Einwilligung), Speicherdauern. **Bildlizenzen:** CC BY/BY-SA-Bilder (Owens, Mauerfall, Aldrin-Quelle NASA) verlangen sichtbare Namensnennung – im Spiel und in den Nachweisen vorhanden, rechtlich zu bestätigen. **Werbung:** nicht aktiviert und nicht vorbereitet.

## Umsetzungsstand je Phase
| Phase | Stand |
|---|---|
| A Audit/Spieltest | geprüft (siehe oben); Fehlerzustände (Skeleton, Wiederholen) **vorhanden** |
| B Spieloberfläche, Auflösung, Ergebnis, Teilen | **vorhanden** (Runde/Fortschritt, Slider + Zahlenfeld, Auflösung mit „Was geschah?/Warum bedeutsam?“, Ergebnis, spoilerfreies Teilen, OG-Bild); Startseite/Hero neu gestaltet |
| C Inhalte | Qualitäts- und Vielfaltssystem **vorhanden** (Lizenz-Allowlist, Prüfprotokoll, Auswahl-Algorithmus, Simulation); Bestand klein (siehe docs/AUTOMATISIERUNG.md) |
| C4 Punkteformel | `max(0, 1000 − 50 × Abweichung)` unverändert; ab 20 Jahren 0 Punkte. Einschätzung: führt bei schweren Ereignissen schnell zu 0 Punkten (Frust) – Alternative nur als getrennte Empfehlung/Experimentmodus, **nicht umgesetzt**, damit Ergebnisse vergleichbar bleiben |
| D Bindung | persönliche Statistik, Serie, Archiv, Übung **vorhanden**; Freundesduell (identischer Link zur Tagespartie) **vorhanden** als Link, **kein** getrennter Duell-Vergleich |
| E SEO | siehe docs/SEO-ANALYTICS.md |
| F Performance/Accessibility | lokale Web-Vitals-Tests grün; keine Feldmessung; WCAG-Prüfung nicht vollständig |
| G Analytics | eigene cookiefreie Messung + einwilligungsgesteuertes GA4 **vorhanden**; Erweiterung der Eigenmessung (Seitenaufrufe, Zustimmungsquote) **vorgeschlagen, nicht umgesetzt** |
| H AdSense | **offen** |
| I Rechtliches | Blocker dokumentiert (oben) |

## Einschätzung Launch-Reife
**Technisch** spielbar und stabil (E2E grün). **Nicht startklar für einen öffentlichen Launch**, solange Impressum und Datenschutzerklärung nicht vollständig und rechtlich geprüft sind. Inhaltlich ist der Bestand klein (kein Vorrat für regelkonforme Tagesrätsel ab morgen ohne weitere Freigaben).
