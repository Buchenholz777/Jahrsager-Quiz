# SEO, Analytics und Wachstum – Stand 9. November 2026

Getrennt nach **umgesetzt und geprüft**, **vorbereitet (braucht Ihre Konten/IDs)** und **offen**.

## Domain (Befund)
Produktive Domain: **`www.jahrsagerquiz.de`** (Cloudflare Pages; `jahrsagerquiz.de` leitet per 301 auf `www` weiter). Die Schreibweisen `jahrsagerrquiz.de` (zwei r) und `jahrsagequiz.de` aus den Projektangaben sind **nicht** die produktive Domain; es wurden weder DNS noch Canonicals danach geändert. Canonical, Sitemap-Verweis und Open Graph zeigen einheitlich auf `https://www.jahrsagerquiz.de`.

## Ist-Zustand (Live-Prüfung per HTTP)
| Punkt | Befund |
|---|---|
| robots.txt | vorhanden; sperrt `/admin`, `/api/`, `/ergebnis`, `/spielen`, `/statistik`, `/tagesraetsel/`; verweist auf die Sitemap |
| Sitemap | vorhanden, dynamisch; nur Startseite, Spielanleitung, Archiv (+ Wissensseiten, sobald veröffentlicht); **lastmod war „jetzt“** → korrigiert (nur letztes veröffentlichtes Rätsel) |
| Canonical / OG / Twitter / `lang=de` | vorhanden, korrekt |
| Strukturierte Daten | 2 JSON-LD-Blöcke auf der Startseite (WebSite/Organization) |
| noindex | Admin, Ergebnis, Statistik, Spielseite, leeres Wissensarchiv: ja (gewollt) |
| Google Analytics / GTM / Consent | **keine** Einbindung vorhanden (nur die eigene cookiefreie Messung `/api/messung`) |
| Weiterleitungen | apex → www (301) |

## Umgesetzt
* **Meta-Titel/-Beschreibung der Startseite** laut Vorgabe („JAHRSAGER Quiz – Tägliches Geschichtsquiz kostenlos spielen“).
* **Sitemap:** realistische `lastmod`, ohne wirkungslose `changefreq`/`priority`; enthält nur indexierbare, veröffentlichte Seiten.
* **Google Analytics 4 / Tag Manager mit Consent Mode v2 (Basic):** `src/lib/tracking.ts`, `src/components/analytics/*`.
  * **Ohne konfigurierte ID passiert nichts** (kein Banner, kein Skript). Mit ID lädt Google erst nach Zustimmung; Standard `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` = denied. Banner mit gleichwertigen Schaltflächen „Alle ablehnen“ / „Alle akzeptieren“ / „Einstellungen“; Widerruf über „Cookie-Einstellungen“ im Footer (löscht `_ga*`-Cookies und setzt Consent auf denied). GTM hat Vorrang vor direktem GA4 (nie beides).
  * **Ereignisse:** `home_cta_click`, `daily_quiz_started`, `daily_quiz_resumed`, `quiz_round_completed`, `daily_quiz_completed`, `archive_quiz_started`, `archive_quiz_completed`, `quiz_result_shared` (nur bei bestätigtem nativen Teilen/Kopieren), `share_opened` (WhatsApp geöffnet, nicht bestätigt), `archive_opened`, `instructions_opened`, `history_article_view`, plus ein `page_view` je Navigation. Doppelauslösung wird durch Sitzungs-Sperren je Partie/Runde verhindert. Parameter ohne Personenbezug, Punkte nur als Klasse (`score_bucket`); keine Lösungen oder Spielerdaten.
  * 4 automatisierte Tests (ohne ID nichts, ohne Einwilligung nichts, Widerruf stoppt, GTM-Vorrang).
* **Spielfunktionen laufen ohne Einwilligung** unverändert.
* Bestehend und behalten: Eigenmessung ohne Cookies (Startseite → Klick → Partien, Abschluss, Teilen, Wiederkehr) im Admin unter *Kennzahlen*.

