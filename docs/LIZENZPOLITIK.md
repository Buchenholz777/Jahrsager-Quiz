# Lizenzpolitik und automatische Bildfreigabe (Stand 10. November 2026)

**Grundsatz:** Eine erlaubte Lizenzkategorie bedeutet nicht, dass jedes so gekennzeichnete Foto ungeprüft veröffentlicht wird. Eine automatische Freigabe verlangt, dass **alle** Regeln der jeweiligen Klasse erfüllt sind. Eine KI-Einschätzung kann nur herabstufen (Veto), nie fehlende Nachweise ersetzen.

## Drei Statuskategorien
| Status | Bedeutung | Folge |
|---|---|---|
| **Freigabefähig nach geprüften Automatikregeln** | alle Regeln einer *geschalteten* Klasse erfüllt | wird freigegeben (Status „freigegeben“) |
| **Zusätzliche Rechteprüfung erforderlich** | Regeln erfüllt, Klasse aber nicht geschaltet, oder etwas fehlt/ist unklar | landet im Freigabe-Assistenten (Entwurf), Sie entscheiden |
| **Abgelehnt** | harte Ausschlussgründe (z. B. NC/ND, keine Lizenz, falsches Jahr, Foto zeigt das Ereignis nicht) | wird nicht angelegt |

Jedes Ereignis kann weiterhin nachträglich gesperrt werden (Admin → Ereignis sperren).

## Lizenzklassen
| Klasse | Stand |
|---|---|
| CC0, gemeinfreie Werke der US-Bundesregierung (mit Nachweis) | **unbeaufsichtigt freigegeben** (unverändert) |
| **CC BY 4.0** | grundsätzlich zugelassen; Regeln unten umgesetzt und getestet; **unbeaufsichtigte Freigabe AUS** (Schalter `AUTO_APPROVE_CC_BY_4`, Standard `false`) |
| CC BY 2.0 / 3.0, CC BY-SA 3.0 / 4.0 | erkannt und vorbereitet, **nie automatisch**: immer zusätzliche Rechteprüfung. Gründe: Titel-/Versionsanforderungen und ShareAlike bei Bearbeitung sind noch nicht vollständig umgesetzt und getestet |
| CC BY-NC, CC BY-ND, Fair Use, „All rights reserved“, ohne Lizenz | **ausgeschlossen** |
| „Public domain“ ohne Nachweis | **kein** Nachweis der Gemeinfreiheit: zusätzliche Rechteprüfung |

## CC BY 4.0: Regeln für „Automatikregeln erfüllt“
Alles muss gleichzeitig gelten (`ccByProvenance` in `src/server/pipeline/license.ts`):
1. **Urheber** benannt (nicht „unbekannt“, „anonym“, „verschiedene“), **Originalquelle** (Commons-Dateiseite), **Original-Datei-URL**, **Quellenangabe**.
2. **Exakte Lizenz** „CC BY 4.0“ **mit Link** zum Lizenztext (`creativecommons.org/licenses/by/4.0`).
3. Keine zusätzliche Einschränkung laut Commons, keine Agentur-/Bildarchivangabe (Getty, Alamy, dpa, Reuters, AP, Ullstein, Imago, Keystone), **kein Widerspruch** („nicht geschützt“ und zugleich CC BY).
4. **Grundlage der Berechtigung** (eine davon):
   * *Institutionelle Herkunft* aus einer konservativen Liste (u. a. Wellcome Collection, Te Papa, Finnish Heritage Agency, Riksantikvarieämbetet, Nationaal Archief, Rijksmuseum, Smithsonian, Europeana, Deutsche Fotothek), oder
   * *Eigenes Werk* des genannten Urhebers – nur bei Ereignissen **ab 1995**, Aufnahme **am Ereignistag**, Urheber benannt.
5. **Mindestens 2 unabhängige Bestätigungen** zusätzlich zur Grundlage (die Grundlage allein genügt ausdrücklich nicht): Aufnahmedatum = Ereignistag · Quelle verlangt Namensnennung (Attribution angegeben) · Institution in Urheber- *und* Credit-Feld · Urheber mit vollständigem Namen.
6. Außerdem die allgemeinen Regeln: Aufnahmedatum passt zum Ereignis, Bildgröße (lange Seite ≥ 1.200 px), ≥ 2 unabhängige externe Faktenquellen, Textentwurf formal in Ordnung, **keine erkennbaren Personen** (sonst Rechteprüfung), keine lizenzrelevante Bearbeitung.

Solange der Schalter aus ist, erscheinen solche Bilder im Freigabe-Assistenten mit dem Hinweis „Automatikregeln erfüllt“. Sie können sie einzeln oder per Sammel-Freigabe bestätigen.

## Bildnachweis (zentral: `src/lib/bildrechte.ts`)
Gespeichert wird je Bild (Feld `research.bildrechte`): Werktitel, Urheber, Rechteinhaber (falls abweichend), Institution, Originalquelle, Original-Datei-URL, Lizenz **mit Version**, Lizenz-URL, Urheberrechtshinweis, Bearbeitungsvermerke (technisch / lizenzrelevant), Zeitpunkt der Rechteprüfung, Status, Prüfgrundlage, Prüfer (auto/admin), Einschränkungen. Daraus wird die Namensnennung erzeugt (Titel, Urheber, Quelle, Lizenz mit Link) und beim Bild angezeigt (Kurzzeile am Foto, vollständig in der Auflösung). **Fehlen Pflichtangaben** (bei CC BY: Urheber, Version, Lizenzlink; immer: Originalquelle, Datei-URL, Prüfdatum, Grundlage), gibt es keine automatische Freigabe.

