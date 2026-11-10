import { describe, expect, it } from "vitest";
import { describeDeviation, resolutionAnnouncement, timelineGeometry, yearToPercent } from "@/lib/timeline";

describe("Zeitleiste: Abstand, Richtung, Segment", () => {
  it("Beispiel Tipp 1920, richtig 1890: roter Abschnitt 1890–1920, „30 Jahre zu spät“ (Skala 1850–2020)", () => {
    const g = timelineGeometry(1920, 1890, 1850, 2020);
    expect(g.exact).toBe(false);
    expect(g.segment!.leftPct).toBeCloseTo(yearToPercent(1890, 1850, 2020), 10);
    expect(g.segment!.leftPct + g.segment!.widthPct).toBeCloseTo(yearToPercent(1920, 1850, 2020), 10);
    expect(describeDeviation(1920, 1890)!.text).toBe("30 Jahre zu spät");
  });
  it("Segment ist unabhängig von der Reihenfolge der Marker identisch", () => {
    const a = timelineGeometry(1950, 1920);
    const b = timelineGeometry(1920, 1950);
    expect(a.segment).toEqual(b.segment);
    expect(describeDeviation(1920, 1950)!.text).toBe("30 Jahre zu früh");
    expect(describeDeviation(1950, 1920)!.text).toBe("30 Jahre zu spät");
  });
  it("1 Jahr (Einzahl), exakter Treffer, kein Tipp", () => {
    expect(describeDeviation(1999, 2000)!.text).toBe("1 Jahr zu früh");
    expect(describeDeviation(2000, 2000)).toMatchObject({ direction: "exakt", text: "Volltreffer!" });
    expect(timelineGeometry(2000, 2000).segment).toBeNull();
    expect(describeDeviation(null, 2000)).toBeNull();
  });
  it("Skalenränder und großer Abstand", () => {
    const g = timelineGeometry(1900, 2020);
    expect(g.guessPct).toBe(0);
    expect(g.correctPct).toBe(100);
    expect(g.segment).toEqual({ leftPct: 0, widthPct: 100 });
    expect(describeDeviation(1900, 2020)!.text).toBe("120 Jahre zu früh");
  });
  it("Screenreader-Text nennt Tipp, Lösung, Abstand und Punkte", () => {
    expect(resolutionAnnouncement(1950, 1920, 700)).toBe("Du hast 1950 geschätzt, das richtige Jahr ist 1920. 30 Jahre zu spät. 700 Punkte.");
    expect(resolutionAnnouncement(1920, 1920, 1000)).toContain("Volltreffer");
  });
});
