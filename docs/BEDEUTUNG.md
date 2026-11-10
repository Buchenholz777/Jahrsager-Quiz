# Weltgeschichtliche Bedeutung als Pflichtkriterium (Stand 10. November 2026)

Jede neue Frage braucht ein **konkretes Ereignis** mit **eindeutig belegtem Jahr** und **belegter weltgeschichtlicher Bedeutung** (nachweisbare Folgen über Ländergrenzen hinweg oder historischer Wendepunkt von weltweiter Bedeutung) und, bei bebilderten Fragen, ein **ereignisspezifisches Foto**. Ein einzelner Ort genügt. Bekanntheit, kurzfristiges Medienecho oder lokale Rekorde genügen nicht. Eine Themen-/Regionen-/Epochenquote setzt diese Prüfung nie außer Kraft: Gibt es zu wenige geeignete Kandidaten, gibt es weniger Einträge.

## Wo die Regeln greifen
| Stufe | Regel | Ergebnis |
|---|---|---|
| Kandidatensuche (Wikidata) | nur Ereignisse mit mindestens 10 Wikipedia-Sprachversionen (Indiz internationaler Beachtung) | kaum beachtete Ereignisse tauchen gar nicht erst auf |
| Vor der KI (kostenlos) | weniger als 10 Sprachversionen | **abgelehnt** |
| KI-Entwurf | Urteil `weltgeschichtlich` / `nicht_weltgeschichtlich` / `unklar`, **ein Begründungssatz** aus dem Wikipedia-Auszug, Folgen über Ländergrenzen, Jahr eindeutig?, Bildbezug `ereignisspezifisch` / `generisch` / `unklar` | die KI kann nur **herabstufen** |
| Bewertung (`src/lib/bedeutung.ts`, `assess`) | nicht weltgeschichtlich → **abgelehnt**; Foto generisch → **abgelehnt** („Bildprüfung“); unklar, Begründung fehlt/zu kurz/nur Medienecho, keine Folgen über Ländergrenzen, Jahr mehrdeutig, Bildbezug unklar, 10–24 Sprachversionen oder keine Angabe, weniger als 2 unabhängige Quellen → **zurückgestellt** (Entwurf im Freigabe-Assistenten) | automatische Freigabe nur, wenn alles stimmt **und** mindestens 25 Sprachversionen vorliegen (die KI allein reicht nie) |
| Redaktion (Freigabe) | `eventProblems`: ohne Begründung (mind. 8 Wörter), mit Urteil „nicht weltgeschichtlich“, Begründung nur mit Bekanntheit/Medienecho/Rekord, generischem Foto oder mehrdeutigem Jahr **keine Freigabe** | Meldung mit konkretem Grund |

Die Begründung liegt im Ereignis (`research.bedeutung`: Urteil, Begründung, Sprachversionen, Bildbezug, Jahr eindeutig, geprüft von/am) und wird in der **Auflösung** als kurzer Kontext unter dem Ergebnis angezeigt.

## In der Redaktion sichtbar
* **Freigabe-Assistent:** Block „Weltgeschichtliche Bedeutung“ (Urteil, Begründung, Sprachversionen, Bildbezug, Jahr) mit den konkreten Gründen bei zurückgestellten Einträgen. Die Begründung kann dort direkt eingetragen oder geändert werden (Pflicht für die Freigabe), ebenso im Ereignisformular.
* **Automatik:** Liste „Zuletzt abgelehnt oder zurückgestellt (mit Grund)“ der letzten 40 Kandidaten.
* **`npm run bestand`:** Stichprobe (Region · Jahrzehnt · Thema → Begründung) und Zahl der spielbaren Ereignisse **ohne** erfasste Begründung.

## Hinweis zum Altbestand
Bereits freigegebene Ereignisse wurden vor dieser Regel geprüft und haben meist keine erfasste Begründung. Sie bleiben spielbar; neue Freigaben (auch erneute) verlangen die Begründung. Der Bestandsbericht nennt die Zahl, damit sie nachträglich ergänzt werden kann.

## Grenzen
Das Urteil „weltgeschichtlich“ ist eine redaktionelle Wertung. Die Automatik stützt sich auf zwei unabhängige Indizien (KI-Begründung aus dem Auszug und internationale Beachtung in Wikipedia), ersetzt aber nicht die Stichprobenkontrolle durch die Redaktion.
