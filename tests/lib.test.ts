import { describe, expect, it } from "vitest";
import { findTimeHints } from "@/lib/hints";
import { describeDifference, isValidYear, scoreGuess } from "@/lib/scoring";
import { buildShareText } from "@/lib/share";
import { computeStreaks } from "@/lib/streak";
import { addDays, berlinDateKey, daysBetween, nextBerlinMidnight } from "@/lib/time";
import { PAKETE } from "../content/ereigniskarten";

describe("Punkteberechnung", () => {
  it("entspricht der Tabelle des Konzepts", () => {
    const base = 1969;
    expect(scoreGuess(base, base)).toBe(1000);
    expect(scoreGuess(base + 1, base)).toBe(950);
    expect(scoreGuess(base + 3, base)).toBe(850);
    expect(scoreGuess(base - 5, base)).toBe(750);
    expect(scoreGuess(base + 10, base)).toBe(500);
    expect(scoreGuess(base + 20, base)).toBe(0);
    expect(scoreGuess(base - 40, base)).toBe(0);
  });
  it("kennt Grenzfälle 1900 und 2020", () => {
    expect(scoreGuess(1900, 2020)).toBe(0);
    expect(scoreGuess(2020, 2020)).toBe(1000);
    expect(scoreGuess(1900, 1900)).toBe(1000);
    expect(scoreGuess(1901, 1900)).toBe(950);
  });
  it("validiert Jahre", () => {
    expect(isValidYear(1900)).toBe(true);
    expect(isValidYear(2020)).toBe(true);
    for (const v of [1899, 2021, 1950.2, NaN, "1950", null, undefined]) expect(isValidYear(v)).toBe(false);
  });
  it("lehnt unbekannte Wertungsversion und Nicht-Ganzzahlen ab", () => {
    expect(() => scoreGuess(1950, 1950, 99)).toThrow();
    expect(() => scoreGuess(1950.5, 1950)).toThrow();
  });
  it("beschreibt Abstände", () => {
    expect(describeDifference(0)).toBe("Genau getroffen!");
    expect(describeDifference(1)).toBe("1 Jahr daneben");
    expect(describeDifference(4)).toBe("4 Jahre daneben");
    expect(describeDifference(null)).toBe("Ohne Tipp aufgelöst");
  });
});

describe("Tageswechsel Europe/Berlin", () => {
  it("wechselt um 00:00 Berliner Zeit (Winterzeit)", () => {
    expect(berlinDateKey(new Date("2026-11-08T22:59:59Z"))).toBe("2026-11-08");
    expect(berlinDateKey(new Date("2026-11-08T23:00:00Z"))).toBe("2026-11-09");
  });
  it("wechselt um 00:00 Berliner Zeit (Sommerzeit)", () => {
    expect(berlinDateKey(new Date("2026-07-14T21:59:59Z"))).toBe("2026-07-14");
    expect(berlinDateKey(new Date("2026-07-14T22:00:00Z"))).toBe("2026-07-15");
  });
  it("Umstellung auf Sommerzeit (29. März 2026)", () => {
    expect(berlinDateKey(new Date("2026-03-28T23:00:00Z"))).toBe("2026-03-29");
    expect(berlinDateKey(new Date("2026-03-29T21:59:59Z"))).toBe("2026-03-29");
    expect(berlinDateKey(new Date("2026-03-29T22:00:00Z"))).toBe("2026-03-30");
    expect(nextBerlinMidnight(new Date("2026-03-29T10:00:00Z")).toISOString()).toBe("2026-03-29T22:00:00.000Z");
  });
  it("Umstellung auf Winterzeit (25. Oktober 2026)", () => {
    expect(berlinDateKey(new Date("2026-10-24T22:00:00Z"))).toBe("2026-10-25");
    expect(berlinDateKey(new Date("2026-10-25T22:59:59Z"))).toBe("2026-10-25");
    expect(berlinDateKey(new Date("2026-10-25T23:00:00Z"))).toBe("2026-10-26");
    expect(nextBerlinMidnight(new Date("2026-10-25T10:00:00Z")).toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });
  it("rechnet mit Kalendertagen", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
  });
});

