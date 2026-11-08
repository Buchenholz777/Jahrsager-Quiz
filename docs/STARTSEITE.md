# Startseite „History comes alive“ – Umsetzung und Stand

Stand: 8. November 2026. Getrennt nach **tatsächlich geprüft** und **offen/nicht gemessen**.

## Was die Startseite jetzt ist
* **Header/Footer:** das JAHRSAGER-QUIZ-Logo (transparent, siehe `docs/REBRANDING.md`); auf der Startseite dunkel und nahtlos mit dem Hero verbunden. Im Hero steht kein zweites Logo.
* **Hero (Mitternachtsblau):** gelber Eyebrow „Das tägliche Geschichtsquiz“, dreizeilige Headline „5 Bilder. 5 Ereignisse. Rate das Jahr.“ (letzte Zeile gelb mit kurzer Linie), Beschreibung, ein dominanter gelber Button, „Kostenlos · Ohne Anmeldung“, „5 Ereignisse · Bis zu 5.000 Punkte“.
* **Bildkomposition (rechts, mobil unter dem Button):** vier authentische Fotos in einer asymmetrischen Editorial-Collage mit leichten Neigungen, dekorativer Zeitleiste ohne Zahlen und Fragezeichen-Marke. Nicht interaktiv. Ausklappbare **Bildnachweise** mit Lizenzlinks direkt darunter.
* **Entfernt:** die gesamte interaktive Demokarte (Platzhalterbild, Beispiel-Zeitleiste, Jahres-Tasten, simulierte Rundenanzeige, „Selbst spielen“). Auf der Startseite gibt es keinen Slider mehr; das E2E-Testset prüft das.
* **Darunter:** „So funktioniert’s“ (3 kompakte Karten), „Weltgeschichte entdecken“ (Teaser mit drei Fotos zu veröffentlichten Ereignissen, Links ins Wissensarchiv), „Täglich neu“, schlichter Footer.
* **CTA-Verhalten:** „Jetzt Tagesrätsel spielen“ → direkt zu `/spielen` (erste echte Runde); „Spiel fortsetzen“ → nächste offene Runde; „Heutiges Ergebnis ansehen“ → vorhandene Ergebnisseite. Die Spielstandserkennung (`/api/spiel/status`) ist unverändert; keine Zwischenseite, keine Anmeldung.

## Bildauswahl und Bildrechte (wichtig)
Die Bilder kommen **nicht** aus festen Dateien, sondern aus der Datenbank (`src/server/services/showcase.ts`):
* nur Ereignisse, die **veröffentlicht** sind und **nicht in einem heutigen oder zukünftigen Tagespaket** vorkommen (kein Spoiler),
* **keine Platzhalterbilder** – gibt es keine geeigneten Bilder, zeigt die Seite keine Komposition und keinen Teaser,
* **Produktionsinhalte nur mit Bildstatus „freigegeben“** (menschlich geprüft); **Demo-Inhalte** nur, wenn `ALLOW_DEMO_CONTENT=true`,
* Bildnachweis und Lizenz stehen an jedem Bild bzw. in den „Bildnachweisen“.

**Aktueller Rechtestand:** Alle derzeit angezeigten Fotos (Mondlandung, Motorflug, Mauerbau, Kennedy-Rede, Wunder von Bern, Hubble, Sonnenfinsternis) stammen aus den Recherchen in `content/recherche/ereigniskarten-recherche.md` und haben den Bildstatus **„noch zu prüfen“**. Das sind Demo-Inhalte der Entwicklungsumgebung; **die Bildfreigabe ist nicht abgeschlossen** (offene Punkte: Originalquellen, Share-Alike bei CC BY-SA, Personenabbildungen, NASA-Hinweise – siehe `docs/OFFENE-PRUEFPUNKTE.md`). In einer Produktivumgebung mit `ALLOW_DEMO_CONTENT=false` erscheinen sie nicht; die Startseite zeigt dann erst Bilder, wenn ein Mensch Ereignisse freigegeben hat.

## Messung und A/B-Vorbereitung (datensparsam)
* Neue Ereignisse in der vorhandenen Eigenmessung (keine Cookies, keine IDs): `home_view` (mit Variante und Gerätegruppe mobil/desktop) und `cta_click`. Im Admin unter „Kennzahlen“: Aufrufe, Spielstart-Klicks und Klickrate je Variante × Gerät, Partien mit mindestens einem Tipp, Abschlussquote, Teilen-Nutzung, Wiederkehr (aus Spieldaten), Abbruchpunkte je Runde.
* Die Variante steht in `src/lib/experiments.ts` (derzeit nur „geschichte“, per `NEXT_PUBLIC_HERO_VARIANT` wählbar). Für einen A/B-Test muss eine zweite Hero-Variante gebaut und die Zuweisung (serverseitig/Edge) ergänzt werden.
* **Es wird keine Verbesserung der Conversion behauptet** – es gibt noch keine Messdaten. Mobile Abbruchraten je Gerät sind nur für den Startseiten→Klick-Schritt aufgeschlüsselt, nicht für die einzelnen Spielrunden.

## Spielseite (gezielte Verfeinerung)
* Schwebende Beschriftung auf der Zeitleiste entfernt; stattdessen eine kurze Anleitung **oberhalb** der Leiste („Wische oder tippe auf die Zeitleiste.“ bzw. „Ziehe den Regler oder klicke auf die Zeitleiste.“). Der Regler-Geist (Pfeilsymbol) bleibt als Einladung, bewegt sich viermal und ruht; bei „weniger Bewegung“ statisch.
* Fotos größer und ruhiger: dünner Rahmen statt weißer Karte, kein Schlagschatten.
* Zusätzlicher Wegweiser unter dem Button („Schritt 1: Jahr wählen · Schritt 2: einloggen“ bzw. „Du tippst auf …“). Spielregeln und Punkteberechnung unverändert.

## Tatsächlich geprüft
* Lint, Typecheck, 59 Unit-/Integrationstests (u. a. Bildauswahl: keine Platzhalter, nie Ereignisse des heutigen Rätsels, Freigabestatus), 13 E2E-Tests im Production-Build.
* E2E-Startseitentest: keine Demokarte/kein Slider/kein „Selbst spielen“/kein „Designplatzhalter“, kein Logo-Artwork im Hero, Komposition mit ≥ 2 geladenen Bildern, Bildnachweise vorhanden, CTA führt direkt in die erste Runde.
* Mobil: Spielstart-Button bei 360×640, 375×667 und 390×844 ohne Scrollen sichtbar (Höhe ≥ 48 px); kein horizontaler Überlauf bei 320/360/375/390/430/768/1024/1440 px.
* Sichtprüfung per Screenshot (375 und 1440 px) der Startseite und der Spielfrage.
* Lokale Messung im Production-Build (Smartphone-Emulation, ohne Netzwerkdrosselung): Startseite LCP ≈ 0,4 s, CLS 0.

## Offen / nicht geprüft
* Mobile Safari und echte Geräte; Core Web Vitals mit gedrosseltem Netz (PageSpeed Insights); INP.
* Bildfreigabe der angezeigten Fotos (siehe oben).
* Kontraste sind berechnet (Gelb auf Mitternachtsblau ≈ 8:1, Creme auf Mitternachtsblau ≈ 13:1), nicht mit einem Prüfwerkzeug getestet.
