# Import der 10 Recherche-Entwürfe

Stand: 8. November 2026. Quelle: `content/recherche/jahrsager-10-ereignisse.json` (+ `…-redaktion.md`).

## Was passiert ist (tatsächlich ausgeführt)
* `npm run import:redaktion` hat die 10 Ereignisse in die **Supabase-Produktionsdatenbank** als Status **„Entwurf“** geschrieben. Zweiter Lauf: 0 neu, 10 unverändert (idempotent, Schlüssel = Slug).
* Nichts ist freigegeben, eingeplant oder veröffentlicht. Es gibt **kein Bild** (`image_id` leer), alle Prüfbestätigungen (Rechte, Fakten, Foto-Zuordnung) sind **nicht gesetzt**. Alternativtext bleibt leer, bis er am echten Bild formuliert wird.
* Bildstatus: 6 Fälle **„zu_pruefen“** (Südpol, Lindbergh, Luftbrücke, Humangenom, Owens, ISS-Außeneinsatz), 4 **„recherchiert“**. Kein Fall „freigegeben“.
* Tests: 64 grün (u. a. Idempotenz, keine Zeit-Spoiler vor dem Tipp, Entwürfe nicht freigebbar / nicht planbar / nicht öffentlich, Überschreibschutz).

## Zuordnung
Titel/Teaser → neutrale Überschrift/Beschreibung; Auflösungstexte getrennt (`explanation_*`); Quellen → `sources`; Bild- und Rechtemetadaten, Lizenzbehauptung und Hinweise exakt als Entwurfswerte; Hinweise der Recherche in `research.openPoints`. Von mir ergänzt (stand nicht in der Datei): Themenfeld je Ereignis und **Titel der Auflösung** (`public_title`) – bitte redaktionell prüfen.

## Offene Freigabepunkte (Mensch)
* Südpol: Foto vom 17.12., Ankunft 14.12.; restaurierte Commons-Version, Original prüfen.
* Lindbergh: Aufnahmetag unbekannt (nur Mai 1927); zeigt das Bild die Ankunft?
* Owens: Commons-Datei beschnitten; CC BY-SA 3.0 DE (Namensnennung, ShareAlike, Bearbeitungshinweis).
* Luftbrücke: Foto nur auf August 1948 datiert; kein Einzeltag, mehrjähriges Ereignis.
* Humangenom: Bild noch nicht eindeutig; Nutzung bis zur Originalprüfung gesperrt.
* ISS 2019: Foto zeigt nur Jessica Meir (Text darf nicht behaupten, beide seien zu sehen).
* Marsch auf Washington: genaue Bild-ID 306-SSM-4-D-80-10 im NARA-Katalog bestätigen.
* Alle: Selbst „gemeinfreie“ Bilder und NASA-Medienrichtlinien vor Veröffentlichung auf einer ggf. werbefinanzierten deutschen Seite prüfen.

## Bildspeicher / Veröffentlichung (noch offen)
Bilddateien sind nicht importiert. Der Bild-Upload im Admin nutzt `sharp` und funktioniert auf Cloudflare nicht; ein Bildablageort (z. B. Supabase Storage oder statische Dateien) ist noch zu entscheiden. Solange kein Bild vorliegt, kann kein Ereignis in „In Prüfung“ oder „Freigegeben“ gehen (so gewollt).

## Wiederholen
`npm run import:redaktion` (legt nur Fehlendes an) · `-- --update` (überschreibt geänderte, noch unbearbeitete Entwürfe). Weiterbearbeitete Ereignisse werden nie überschrieben.
