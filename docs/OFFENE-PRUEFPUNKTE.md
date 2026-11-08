# Offene rechtliche und redaktionelle Prüfpunkte

Stand: 8. November 2026. Diese Liste trennt klar zwischen dem, was recherchiert wurde, und dem, was ein Mensch noch prüfen muss. **Kein Bild und kein Text ist redaktionell freigegeben.** Details je Ereignis: `content/recherche/ereigniskarten-recherche.md` (automatisch aus `content/ereigniskarten.ts` erzeugt).

## A. Bilder (gilt für alle 15 Karten)

* Alle 15 Kandidatenbilder wurden am 8. November 2026 mit Zustimmung des Auftraggebers von Wikimedia Commons importiert (Bildstatus **„noch zu prüfen“**, nicht freigegeben) und von mir (KI) einmal angesehen – das ersetzt keine redaktionelle Prüfung. Beschreibungen und Alternativtexte wurden an das tatsächlich sichtbare Motiv angepasst.
* **Bei der Sichtung gefunden:** Das Panama-Foto trägt unten eine Archivbeschriftung mit Ereignis und Datum (würde die Lösung verraten) – der untere Rand wird deshalb beim Import abgeschnitten (6,5 %); am Bild prüfen. Das MLK-Foto ist eine Nahaufnahme (keine Menschenmenge), das iPhone-Foto zeigt Jobs vor einer Folie mit Produktname und Slogan, das Live-Aid-Foto zeigt die Bühne mit Kodak-Werbung (Marken im Bild), das Ford-Foto zeigt Fahrgestelle ohne erkennbare Arbeiter.
* Wird ein Bild ersetzt oder zugeschnitten, erhält das Ereignis eine neue Fassung mit neuer Bild-ID; Partien, die mit der alten Fassung begonnen wurden, können das alte Bild nicht mehr laden (Bildauslieferung prüft nur die aktuelle Fassung). Bildänderungen daher nicht während laufender Tagesrätsel vornehmen.
* **Originalseiten** (NASA images.nasa.gov, Library of Congress, NARA, JFK Library, ETH e-pics, Bundesarchiv, Fortepan) waren bei der Recherche überwiegend nicht lesbar (leere Skriptseiten oder HTTP 403). Lizenz, Urheber und Datum sind dort noch zu bestätigen.
* Pro Bild ein Mensch: Bild ansehen (Jahreszahl im Bild? Passt das Motiv zur Beschreibung? Alternativtext prüfen), Urheber und Aufnahmedatum belegen, Lizenz am Original bestätigen, dann erst „Redaktionell freigegeben“ setzen.
* **Share-Alike (CC BY-SA)** bei: Wunder von Bern (4.0), Mauerbau, Tag der Deutschen Einheit, Live Aid, Olympia 1972 (jeweils 3.0/3.0 DE). Rechtlich klären, ob Zuschnitt/Skalierung eine Bearbeitung im Sinne der Lizenz ist und welche Folgen das für die Webseite hat. Namensnennung, Lizenzlink und Bearbeitungsvermerk sind in der Anzeige vorgesehen.
* **Personenabbildungen** (Persönlichkeitsrechte, auch bei gemeinfreien Fotos): Aldrin (NASA weist bei kommerzieller Nutzung ausdrücklich darauf hin), Steve Jobs, Live-Aid-Musiker, Martin Luther King, Kennedy.
* **NASA**: keine Andeutung einer NASA-Unterstützung; Logos/Emblem separat geregelt.
* **Martin Luther King**: Das King Institute erklärt, keine Rechte an Bildern/Texten Kings vergeben zu können (Lizenzgeber des Nachlasses: IPM). Das Foto gilt laut Commons als gemeinfreies US-Regierungswerk – für kommerzielle Nutzung rechtlich klären oder Ereignis ersetzen.
* **Offene Einzelwidersprüche**: iPhone (Fotograf laut Flickr-Text „@arnoldkim“, laut Commons Blake Patterson), Kennedy (Knudsen vs. Stoughton), Eddington (Zuschreibung im ESO-Credit; restaurierte Kopie der Sobral-Platte), Olympia (Spender „Romák“ vs. „Románk“, Fortepan-Seite nicht lesbar), Mauerbau (nur „August 1961“).
* **Zu niedrige Auflösung**: Tag der Deutschen Einheit (736 px), Mauerbau (800 px) – ggf. besseres Bundesarchiv-Foto suchen.
* **Mauerfall, Kniefall von Warschau, Euro-Bargeld, Berliner Hochbahn, Barnard, Walkman**: kein geeignetes, belegtes freies Foto gefunden (vgl. früherer Bericht) – wurden durch andere Ereignisse ersetzt.

## B. Texte und Fakten

* Alle Texte nutzen ausschließlich Fakten, die in den genannten Quellen standen. **Teilweise Hilfsquellen (Wikipedia)** bei: Wunder von Bern, Live Aid, Ford-Fließband, Eddington, Olympia (Zahl der ermordeten Israelis), Marsch auf Washington (Teilnehmerzahl). Primärquellen ergänzen (DFB/FIFA/bpb, Henry Ford Museum/NPS, Royal Society, IOC/Bundesregierung).
* Bewusst **weggelassen**, weil nicht belegt: Spiegelfehler und Reparatur von Hubble, Spendensumme von Live Aid, Ergebnisverkündung 1919, Vorbereitung des Kennedy-Satzes durch Lochner, Gesteinsmenge Apollo 11, Entscheider des Mauerbaus, „Heitere Spiele“ als offizielles Motto, Rednerreihenfolge beim Marsch auf Washington, erste Durchfahrt der „Cristóbal“.
* Widersprüchliche Quellenangaben sind als Spanne bzw. Hinweis im Text: Zuschauerzahl bei Kennedys Rede (450.000 bis zwei Millionen), Teilnehmerzahl Olympia (nur „121 Länder“).
* Sensible Themen (Olympia-Attentat, Hintergrund Kalter Krieg/Mauerbau, Rassismus bei King): sachlich formuliert, vor Veröffentlichung redaktionell gegenlesen (ggf. Sensitivitätsprüfung).
* Beschreibungen vor dem Tipp sind **maschinell auf Zeitangaben geprüft** (Tests), aber nicht von einem Menschen auf „rechnerische Hinweise“ im weiteren Sinn (z. B. Kontext wie „Kalter Krieg“, Technikstand) gegengelesen. Schwierigkeitsstufen sind Schätzungen und müssen mit Testspielern geprüft werden.
* Einzelne Beschreibungen beruhen auf Commons-Metadaten statt auf dem Bild (Motivangaben). Nach dem Bildimport Beschreibung und Alternativtext mit dem echten Bild abgleichen.

## C. Technik und Betrieb (unverändert aus der README)

Gegen echtes PostgreSQL/Supabase und echten Storage testen, Web-Vitals messen, Barrierefreiheit manuell prüfen, Rechtstexte (Impressum, Datenschutz) von einer fachkundigen Stelle prüfen lassen, verteiltes Rate-Limit für Serverless.