## Vorbereitet – benötigt Ihre Konten (nicht ohne Berechtigung durchgeführt)
1. **GA4:** In analytics.google.com Property anlegen → Datenstream „Web“ → Mess-ID `G-…` kopieren. In Cloudflare Pages (Einstellungen → Variablen, Typ **Text**) `NEXT_PUBLIC_GA_MEASUREMENT_ID` setzen, **und** in `scripts/build-pages.mjs` bzw. der Build-Umgebung verfügbar machen (`NEXT_PUBLIC_*` wird beim Build fest eingebaut → neuer Deploy nötig). Alternativ `NEXT_PUBLIC_GTM_ID` (`GTM-…`).
2. **Key Events** in GA4 (Verwalten → Ereignisse → „Als Schlüsselereignis markieren“): `daily_quiz_started`, `daily_quiz_completed`, `quiz_result_shared`.
3. **Search Console:** Domain-Property `jahrsagerquiz.de` anlegen (DNS-TXT bei checkdomain nötig) **oder** URL-Präfix `https://www.jahrsagerquiz.de/` mit HTML-Tag: Wert in `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` setzen (Unterstützung ist eingebaut). Dann Sitemap `https://www.jahrsagerquiz.de/sitemap.xml` einreichen. GA4 ↔ Search Console unter GA4 → Verwalten → Produktverknüpfungen verbinden.
4. **Datenschutzerklärung:** muss Google Analytics (Anbieter, Zweck, Rechtsgrundlage Einwilligung, Widerruf, ggf. Drittlandübermittlung) ergänzen. **Rechtlich zu prüfen – keine Rechtsberatung.** Ebenso die Einwilligungstexte.

## Keyword- und Suchintentions-Strategie (ohne erfundene Zahlen)
Es liegen **keine Suchvolumen- oder Schwierigkeitsdaten** vor (kein Keyword-Tool angebunden); Einschätzungen sind qualitativ. Datenquelle später: Search Console (echte Suchanfragen) – erst danach priorisieren.
* **Spielintention** (→ Startseite, Spielanleitung): „Geschichtsquiz“, „Geschichtsquiz online/kostenlos/täglich“, „Jahreszahlen raten/erraten“, „historische Bilder Quiz“, „Weltgeschichte Quiz“. Hoher Wettbewerb bei allgemeinen Begriffen; realistischer sind Kombinationen mit dem Alleinstellungsmerkmal (Bilder + Jahr schätzen + täglich).
* **Wissensintention** (→ Wissensseiten): „Wann war der Fall der Berliner Mauer?“, „In welchem Jahr war die erste Mondlandung?“, „Wann war der Ausbruch des Mount St. Helens?“ usw. Konkurrenz: Wikipedia/Medien; Chance nur mit eigenständigem Mehrwert (Foto, Einordnung, Quellen) und Long-Tail-Fragen.
* Prinzip: jede Wissensseite beantwortet **eine** konkrete Frage vollständig und führt danach zum Tagesrätsel.

## Wissensarchiv (Stand und Lücke)
Wissensseiten (`/geschichte/<slug>`) existieren, erscheinen aber erst **nach dem Tagesrätsel-Tag** und nur bei `knowledge_enabled`; derzeit ist keine freigegeben, daher ist `/geschichte` bewusst `noindex` und nicht in der Sitemap. Die vorhandenen Auflösungstexte (60–100 Wörter) reichen **nicht** als eigenständige SEO-Seite. **Offen:** Qualitätsschranke vor Indexfreigabe (Mindestlänge/Struktur des Hintergrundtextes, ≥ 2 Quellen, freigegebene Bildrechte) und Kategorie-Übersichten – bewusst noch nicht automatisch veröffentlicht, um keine dünnen Massenseiten zu erzeugen.

## Offen / nicht umgesetzt (ehrlich)
* GA4/GTM **nicht live** (keine ID); GA4 empfängt keine Daten; Consent-Banner ist im Produktivsystem **nicht sichtbar**, bis eine ID gesetzt ist. Search Console **nicht verbunden**.
* Phase 14 (Analytics-/SEO-Dashboard mit Google-APIs): nicht gebaut. Empfehlung: GA4-Berichte + Search Console + vorhandene Eigenmessung (Admin → *Kennzahlen*) nutzen oder Looker Studio; eigenes Reporting erst bei Bedarf.
* Automatische SEO-Überwachung (Link-/Sitemap-/Meta-Prüfung), Lighthouse/Core-Web-Vitals-Messung, Kategorie-Seiten, Bild-SEO für Wissensseiten, PWA/Erinnerungen, Open-Graph-Bild je Wissensseite: **nicht** umgesetzt.
* Keine Core-Web-Vitals-Messwerte (nur Feldmessungen mit Search Console/CrUX später belastbar).

## Laufende Kosten
GA4, GTM, Search Console: kostenlos. Keine zusätzlichen Dienste durch diese Maßnahmen. Regelmäßige Arbeit: Datenschutztext pflegen, Search-Console-Berichte monatlich prüfen, Wissensseiten redaktionell freigeben.

## Traffic-Aktionsplan (organisatorisch, nicht umgesetzt)
Ergebnis-Teilen (vorhanden, spoilerfrei) · Empfehlungen in Geschichts-Communities, Lehrer-/Wissensportalen, Geschichtsmagazinen · Kooperationen anfragen (keine gekauften Links, keine Bots). Nichts davon ist umgesetzt.
