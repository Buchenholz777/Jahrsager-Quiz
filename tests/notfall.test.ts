import { describe, expect, it } from "vitest";
import { pgArrayLiteral } from "@/server/db/client";
import { pickLeastBad, type SelEvent } from "@/server/pipeline/select";

const ev = (i: number, category: string, year: number, topic: string): SelEvent => ({
  id: `e${i}`, category, correct_year: year, difficulty: 2, region: "europa", country: "", tags: [], topic_key: topic,
});

describe("Notfall-Auswahl und Datenbank-Listen", () => {
  it("wählt für heute lieber die beste verfügbare Kombination als keine", () => {
    // 7 Ereignisse, aber alle aus Europa im selben Jahrzehnt und nur 3 Themenfelder: strenge Regeln unerfüllbar
    const pool = [ev(1, "krieg", 1944, "a"), ev(2, "politik", 1945, "b"), ev(3, "krieg", 1946, "c"), ev(4, "kultur", 1947, "d"), ev(5, "politik", 1948, "e"), ev(6, "kultur", 1949, "f"), ev(7, "krieg", 1943, "g")];
    const r = pickLeastBad(pool, []);
    expect(r.set).toHaveLength(5);
    expect(new Set(r.set!.map((e) => e.category)).size).toBeGreaterThanOrEqual(3);
    expect(r.warnings[0]).toMatch(/Notfall/);
  });
  it("liefert nichts, wenn nicht einmal drei Themenfelder möglich sind", () => {
    const pool = Array.from({ length: 6 }, (_, i) => ev(i, i % 2 ? "krieg" : "politik", 1900 + i, `t${i}`));
    expect(pickLeastBad(pool, []).set).toBeNull();
  });
  it("übergibt Listen als Postgres-Array-Literal", () => {
    expect(pgArrayLiteral(["a-1", "b"])).toBe('{"a-1","b"}');
    expect(pgArrayLiteral(['x"y'])).toBe('{"x\\"y"}');
  });
});