## Bearbeitungen
* *Technisch* (Größe, WebP, Metadaten entfernt): ohne Vermerk, Bildinhalt unverändert.
* *Lizenzrelevant* (Zuschnitt, Retusche, Ausschnitt): wird ausgewiesen und verhindert die automatische Freigabe. Bei CC BY-SA wäre zusätzlich ShareAlike zu beachten – deshalb ist BY-SA nicht automatisch.
* Irreführende Ausschnitte, die den historischen Kontext verändern, sind unzulässig; Zuschnitte gibt es nur manuell im Admin.

## Personenrechte
Erkennbare Personen führen nie zur automatischen Freigabe (Recht am eigenen Bild, §§ 22, 23 KUG). Die sachliche historische Verwendung im Quiz ist etwas anderes als werbliche Verwendung (Startseite, Werbematerial): Fotos mit Personen werden nicht ohne gesonderte Prüfung für die Startseite freigegeben. Bei erheblichen Zweifeln: nicht veröffentlichen.

## Audit
Je Ereignis (`events.audit`): Lizenz (mit Grundlage), Datierung, Bildqualität, Quellen, Inhalt, Bildkontrolle, **Bilddatei** (Datei, Dateiseite, Original-URL, Größe), **Bearbeitung**, **Bildnachweis**, **Personenrechte**, **Rechteprüfung** (Status, Grundlage, Zeitpunkt, Nachweis) und Entscheidung. Im Freigabe-Assistenten einsehbar.

## Themenvielfalt der Recherche
Die Recherche zieht abwechselnd aus Sport, Kultur/Musik, Gesellschaft/Politik, weltweit und USA (`scripts/pipeline.ts`). Raumfahrt hat keinen eigenen Suchweg mehr und ist begrenzt: Ab 10 Ereignissen im Vorrat wird ein weiteres Raumfahrtereignis abgelehnt, wenn der Anteil ≥ 8 % wäre (`SPACE_SHARE_CAP`). Die Planung der Tagesrätsel begrenzt Raumfahrt zusätzlich (höchstens 1 je 20 Ereignisse).

## Auswertung und Messung
* `npm run ablehnungen` – Ablehnungs-/Prüfgründe nach den zehn Kategorien (steht im Workflow-Protokoll „Redaktion“).
* `npm run bestand` – spielbarer Vorrat, Dubletten, Verteilung.
* `npx tsx scripts/cc-by-potenzial.ts [n]` – Stichprobe gegen Wikimedia: wie viele Kandidaten hätten ein passendes Foto, und in welcher Stufe (automatisch / CC BY 4.0 Regeln erfüllt / nur theoretisch).

## Empfehlung zur sicheren Aktivierung der CC-BY-4.0-Automatik
1. Mindestens 2 Wochen im Modus „Zusätzliche Rechteprüfung“ laufen lassen und **jedes** CC-BY-Ereignis im Freigabe-Assistenten gegen die Dateiseite prüfen (Urheber, Lizenz, Institution).
2. Stimmen in dieser Zeit ≥ 95 % der „Automatikregeln erfüllt“-Fälle und gibt es keinen Fall mit falscher Berechtigung, die Regeln fachlich freigeben (schriftlich vermerken) und `AUTO_APPROVE_CC_BY_4=true` als GitHub-Variable setzen.
3. Zunächst nur **institutionelle** Herkunft automatisch, „Eigenes Werk“ weiter manuell (höheres Risiko, Berechtigung des Uploaders nicht prüfbar).
4. Danach monatliche Stichprobe (5 Fälle) und sofortige Sperre bei Beanstandung.

## Messergebnis vom 10. November 2026 (Stichprobe gegen Wikimedia, `scripts/cc-by-potenzial.ts`)
| Suchweg | Kandidaten | mit Foto vom Ereignistag (≥ 1.200 px) | automatisch erlaubt | CC BY 4.0, Regeln erfüllt | nur theoretisch (CC BY 2.0/3.0, BY-SA) |
|---|---|---|---|---|---|
| Gesellschaft | 30 | 4 | 1 | 0 | 0 |
| Weltweit | 30 | 7 | 4 | 0 | 0 |
| USA | 3 | 1 | 0 | 0 | 0 |
| Sport (zweiter Lauf) | 25 | 11 | 0 | 0 | 9 |
| Kultur | 2 | 0 | 0 | 0 | 0 |

**Lesart:** In dieser Stichprobe (92 Kandidaten) gab es **kein einziges** CC-BY-4.0-Foto, das die Herkunftsregeln erfüllt. Der größte ungenutzte Hebel liegt woanders: Bei **Sport** haben 44 % der Kandidaten ein Foto vom richtigen Tag, aber unter **CC BY 2.0/3.0 und BY-SA**, also Lizenzen, die jetzt zwar erkannt, aber bewusst nie automatisch freigegeben werden. Außerdem sind „Public domain“-Fotos ohne Regierungsnachweis (7 von 12 Treffern bei Gesellschaft/Weltweit) heute eine Fall für die manuelle Prüfung. Die Stichprobe ist klein; die Zahlen sind Größenordnungen, keine Prognose.
