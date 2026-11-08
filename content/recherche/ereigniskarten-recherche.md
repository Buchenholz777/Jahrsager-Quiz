# Ereigniskarten und Bilddatensätze – Rechercheübersicht

> Automatisch erzeugt mit `npm run research:report` aus `content/ereigniskarten.ts`. Nicht von Hand ändern.

## So sind die Status zu lesen

| Status | Bedeutung |
|---|---|
| **Recherchiert (am Original noch ungeprüft)** | Urheber, Lizenz und Datum stammen aus Archiv-/Commons-Metadaten. Die Originalseite des Archivs war bei der Recherche teils nicht lesbar. Kein Mensch hat das Bild angesehen. |
| **Noch zu prüfen (offene Punkte)** | Es gibt offene Widersprüche oder Lücken (z. B. unklarer Urheber, nur Jahr statt Tag, geringe Auflösung). |
| **Redaktionell freigegeben** | Ein Mensch hat Bild, Urheber, Lizenz und Datum am Original geprüft. **Aktuell hat keine Karte diesen Status.** |

Im Spiel ist derzeit für **jede** Karte ein generierter Platzhalter sichtbar. Das Kandidatenbild wird erst über den Redaktionsbereich (Button „Kandidatenbild importieren“) oder `npm run images:import -- --yes` geladen und bleibt danach „noch zu prüfen“.

Die **Faktenquellen** sind getrennt bewertet: „Primärquellen“ = Seiten von Institutionen (NASA, NPS, Smithsonian, Bundesregierung, Land Berlin, Apple Newsroom, King Institute, Stiftung Berliner Mauer, Panama Canal Authority, Olympedia …); „teilweise Hilfsquellen“ = mindestens ein zentraler Fakt stützt sich nur auf Wikipedia.

## Übersicht

| Paket | Pos. | Ereignis | Jahr | Themenfeld | Stufe | Bildstatus | Fakten |
|---|---|---|---|---|---|---|---|
| 1 | 1 | Apollo 11: Die erste Mondlandung | 1969 | wissenschaft | 1 | Recherchiert (am Original noch ungeprüft) | Primärquellen |
| 1 | 2 | Das Wunder von Bern | 1954 | sport | 1 | Recherchiert (am Original noch ungeprüft) | teilweise Hilfsquellen |
| 1 | 3 | Der erste Motorflug der Brüder Wright | 1903 | technik | 2 | Recherchiert (am Original noch ungeprüft) | Primärquellen |
| 1 | 4 | Der Bau der Berliner Mauer | 1961 | politik | 2 | Noch zu prüfen (offene Punkte) | Primärquellen |
| 1 | 5 | Das Hubble-Weltraumteleskop wird ausgesetzt | 1990 | wissenschaft | 3 | Recherchiert (am Original noch ungeprüft) | Primärquellen |
| 2 | 1 | Die Vorstellung des ersten iPhone | 2007 | technik | 1 | Noch zu prüfen (offene Punkte) | Primärquellen |
| 2 | 2 | Live Aid | 1985 | kultur | 1 | Noch zu prüfen (offene Punkte) | teilweise Hilfsquellen |
| 2 | 3 | John F. Kennedys Rede in Berlin | 1963 | politik | 2 | Recherchiert (am Original noch ungeprüft) | Primärquellen |
| 2 | 4 | Ford führt das Fließband ein | 1913 | wirtschaft | 2 | Noch zu prüfen (offene Punkte) | teilweise Hilfsquellen |
| 2 | 5 | Die Sonnenfinsternis-Expedition zur Prüfung der Relativitätstheorie | 1919 | wissenschaft | 3 | Noch zu prüfen (offene Punkte) | teilweise Hilfsquellen |
| 3 | 1 | Tag der Deutschen Einheit: Die Wiedervereinigung | 1990 | politik | 1 | Noch zu prüfen (offene Punkte) | Primärquellen |
| 3 | 2 | Der erste Flug des Space Shuttle | 1981 | technik | 1 | Recherchiert (am Original noch ungeprüft) | Primärquellen |
| 3 | 3 | Eröffnung der Olympischen Spiele in München | 1972 | sport | 2 | Recherchiert (am Original noch ungeprüft) | teilweise Hilfsquellen |
| 3 | 4 | Der Marsch auf Washington und Martin Luther Kings Rede | 1963 | gesellschaft | 2 | Noch zu prüfen (offene Punkte) | teilweise Hilfsquellen |
| 3 | 5 | Die Eröffnung des Panamakanals | 1914 | technik | 3 | Recherchiert (am Original noch ungeprüft) | Primärquellen |

## Paket 1

