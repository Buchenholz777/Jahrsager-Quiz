import { describe, expect, it } from "vitest";
import { MAIN_CATEGORIES } from "@/lib/constants";
import { isSpace, packViolations, pickDiversePack, type SelEvent } from "@/server/pipeline/select";
import { simulate, syntheticPool } from "@/server/pipeline/simulate";

// ACHTUNG: Alle Ereignisse in dieser Datei sind SYNTHETISCHE Testdaten (keine echten Ereignisse).
const ev = (i: number, over: Partial<SelEvent> = {}): SelEvent => ({
  id: `t${i}`,
  category: MAIN_CATEGORIES[i % 12],
  correct_year: 1900 + (i % 12) * 10,
  difficulty: [1, 1, 2, 2, 3][i % 5],
  region: ["europa", "asien", "afrika", "nordamerika", "suedamerika"][i % 5],
  country: "",
  tags: [`a${i}`, `kat-${MAIN_CATEGORIES[i % 12]}`],
  topic_key: `t${i}`,
  ...over,
});

describe("Harte Regeln je Tagesrätsel", () => {
  const ok = [ev(0), ev(1), ev(2), ev(3), ev(4)];
  it("akzeptiert eine vielfältige Zusammenstellung", () => {
    expect(packViolations([ev(0, { difficulty: 1 }), ev(1, { difficulty: 1 }), ev(2, { difficulty: 2 }), ev(3, { difficulty: 2 }), ev(4, { difficulty: 3 })], [])).toEqual([]);
  });
  it("verlangt mind. 4 Themenfelder und höchstens 2 je Themenfeld", () => {
    const three = [ev(0, { category: "politik" }), ev(1, { category: "politik" }), ev(2, { category: "sport" }), ev(3, { category: "sport" }), ev(4, { category: "film" })];
    expect(packViolations(three, [], false).join(" ")).toMatch(/Themenfelder/);
    const triple = [ev(0, { category: "politik" }), ev(1, { category: "politik" }), ev(2, { category: "politik" }), ev(3, { category: "sport" }), ev(4, { category: "film" })];
    expect(packViolations(triple, [], false).join(" ")).toMatch(/höchstens 2/);
  });
  it("verlangt mind. 3 Jahrzehnte und verbietet überwiegend dieselbe Region", () => {
    const sameDecade = ok.map((e, i) => ({ ...e, correct_year: 1960 + (i % 3) }));
    expect(packViolations(sameDecade, [], false).join(" ")).toMatch(/Jahrzehnte/);
    expect(packViolations(ok.map((e) => ({ ...e, region: "europa" })), [], false).join(" ")).toMatch(/Region/);
  });
  it("erkennt semantisch ähnliche Ereignisse (gleicher Themenschlüssel oder zwei gemeinsame Schlagwörter) trotz verschiedener IDs", () => {
    const moon = [ev(0, { category: "raumfahrt", topic_key: "apollo", tags: ["raumfahrt", "apollo"] }), ev(1, { category: "technik", topic_key: "apollo", tags: ["apollo", "mond"] })];
    expect(packViolations([...moon, ev(2), ev(3), ev(4)], [], false).join(" ")).toMatch(/Ähnliche/);
    const shuttle = [ev(0, { category: "raumfahrt", topic_key: "a", tags: ["raumfahrt", "space-shuttle"] }), ev(1, { category: "technik", topic_key: "b", tags: ["raumfahrt", "space-shuttle"] })];
    expect(packViolations([...shuttle, ev(2), ev(3), ev(4)], [], false).join(" ")).toMatch(/Ähnliche|Raumfahrt/);
  });
  it("lässt Raumfahrt höchstens einmal je 20 Ereignisse zu (Mondlandung + Shuttle + Apollo zusammen nicht)", () => {
    const space = (i: number) => ev(i, { category: "raumfahrt", tags: ["raumfahrt", `s${i}`], topic_key: `s${i}` });
    expect(packViolations([space(0), space(1), ev(2), ev(3), ev(4)], [], false).join(" ")).toMatch(/Mehr als ein Raumfahrt/);
    const history = [space(10), ...Array.from({ length: 10 }, (_, i) => ev(20 + i))];
    expect(packViolations([space(0), ev(2), ev(3), ev(4), ev(5)], history, false).join(" ")).toMatch(/Raumfahrt innerhalb/);
    expect(packViolations([ev(2), ev(3), ev(4), ev(5), ev(6)], history, false).join(" ")).not.toMatch(/Raumfahrt/);
  });
  it("verbietet ein kürzlich behandeltes Thema", () => {
    expect(packViolations([ev(0, { topic_key: "olympia" }), ev(1), ev(2), ev(3), ev(4)], [ev(30, { topic_key: "olympia" })], false).join(" ")).toMatch(/kürzlich/);
  });
  it("veröffentlicht nichts, wenn der Pool keine regelkonforme Auswahl zulässt", () => {
    const onlySpace = Array.from({ length: 12 }, (_, i) => ev(i, { category: "raumfahrt", tags: ["raumfahrt", `x${i}`], topic_key: `x${i}` }));
    const r = pickDiversePack(onlySpace, []);
    expect(r.set).toBeNull();
    expect(r.reasons.length).toBeGreaterThan(0);
  });
});

describe("Simulation: 30 Tagespartien mit 150 Ereignisplätzen (synthetische Metadaten)", () => {
  const scenarios: [string, SelEvent[]][] = [
    ["ausgewogener Pool", syntheticPool(400, 11, false)],
    ["einseitiger Pool (viel Raumfahrt/Technik)", syntheticPool(500, 12, true)],
  ];
  for (const [name, pool] of scenarios) {
    it(`hält alle Regeln ein – ${name}`, () => {
      const r = simulate(pool, 30);
      expect(r.failed).toBe(0);
      expect(r.packs.flat()).toHaveLength(150);
      expect(r.violations).toEqual([]);
      expect(new Set(r.packs.flat().map((e) => e.id)).size).toBe(150); // keine Wiederholung
      const space = r.packs.flat().filter(isSpace).length;
      expect(space).toBeLessThanOrEqual(Math.ceil(150 / 20));
      expect(r.dist.spaceShare).toBeLessThanOrEqual(0.07);
      expect(r.dist.sciTechShare).toBeLessThan(0.4);
      for (const c of r.dist.byCategory) expect(c.share).toBeLessThan(0.2);
      for (const p of r.packs) {
        expect(new Set(p.map((e) => e.category)).size).toBeGreaterThanOrEqual(4);
        expect(new Set(p.map((e) => Math.floor(e.correct_year / 10))).size).toBeGreaterThanOrEqual(3);
      }
      expect(r.perWindow.find((w) => w.days === 30)!.categories).toBeGreaterThanOrEqual(10);
    });
  }
});