describe("Teilnahmeserie", () => {
  it("zählt aufeinanderfolgende Tage", () => {
    expect(computeStreaks([], "2026-11-08")).toEqual({ current: 0, longest: 0 });
    expect(computeStreaks(["2026-11-06", "2026-11-07", "2026-11-08"], "2026-11-08")).toEqual({ current: 3, longest: 3 });
  });
  it("hält die Serie, solange heute noch offen ist", () => {
    expect(computeStreaks(["2026-11-06", "2026-11-07"], "2026-11-08")).toEqual({ current: 2, longest: 2 });
  });
  it("bricht bei einer Lücke ab und merkt sich die längste Serie", () => {
    expect(computeStreaks(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-07"], "2026-11-08")).toEqual({ current: 1, longest: 3 });
    expect(computeStreaks(["2026-11-01", "2026-11-02", "2026-11-03"], "2026-11-08")).toEqual({ current: 0, longest: 3 });
  });
  it("funktioniert über Monats- und Sommerzeitgrenzen", () => {
    expect(computeStreaks(["2026-03-28", "2026-03-29", "2026-03-30"], "2026-03-30").current).toBe(3);
  });
});

describe("Zeitliche Hinweise vor dem Tipp", () => {
  it("erkennt Jahreszahlen, Daten, Jahrzehnte und rechnerische Hinweise", () => {
    for (const t of [
      "Im Jahr 1969 landete",
      "Am 20. Juli ging es los",
      "am 9.11. fiel",
      "In den 60er Jahren",
      "Die sechziger Bewegung",
      "Ein Jahrzehnt später",
      "zum 50. Jubiläum",
      "zehn Jahre nach dem Krieg",
      "vor wenigen Jahren",
      "Jahre später",
      "ein 40-jähriger Mann",
      "im Sommer '68",
    ]) {
      expect(findTimeHints(t).length, t).toBeGreaterThan(0);
    }
  });
  it("lässt neutrale Texte und Zahlen mit Tausendertrennzeichen zu", () => {
    for (const t of [
      "Tausende versammeln sich auf einem Platz",
      "Rund 1.500 Menschen jubeln",
      "Die Mannschaft gewinnt mit 3:2",
      "Wenige Tage später endet die Reise",
    ]) {
      expect(findTimeHints(t), t).toEqual([]);
    }
  });
  it("alle 15 Ereigniskarten: Texte vor dem Tipp sind frei von Zeitangaben", () => {
    const cards = PAKETE.flat();
    expect(cards).toHaveLength(15);
    for (const e of cards) {
      const img = e.research.image!;
      for (const [label, text] of [
        ["Überschrift", e.neutral_title],
        ["Beschreibung", e.description],
        ["Platzhalter-Alt", e.placeholderAlt],
        ["Alt-Entwurf", img.altDraft],
        ["Kurz-Nachweis", img.creditShort],
        ["Lizenzname", img.license],
        ["Lizenz-URL", img.licenseUrl],
      ] as const) {
        expect(findTimeHints(text), `${e.slug}: ${label}`).toEqual([]);
      }
    }
  });
  it("die Karten bilden drei Pakete mit je fünf Ereignissen, ≥ 3 Themenfeldern und unterschiedlichen Jahren", () => {
    expect(PAKETE).toHaveLength(3);
    const slugs = new Set<string>();
    for (const pack of PAKETE) {
      expect(pack).toHaveLength(5);
      expect(new Set(pack.map((c) => c.category)).size).toBeGreaterThanOrEqual(3);
      expect(new Set(pack.map((c) => c.correct_year)).size).toBe(5);
      for (const c of pack) {
        expect(slugs.has(c.slug), c.slug).toBe(false);
        slugs.add(c.slug);
        expect(c.sources.length, c.slug).toBeGreaterThan(0);
        expect(c.imageStatus, c.slug).not.toBe("freigegeben"); // kein Bild ist ohne menschliche Prüfung freigegeben
        expect(c.exact_date?.startsWith(String(c.correct_year)) ?? true, c.slug).toBe(true);
        const words = c.description.split(/\s+/).length;
        expect(words, c.slug).toBeGreaterThanOrEqual(30);
        expect(words, c.slug).toBeLessThanOrEqual(55);
      }
    }
  });
});

describe("Spoilerfreies Teilen (JAHRSAGER)", () => {
  it("nutzt Markenname, Slogan und Ergebnis – ohne Ereignisse, Lösungen oder Jahre", () => {
    const text = buildShareText({ number: 42, points: 4050, url: "https://example.org/tagesraetsel/42" });
    expect(text.split("\n")).toEqual([
      "JAHRSAGER",
      "5 Bilder. 5 Ereignisse. Rate das Jahr.",
      "Tagesrätsel #42 – mein Ergebnis: 4.050 / 5.000",
      "Wie gut kennst du unsere Geschichte?",
      "https://example.org/tagesraetsel/42",
    ]);
    expect(text).not.toContain("ZEITSPUR");
    expect(text.replace("https://example.org/tagesraetsel/42", "")).not.toMatch(/[^0-9](19|20)[0-9]{2}[^0-9]/);
  });
  it("kennzeichnet Übungsrunden", () => {
    expect(buildShareText({ number: 1, points: 0, url: "u", practice: true })).toContain("Tagesrätsel #1 (Übung) – mein Ergebnis: 0 / 5.000");
  });
});

import { routeGroup } from "@/lib/route-group";
describe("Eigenmessung: Bereiche statt konkreter Pfade", () => {
  it("fasst Slugs und Nummern zusammen und kennt unbekannte Pfade nur als Sammelbereich", () => {
    expect(routeGroup("/")).toBe("/");
    expect(routeGroup("/geschichte/mondlandung?x=1")).toBe("/geschichte/[slug]");
    expect(routeGroup("/tagesraetsel/12")).toBe("/tagesraetsel/[nr]");
    expect(routeGroup("/archiv/")).toBe("/archiv");
    expect(routeGroup("/irgendwas/geheim-123")).toBe("/sonstige");
  });
});
