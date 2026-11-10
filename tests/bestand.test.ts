import { describe, expect, it } from "vitest";
import { analyseBestand, type BestandEvent } from "@/server/pipeline/bestand";

const ev = (n: number, o: Partial<BestandEvent> = {}): BestandEvent => ({
  id: `e${n}`, slug: `e-${n}`, status: "veroeffentlicht", category: "politik", correct_year: 1950 + n, region: "europa", topic_key: `t${n}`, source_id: `Q${n}`,
  exact_date: "1950-01-01", neutral_title: `E${n}`, tags: [`a${n}`], has_image: true, has_source_url: true, is_demo: false, blocked: false, ...o,
});

describe("Bestandscheck", () => {
  it("zählt nur eindeutige, spielbare Ereignisse und berechnet die Zahl vollständiger Spiele", () => {
    const events = Array.from({ length: 12 }, (_, i) => ev(i));
    events.push(ev(20, { has_image: false }), ev(21, { status: "entwurf" }), ev(22, { correct_year: 1890 }), ev(23, { is_demo: true }));
    const r = analyseBestand(events);
    expect(r.playable).toBe(12);
    expect(r.completeGames).toBe(2);
    expect(r.rest).toBe(2);
    expect(r.excluded).toHaveLength(4);
    expect(r.excluded.find((e) => e.slug === "e-22")!.reason).toContain("außerhalb");
  });
  it("erkennt Dubletten (Wikidata-ID, Themenschlüssel, Jahr und Schlagwörter)", () => {
    const r = analyseBestand([ev(1), ev(2, { source_id: "Q1" }), ev(3, { topic_key: "t1" }), ev(4, { correct_year: 1999, tags: ["x", "y"] }), ev(5, { correct_year: 1999, tags: ["x", "y"] })]);
    expect(r.duplicates).toHaveLength(3);
    expect(r.playable).toBe(2);
  });
  it("meldet Lücken bei Jahrzehnten", () => {
    const r = analyseBestand([ev(1, { correct_year: 1950 })]);
    expect(r.gaps.some((g) => g.includes("1900er"))).toBe(true);
  });
});