### Apollo 11: Die erste Mondlandung (1969)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Recherchiert (am Original noch ungeprüft) |
| Quellenlink (Commons) | [AS11-40-5903 - Buzz Aldrin by Neil Armstrong (full frame).jpg](https://commons.wikimedia.org/wiki/File:AS11-40-5903_-_Buzz_Aldrin_by_Neil_Armstrong_(full_frame).jpg) |
| Originalquelle | [https://images.nasa.gov/details/as11-40-5903](https://images.nasa.gov/details/as11-40-5903) – bei der Recherche NICHT lesbar |
| Urheber | Neil Armstrong (NASA) |
| Lizenz | [Public Domain (NASA)](https://www.nasa.gov/nasa-brand-center/images-and-media/) |
| Aufnahmedatum | 1969-07 (NASA: 20. Juli 1969) |
| Ereignisjahr | 1969 (1969-07-20) |
| Bildnachweis (vor dem Tipp) | Foto: Neil Armstrong / NASA |
| Bildnachweis (vollständig) | NASA / Neil Armstrong, Apollo 11, Bild AS11-40-5903 (Vollbild, Originalbelichtung) |
| Maße | 4400 × 4600 px |

**Faktenquellen**

- [NASA: Apollo 11 Mission Overview](https://www.nasa.gov/missions/apollo/apollo-11/apollo-11-mission-overview/)
- [NASA: One Giant Leap for Mankind (20. Juli 1969)](https://www.nasa.gov/history/july-20-1969-one-giant-leap-for-mankind/)
- [NASA Science: Apollo 11 – Buzz Aldrin (Foto von Neil Armstrong)](https://science.nasa.gov/resource/apollo-11-buzz-aldrin/)

**Offene Prüfpunkte**

- NASA-Bilddatensatz (images.nasa.gov/details/as11-40-5903) war bei der Recherche nicht lesbar; die Seite science.nasa.gov zeigt das Schwesterbild AS11-40-5902.
- Abgebildete Person (Aldrin): NASA weist bei kommerzieller Nutzung auf Persönlichkeitsrechte und das Verbot hin, eine NASA-Unterstützung zu suggerieren.
- Metadaten nennen nur „1969-07“; NASA-Seite nennt 20. Juli 1969.
- Risiko: Nicht die bekannte beschnittene Version, sondern Vollbild.
- Risiko: Persönlichkeitsrechte/Endorsement-Hinweis der NASA.

### Das Wunder von Bern (1954)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Recherchiert (am Original noch ungeprüft) |
| Quellenlink (Commons) | [Fussball-Weltmeisterschaft 1954 (Com M03-0108-005-0025).jpg](https://commons.wikimedia.org/wiki/File:Fussball-Weltmeisterschaft_1954_(Com_M03-0108-005-0025).jpg) |
| Originalquelle | [https://ba.e-pics.ethz.ch/](https://ba.e-pics.ethz.ch/) – bei der Recherche NICHT lesbar |
| Urheber | Comet Photo AG (Zürich), ETH-Bibliothek Bildarchiv |
| Lizenz | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| Aufnahmedatum | 1954-07-04 |
| Ereignisjahr | 1954 (1954-07-04) |
| Bildnachweis (vor dem Tipp) | Foto: Comet Photo AG / ETH-Bibliothek |
| Bildnachweis (vollständig) | ETH-Bibliothek Zürich, Bildarchiv / Fotograf: Comet Photo AG (Zürich) / Com_M03-0108-005-0025 / CC BY-SA 4.0 |
| Maße | 4961 × 4040 px |

**Faktenquellen**

- [Wikipedia (Hilfsquelle): Wunder von Bern – Primärquelle (DFB/FIFA/bpb) noch zu ergänzen](https://de.wikipedia.org/wiki/Wunder_von_Bern)

**Offene Prüfpunkte**

- Faktenquelle ist nur Wikipedia; DFB-, FIFA- und bpb-Seiten waren bei der Recherche nicht lesbar bzw. enthielten nichts. Primärquelle ergänzen.
- ETH-Originaldatensatz (e-pics) war nicht erreichbar; Nutzungsbedingungen am Original prüfen.
- Das Kandidatenfoto zeigt einen Moment der Partie (ungarischer Torjubel in der ersten Halbzeit), nicht das Siegtor. Alternativen aus derselben Serie: Com_M03-0108-005-0010, -0001 (Letztere mit „License review needed“).
- CC BY-SA 4.0: Share-Alike-Folgen für bearbeitete (zugeschnittene/skalierte) Fassungen rechtlich klären.
- Risiko: Originalarchiv nicht lesbar.
- Risiko: Share-Alike.
- Risiko: Bildinhalt nicht gesehen – Beschreibung aus Commons-Metadaten.

### Der erste Motorflug der Brüder Wright (1903)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Recherchiert (am Original noch ungeprüft) |
| Quellenlink (Commons) | [First flight2.jpg](https://commons.wikimedia.org/wiki/File:First_flight2.jpg) |
| Originalquelle | [https://www.loc.gov/pictures/resource/ppprs.00626/](https://www.loc.gov/pictures/resource/ppprs.00626/) – bei der Recherche NICHT lesbar |
| Urheber | John T. Daniels |
| Lizenz | [Public Domain](https://creativecommons.org/publicdomain/mark/1.0/) |
| Aufnahmedatum | 1903-12-17 |
| Ereignisjahr | 1903 (1903-12-17) |
| Bildnachweis (vor dem Tipp) | Foto: John T. Daniels / Library of Congress |
| Bildnachweis (vollständig) | John T. Daniels, Library of Congress, Prints and Photographs Division (Digital ID ppprs.00626) |
| Maße | 6603 × 4280 px |

**Faktenquellen**

- [National Park Service: The First Flight](https://www.nps.gov/articles/firstflight.htm)
- [Smithsonian National Air and Space Museum: 1903 Wright Flyer](https://airandspace.si.edu/collection-objects/1903-wright-flyer/nasm_A19610048000)
- [National Park Service: Wright Brothers National Memorial](https://www.nps.gov/wrbr/index.htm)

**Offene Prüfpunkte**

- Library-of-Congress-Seite (ppprs.00626) war bei der Recherche nicht lesbar (HTTP 403): Rechtehinweis und Reproduktionsnummer dort prüfen.
- Fotograf laut Commons/NPS: John T. Daniels; LoC-Datensatz gegenprüfen.
- Risiko: LoC-Originalseite nicht lesbar.
- Risiko: Datei ist sehr groß (ca. 29 MB); Import skaliert herunter.

### Der Bau der Berliner Mauer (1961)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Noch zu prüfen (offene Punkte) |
| Quellenlink (Commons) | [Bundesarchiv Bild 173-1288, Berlin, Mauerbau.jpg](https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_173-1288,_Berlin,_Mauerbau.jpg) |
| Originalquelle | [https://bild.bundesarchiv.de/](https://bild.bundesarchiv.de/) – bei der Recherche NICHT lesbar |
| Urheber | Helmut J. Wolf (Bundesarchiv) |
| Lizenz | [CC BY-SA 3.0 DE](https://creativecommons.org/licenses/by-sa/3.0/de/) |
| Aufnahmedatum | 1961-08 (Tag nicht belegt) – Tag unbekannt |
| Ereignisjahr | 1961 (1961-08-13) |
| Bildnachweis (vor dem Tipp) | Foto: Helmut J. Wolf / Bundesarchiv |
| Bildnachweis (vollständig) | Bundesarchiv, Bild 173-1288 / Helmut J. Wolf / CC-BY-SA 3.0 |
| Maße | 800 × 514 px |

**Faktenquellen**

- [Stiftung Berliner Mauer: Die Berliner Mauer](https://www.stiftung-berliner-mauer.de/de/themen/die-berliner-mauer)

**Offene Prüfpunkte**

- Aufnahmedatum nur „August 1961“, nicht der Tag; Bundesarchiv-Originalbildunterschrift prüfen. Motiv laut Commons-Kategorien: Straßenbahn am Leipziger Platz mit Stacheldraht – Bild ansehen.
- Auflösung des Kandidaten nur 800 px Breite.
- Zwei andere Bundesarchiv-Fotos (183-87665-0002 vom 30.10.1961, 183-88222-0001 vom 20.11.1961) wegen abweichender Daten verworfen.
- Wer die Abriegelung beschloss, wird in der Quelle nicht genannt – daher im Text nur „die SED“.
- Bundesarchiv-Bildunterschriften können politisch gefärbt sein.
- Risiko: Tag nicht belegt.
- Risiko: Niedrige Auflösung.
- Risiko: Share-Alike.

### Das Hubble-Weltraumteleskop wird ausgesetzt (1990)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Recherchiert (am Original noch ungeprüft) |
| Quellenlink (Commons) | [Hubble Space Telescope Deployment from Shuttle Discovery (27512135784).jpg](https://commons.wikimedia.org/wiki/File:Hubble_Space_Telescope_Deployment_from_Shuttle_Discovery_(27512135784).jpg) |
| Originalquelle | [https://images.nasa.gov/details-S31-03-014](https://images.nasa.gov/details-S31-03-014) – bei der Recherche NICHT lesbar |
| Urheber | NASA |
| Lizenz | [Public Domain (NASA)](https://www.nasa.gov/nasa-brand-center/images-and-media/) |
| Aufnahmedatum | 1990-04-25 |
| Ereignisjahr | 1990 (1990-04-25) |
| Bildnachweis (vor dem Tipp) | Foto: NASA |
| Bildnachweis (vollständig) | NASA, Space Shuttle Discovery (STS-31), Bild S31-03-014, aufgenommen mit einer 35-mm-Kamera durch ein Fenster des Flugdecks |
| Maße | 4095 × 2708 px |

**Faktenquellen**

- [NASA: STS-31](https://www.nasa.gov/mission/sts-31/)
- [NASA Science: Hubble Space Telescope](https://science.nasa.gov/mission/hubble/)

**Offene Prüfpunkte**

- NASA-Bilddatensatz (S31-03-014) war nicht lesbar; Flickr-Original nicht geöffnet.
- Spiegelfehler und Reparaturmission 1993 sind in den gelesenen Quellen nicht wörtlich belegt und stehen deshalb nicht im Text.
- Das Foto zeigt das Aussetzen (noch am Roboterarm), nicht den Start.
- Risiko: Originalarchiv nicht lesbar.
- Risiko: Über Flickr-Konto der NASA hochgeladen.

## Paket 2

### Die Vorstellung des ersten iPhone (2007)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Noch zu prüfen (offene Punkte) |
| Quellenlink (Commons) | [Steve Jobs presents iPhone.jpg](https://commons.wikimedia.org/wiki/File:Steve_Jobs_presents_iPhone.jpg) |
| Originalquelle | [https://www.flickr.com/photos/35448539@N00/2411534862](https://www.flickr.com/photos/35448539@N00/2411534862) – bei der Recherche gelesen |
| Urheber | Blake Patterson (Flickr-Konto) (Flickr-Text nennt @arnoldkim als Fotografen) |
| Lizenz | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| Aufnahmedatum | 2007-01-09 |
| Ereignisjahr | 2007 (2007-01-09) |
| Bildnachweis (vor dem Tipp) | Foto: Blake Patterson (Flickr) |
| Bildnachweis (vollständig) | Foto: Blake Patterson (Flickr, „the very instant of announcement“), CC BY 2.0 |
| Maße | 1936 × 1296 px |

**Faktenquellen**

- [Apple Newsroom: Apple Reinvents the Phone with iPhone](https://www.apple.com/newsroom/2007/01/09Apple-Reinvents-the-Phone-with-iPhone/)

**Offene Prüfpunkte**

- Das Bild zeigt eine Präsentationsfolie mit dem Produktnamen und einem Apple-Slogan (Marken im Bild).
- Urheber unklar: Commons nennt Blake Patterson (Flickr-Konto), die Flickr-Beschreibung nennt „@arnoldkim“ als Fotografen. Vor Nutzung klären, wer die Rechte hält.
- Flickr-Lizenzprüfung auf Commons stammt von 2009; die Flickr-Seite zeigt weiterhin CC BY 2.0.
- Personenabbildung (Persönlichkeitsrechte); Apple-Marken im Bild.
- Risiko: Urheberfrage offen.
- Risiko: Personenabbildung.

### Live Aid (1985)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Noch zu prüfen (offene Punkte) |
| Quellenlink (Commons) | [Live Aid at JFK Stadium, Philadelphia, PA.jpg](https://commons.wikimedia.org/wiki/File:Live_Aid_at_JFK_Stadium,_Philadelphia,_PA.jpg) |
| Originalquelle | [https://commons.wikimedia.org/wiki/File:Live_Aid_at_JFK_Stadium,_Philadelphia,_PA.jpg](https://commons.wikimedia.org/wiki/File:Live_Aid_at_JFK_Stadium,_Philadelphia,_PA.jpg) – bei der Recherche gelesen |
| Urheber | Squelle (Commons-Benutzer, „Own work“) |
| Lizenz | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Aufnahmedatum | 1985-07-13 |
| Ereignisjahr | 1985 (1985-07-13) |
| Bildnachweis (vor dem Tipp) | Foto: Squelle (Wikimedia Commons) |
| Bildnachweis (vollständig) | Foto: Squelle (Wikimedia Commons), CC BY-SA 3.0 |
| Maße | 1263 × 1015 px |

**Faktenquellen**

- [Wikipedia (Hilfsquelle): Live Aid – Primärquelle noch zu ergänzen](https://en.wikipedia.org/wiki/Live_Aid)

**Offene Prüfpunkte**

- Faktenquelle nur Wikipedia (Britannica, Rock Hall, liveaid.org nicht lesbar). Die 1,9-Milliarden-Zahl stützt sich dort auf CNN – Primärquelle prüfen. Spendensumme nicht belegt, deshalb nicht genannt.
- Commons-Kategorien enthalten noch GFDL-/Lizenzmigrationshinweise; Wikitext-Lizenzstand prüfen.
- Personenabbildung (Bühnenauftritt bekannter Musiker); die Musiker sind auf dem Foto nur klein zu erkennen – die Namen stammen aus der Commons-Beschreibung, nicht aus dem Bild.
- Im Bild sind eine Kodak-Werbetafel und der Schriftzug „Live Aid“ zu sehen (Marken).
- Risiko: Selbstveröffentlichtes Foto eines Commons-Nutzers; kein Archiv.
- Risiko: Lizenzmigration/GFDL prüfen.
- Risiko: Personenabbildung.

### John F. Kennedys Rede in Berlin (1963)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Recherchiert (am Original noch ungeprüft) |
| Quellenlink (Commons) | [JFK speech Ich bin ein berliner 1.jpg](https://commons.wikimedia.org/wiki/File:JFK_speech_Ich_bin_ein_berliner_1.jpg) |
| Originalquelle | [https://www.jfklibrary.org/asset-viewer/archives/JFKWHP/1963/Month%2006/Day%2026/JFKWHP-1963-06-26-D?image_identifier=JFKWHP-KN-C29248](https://www.jfklibrary.org/asset-viewer/archives/JFKWHP/1963/Month%2006/Day%2026/JFKWHP-1963-06-26-D?image_identifier=JFKWHP-KN-C29248) – bei der Recherche NICHT lesbar |
| Urheber | Robert Knudsen, White House (Schwesterdatei nennt Cecil Stoughton) |
| Lizenz | [Public Domain (US-Regierungswerk)](https://creativecommons.org/publicdomain/mark/1.0/) |
| Aufnahmedatum | 1963-06-26 |
| Ereignisjahr | 1963 (1963-06-26) |
| Bildnachweis (vor dem Tipp) | Foto: Robert Knudsen / White House, John F. Kennedy Presidential Library |
| Bildnachweis (vollständig) | Robert Knudsen, White House Photographs, John F. Kennedy Presidential Library and Museum, Boston (KN-C29248) |
| Maße | 3000 × 2964 px |

**Faktenquellen**

- [Land Berlin: John F. Kennedy in Berlin](https://www.berlin.de/geschichte/john-f-kennedy-in-berlin/)
- [Land Berlin: Besuchsprogramm von John F. Kennedy](https://www.berlin.de/geschichte/john-f-kennedy-in-berlin/8482364-8481929-besuchsprogramm-von-john-f-kennedy-in-be.html)
- [Land Berlin: Rede vor dem Rathaus Schöneberg](https://www.berlin.de/geschichte/john-f-kennedy-in-berlin/8481884-8481929-rede-john-f-kennedy-rathaus-schoeneberg.html)

**Offene Prüfpunkte**

- JFK-Library-Katalog war nicht lesbar (HTTP 403). Fotograf prüfen: Commons nennt Robert Knudsen, eine Schwesterdatei mit derselben Kennung KN-C29248 nennt Cecil Stoughton.
- Ortsangabe der Datei: Rudolph-Wilde-Platz (vor dem Rathaus Schöneberg).
- Zuschauerzahl in den Quellen widersprüchlich; nur als Spanne genannt.
- Risiko: JFK-Library-Seite nicht lesbar.
- Risiko: Widersprüchliche Fotografenangabe.
- Risiko: Datei ist ca. 8,5 MB groß.

### Ford führt das Fließband ein (1913)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Noch zu prüfen (offene Punkte) |
| Quellenlink (Commons) | [Assembly line at the Ford Motor Company's Highland Park plant LCCN2011661021.jpg](https://commons.wikimedia.org/wiki/File:Assembly_line_at_the_Ford_Motor_Company's_Highland_Park_plant_LCCN2011661021.jpg) |
| Originalquelle | [https://www.loc.gov/pictures/item/2011661021/](https://www.loc.gov/pictures/item/2011661021/) – bei der Recherche NICHT lesbar |
| Urheber | Unbekannt (Library of Congress) |
| Lizenz | [Public Domain](https://creativecommons.org/publicdomain/mark/1.0/) |
| Aufnahmedatum | 1913 (nur Jahr) – nur Jahr belegt |
| Ereignisjahr | 1913 (1913-10-07) |
| Bildnachweis (vor dem Tipp) | Foto: Library of Congress (Urheber nicht genannt) |
| Bildnachweis (vollständig) | Library of Congress, Prints and Photographs Division (LCCN 2011661021, Digital ID cph.3a20510); Urheber nicht genannt |
| Maße | 1536 × 1236 px |

**Faktenquellen**

- [Wikipedia (Hilfsquelle): Highland Park Ford Plant – Primärquelle (Henry Ford Museum/NPS) noch zu ergänzen](https://en.wikipedia.org/wiki/Highland_Park_Ford_Plant)
- [Wikipedia (Hilfsquelle): Fließbandfertigung](https://de.wikipedia.org/wiki/Flie%C3%9Fbandfertigung)

**Offene Prüfpunkte**

- Fakten nur aus Wikipedia (thehenryford.org und Britannica nicht lesbar). Insbesondere 728→93 Minuten, Preise und Lohn mit Primärquelle belegen.
- Foto nur auf das Jahr 1913 datiert; Bildinhalt zeigt laut Metadaten nicht eindeutig das Model-T-Chassisband. LoC-Seite (HTTP 403) nicht lesbar.
- Urheber nicht genannt (Abteilung statt Fotograf).
- Risiko: Datum nur Jahr.
- Risiko: Motiv nicht eindeutig.
- Risiko: LoC-Seite nicht lesbar.

### Die Sonnenfinsternis-Expedition zur Prüfung der Relativitätstheorie (1919)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Noch zu prüfen (offene Punkte) |
| Quellenlink (Commons) | [Highest resolution image of the 1919 solar eclipse (potw1926a).jpg](https://commons.wikimedia.org/wiki/File:Highest_resolution_image_of_the_1919_solar_eclipse_(potw1926a).jpg) |
| Originalquelle | [https://www.eso.org/public/images/potw1926a](https://www.eso.org/public/images/potw1926a) – bei der Recherche gelesen |
| Urheber | ESO/Landessternwarte Heidelberg-Königstuhl (Kopie einer Sobral-Platte) |
| Lizenz | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Aufnahmedatum | 1919-05-29 (Ereignisdatum; Commons nennt nur das Upload-Datum) |
| Ereignisjahr | 1919 (1919-05-29) |
| Bildnachweis (vor dem Tipp) | Aufnahme: ESO / Landessternwarte Heidelberg-Königstuhl |
| Bildnachweis (vollständig) | ESO/Landessternwarte Heidelberg-Königstuhl/F. W. Dyson, A. S. Eddington & C. Davidson – digital restaurierte Kopie einer Fotoplatte der Sobral-Expedition, CC BY 4.0 |
| Maße | 23800 × 14191 px |

**Faktenquellen**

- [ESO: Highest resolution image of the 1919 solar eclipse (potw1926a)](https://eso.org/public/images/potw1926a/)
- [Wikipedia (Hilfsquelle): Solar eclipse of May 29, 1919](https://en.wikipedia.org/wiki/Solar_eclipse_of_May_29,_1919)

**Offene Prüfpunkte**

- Das ESO-Bild ist eine restaurierte Kopie der Sobral-Platte (nicht von Eddington auf Príncipe); der ESO-Credit nennt dennoch Dyson, Eddington und Davidson – Zuschreibung klären, Bearbeitung (Restaurierung) kennzeichnen.
- Datum der Ergebnisverkündung (Royal Society) nicht belegt und nicht im Text.
- Primärquelle der Expeditionsberichte (Royal Society) war nicht lesbar (HTTP 403).
- Sehr große Datei (23.800 × 14.191 px); Import skaliert herunter.
- Risiko: Restauriert (Rauschreduktion).
- Risiko: Zuschreibung irreführend.
- Risiko: Kopie, keine Originalplatte.

## Paket 3

### Tag der Deutschen Einheit: Die Wiedervereinigung (1990)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Noch zu prüfen (offene Punkte) |
| Quellenlink (Commons) | [Bundesarchiv Bild 183-1990-1003-400, Berlin, deutsche Vereinigung, vor dem Reichstag.jpg](https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_183-1990-1003-400,_Berlin,_deutsche_Vereinigung,_vor_dem_Reichstag.jpg) |
| Originalquelle | [https://bild.bundesarchiv.de/](https://bild.bundesarchiv.de/) – bei der Recherche NICHT lesbar |
| Urheber | Peer Grimm (ADN-ZB, Bundesarchiv) |
| Lizenz | [CC BY-SA 3.0 DE](https://creativecommons.org/licenses/by-sa/3.0/de/) |
| Aufnahmedatum | 1990-10-03 |
| Ereignisjahr | 1990 (1990-10-03) |
| Bildnachweis (vor dem Tipp) | Foto: Peer Grimm / Bundesarchiv |
| Bildnachweis (vollständig) | Bundesarchiv, Bild 183-1990-1003-400 / Grimm, Peer / CC-BY-SA 3.0 |
| Maße | 736 × 487 px |

**Faktenquellen**

- [Bundesregierung: Die Einheit ist Wirklichkeit](https://www.bundesregierung.de/breg-de/schwerpunkte/deutsche-einheit/die-einheit-ist-wirklichkeit-432814)
- [Wikipedia (Hilfsquelle): Tag der Deutschen Einheit](https://de.wikipedia.org/wiki/Tag_der_Deutschen_Einheit)

**Offene Prüfpunkte**

- Kandidatenbild hat nur 736 px Breite – für große Darstellung zu klein; höher aufgelöste Bundesarchiv-Fassung suchen.
- Bundesarchiv-Bildunterschriften (ADN) können tendenziös sein; Wortlaut „Bundesfahne“ vs. „Fahne der Einheit“ im Text neutral gehalten.
- Personen im Bild nicht geprüft. Share-Alike (CC BY-SA 3.0 DE).
- Risiko: Niedrige Auflösung.
- Risiko: Share-Alike.
- Risiko: Bundesarchiv-Originalseite nicht geöffnet.

### Der erste Flug des Space Shuttle (1981)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Recherchiert (am Original noch ungeprüft) |
| Quellenlink (Commons) | [Space Shuttle Columbia launching.jpg](https://commons.wikimedia.org/wiki/File:Space_Shuttle_Columbia_launching.jpg) |
| Originalquelle | [https://images.nasa.gov/details/81pc0382](https://images.nasa.gov/details/81pc0382) – bei der Recherche NICHT lesbar |
| Urheber | NASA |
| Lizenz | [Public Domain (NASA)](https://www.nasa.gov/nasa-brand-center/images-and-media/) |
| Aufnahmedatum | 1981-04-12 |
| Ereignisjahr | 1981 (1981-04-12) |
| Bildnachweis (vor dem Tipp) | Foto: NASA |
| Bildnachweis (vollständig) | NASA, Start von STS-1 von Pad 39A (Bild 81pc0382, GRIN GPN-2000-000650) |
| Maße | 6084 × 6084 px |

**Faktenquellen**

- [NASA: STS-1](https://www.nasa.gov/mission/sts-1/)

**Offene Prüfpunkte**

- NASA-Bilddatensatz (81pc0382) war nicht lesbar; Hinweise zu NASA-Logos/Rechten Dritter am Original prüfen.
- NASA nennt die Startzeit mit „EST“; im Text steht nur „kurz nach 7 Uhr Ortszeit“.
- Risiko: NASA-Originalseite nicht lesbar.
- Risiko: Datei ca. 5 MB, quadratisch.

### Eröffnung der Olympischen Spiele in München (1972)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Recherchiert (am Original noch ungeprüft) |
| Quellenlink (Commons) | [Olimpiai Stadion, az olimpia megnyitóünnepsége. Fortepan 73755.jpg](https://commons.wikimedia.org/wiki/File:Olimpiai_Stadion,_az_olimpia_megnyit%C3%B3%C3%BCnneps%C3%A9ge._Fortepan_73755.jpg) |
| Originalquelle | [https://fortepan.hu/en/photos/?id=73755](https://fortepan.hu/en/photos/?id=73755) – bei der Recherche NICHT lesbar |
| Urheber | Fotograf nicht benannt; Spenderin Romák Éva (Fortepan) |
| Lizenz | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Aufnahmedatum | 1972-08-26 |
| Ereignisjahr | 1972 (1972-08-26) |
| Bildnachweis (vor dem Tipp) | Foto: FORTEPAN / Romák Éva |
| Bildnachweis (vollständig) | FOTO:FORTEPAN / Romák Éva (Fortepan ID 73755), CC BY-SA 3.0 |
| Maße | 3892 × 2652 px |

**Faktenquellen**

- [Olympedia: Olympische Sommerspiele München](https://www.olympedia.org/editions/18)
- [Olympiapark München: Rückblick auf die Spiele](https://www.olympiapark.de/de/der-olympiapark/50-jahre/rueckblick-auf-ein-sensationelles-jubilaeum)
- [Wikipedia (Hilfsquelle): Münchner Olympia-Attentat](https://de.wikipedia.org/wiki/M%C3%BCnchner_Olympia-Attentat)

**Offene Prüfpunkte**

- Teilnehmerzahl: Olympedia 7.114 Teilnehmende aus 121 Ländern, Wikipedia 7.170 Athleten – im Text nur „121 Länder“.
- Die Zahl „elf“ ermordeter Israelis stammt aus Wikipedia (Hilfsquelle); IOC/Olympedia-Wortlaut abweichend – sachlich prüfen und sensibel formulieren.
- „Heitere Spiele“ nicht als offizielles Motto belegt; nur sinngemäß verwendet.
- Fortepan-Originalseite zeigte keine Metadaten (Skript-Nachladung); Lizenz, Donor und Datum dort bestätigen. Schreibweise des Spenders: „Romák Éva“ (Attribution-Feld) vs. „Románk Éva“.
- Risiko: Fotograf unbekannt.
- Risiko: Fortepan-Seite nicht verifizierbar.
- Risiko: Share-Alike.

### Der Marsch auf Washington und Martin Luther Kings Rede (1963)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Noch zu prüfen (offene Punkte) |
| Quellenlink (Commons) | [Martin Luther King - March on Washington.jpg](https://commons.wikimedia.org/wiki/File:Martin_Luther_King_-_March_on_Washington.jpg) |
| Originalquelle | [https://catalog.archives.gov/id/542069](https://catalog.archives.gov/id/542069) – bei der Recherche NICHT lesbar |
| Urheber | U.S. Information Agency (häufig Rowland Scherman zugeschrieben) |
| Lizenz | [Public Domain (US-Regierungswerk)](https://creativecommons.org/publicdomain/mark/1.0/) |
| Aufnahmedatum | 1963-08-28 |
| Ereignisjahr | 1963 (1963-08-28) |
| Bildnachweis (vor dem Tipp) | Foto: U.S. Information Agency / National Archives |
| Bildnachweis (vollständig) | U.S. Information Agency, Press and Publications Service / National Archives (NAID 542069); häufig Rowland Scherman zugeschrieben |
| Maße | 1296 × 1403 px |

**Faktenquellen**

- [King Institute (Stanford): I Have a Dream](https://kinginstitute.stanford.edu/encyclopedia/i-have-dream)
- [Wikipedia (Hilfsquelle): March on Washington for Jobs and Freedom (Teilnehmerzahl)](https://en.wikipedia.org/wiki/March_on_Washington_for_Jobs_and_Freedom)

**Offene Prüfpunkte**

- NARA-Katalogeintrag (NAID 542069) war nicht lesbar. Urheber: Commons nennt Rowland Scherman, der NARA-Datensatz „U.S. Information Agency“ – Credit entsprechend neutral formuliert.
- Das King Institute weist darauf hin, keine Rechte an Bildern/Texten von M. L. King vergeben zu können (Nachlass-Lizenzgeber IPM). Rechtsfrage für kommerzielle Nutzung klären (Foto selbst gilt als gemeinfreies US-Regierungswerk).
- Die Reihenfolge der Redner ist in Quellen widersprüchlich und steht deshalb nicht im Text.
- Teilnehmerzahl nur aus Wikipedia (Hilfsquelle).
- Commons-Fassung wurde zugeschnitten/gedreht; NARA-Original ist ein TIFF.
- Risiko: Nachlass-Hinweis des King Institute.
- Risiko: Urheberangabe abweichend.
- Risiko: Bearbeitete Commons-Fassung.

### Die Eröffnung des Panamakanals (1914)

**Bilddatensatz**

| Feld | Wert |
|---|---|
| Bildstatus | Recherchiert (am Original noch ungeprüft) |
| Quellenlink (Commons) | [SS Ancon (1902 ship) NARA 185-G-0891.jpg](https://commons.wikimedia.org/wiki/File:SS_Ancon_(1902_ship)_NARA_185-G-0891.jpg) |
| Originalquelle | [https://catalog.archives.gov/id/100996362](https://catalog.archives.gov/id/100996362) – bei der Recherche NICHT lesbar |
| Urheber | Panama Railroad Company (laut Commons) |
| Lizenz | [Public Domain (US-Regierungsbestand)](https://creativecommons.org/publicdomain/mark/1.0/) |
| Aufnahmedatum | 1914-08-15 (Bildunterschrift) |
| Ereignisjahr | 1914 (1914-08-15) |
| Bildnachweis (vor dem Tipp) | Foto: Panama Railroad Company / National Archives |
| Bildnachweis (vollständig) | Panama Railroad Company / National Archives and Records Administration (NARA 185-G-0891, NAID 100996362) |
| Maße | 1496 × 1244 px |

**Faktenquellen**

- [Panama Canal Authority: Culminación de la construcción](https://pancanal.com/culminacion-de-la-construccion/)
- [Panama Canal Authority: Conoce la historia del Canal de Panamá](https://pancanal.com/conoce-la-historia-del-canal-de-panama/)

**Offene Prüfpunkte**

- Ob die „Cristóbal“ schon am 3. August 1914 als erstes Schiff den Kanal querte, ist in den gelesenen Quellen nicht belegt – deshalb nur „erste offizielle Durchfahrt“.
- NARA-Katalog (NAID 100996362) war nicht lesbar; Urheber laut Commons „Panama Railroad Company“, Bildunterschrift: Annäherung der Ancon bei Balboa, 15. August 1914.
- Das Bild zeigt die Annäherung, nicht die Schleusung.
- Auf dem Archivfoto steht unten eine Beschriftung mit Ereignis und Datum – sie würde die Lösung verraten und wird deshalb beim Import abgeschnitten (cropBottomPct). Nach dem Zuschnitt am Bild prüfen, ob kein Text mehr sichtbar ist.
- Risiko: NARA-Seite nicht lesbar.
- Risiko: Urheberangabe nur laut Commons.

