import { describe, expect, it } from "vitest";
import { createMemoryDb } from "@/server/db/client";
import { aiBudget, aiCallsAllowed, aiCallsUsed, poolLevel, poolThresholds } from "@/server/pipeline/monitor";
import { logRun, pipelineStats } from "@/server/pipeline/admin";

describe("Vorratsstufen", () => {
  const t = poolThresholds({});
  it("verwendet die geforderten Standardschwellen", () => {
    expect(t).toEqual({ target: 300, boost: 150, warn: 105, critical: 35, blocker: 5 });
  });
  it("ordnet den Vorrat korrekt ein", () => {
    expect(poolLevel(300, t).level).toBe("target");
    expect(poolLevel(299, t).level).toBe("fill");
    expect(poolLevel(149, t).level).toBe("boost");
    expect(poolLevel(104, t).level).toBe("warn");
    expect(poolLevel(34, t).level).toBe("critical");
    expect(poolLevel(34, t).days).toBe(6);
    expect(poolLevel(4, t).level).toBe("blocker");
    expect(poolLevel(0, t).message).toMatch(/Produktionsblocker/);
  });
  it("Schwellen sind per Umgebungsvariable einstellbar", () => {
    expect(poolThresholds({ POOL_CRITICAL: "50", POOL_TARGET: "x" })).toMatchObject({ critical: 50, target: 300 });
  });
});

describe("KI-Budget", () => {
  it("begrenzt Aufrufe je Lauf, Tag und Monat", () => {
    const b = aiBudget({});
    expect(b).toEqual({ perRun: 25, perDay: 60, perMonth: 1200 });
    expect(aiCallsAllowed({ today: 0, month: 0 }, b)).toBe(25);
    expect(aiCallsAllowed({ today: 50, month: 0 }, b)).toBe(10);
    expect(aiCallsAllowed({ today: 0, month: 1195 }, b)).toBe(5);
    expect(aiCallsAllowed({ today: 60, month: 100 }, b)).toBe(0);
    expect(aiCallsAllowed({ today: 0, month: 1300 }, b)).toBe(0);
  });
  it("liest verbrauchte Aufrufe aus den protokollierten Läufen", async () => {
    const db = await createMemoryDb();
    await logRun(db, "research", async () => ({ aiCalls: 7 }));
    await logRun(db, "research", async () => ({ aiCalls: 3 }));
    await logRun(db, "plan", async () => ({ planned: [] }));
    expect(await aiCallsUsed(db)).toEqual({ today: 10, month: 10 });
  });
});

describe("Dashboard-Kennzahlen", () => {
  it("meldet bei leerem Pool einen Produktionsblocker", async () => {
    const db = await createMemoryDb();
    const s = await pipelineStats(db);
    expect(s.stock).toBe(0);
    expect(s.level).toBe("blocker");
    expect(s.lowStock).toBe(true);
  });
});
