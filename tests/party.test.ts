import { beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/server/db/client";
import { answerRound } from "@/server/services/games";
import { createParty, generateCode, getPartyView, isValidCodeFormat, joinParty, normalizeCode, startPartyGame } from "@/server/services/parties";
import { freshDb, newPlayer } from "./helpers";

const AT = new Date("2026-11-20T11:00:00Z"); // später als die Demo-Pakete: sie zählen als „bereits gespielt“

describe("Party-Codes", () => {
  it("normalisiert Leerzeichen, Bindestriche und Groß-/Kleinschreibung", () => {
    expect(normalizeCode("  ab3 k7m \n")).toBe("AB3K7M");
    expect(normalizeCode("ab3-k7m")).toBe("AB3K7M");
    expect(normalizeCode(null)).toBe("");
  });
  it("erzeugt gültige Codes ohne verwechselbare Zeichen", () => {
    for (let i = 0; i < 200; i++) expect(isValidCodeFormat(generateCode())).toBe(true);
    expect(isValidCodeFormat("ABC0OI")).toBe(false);
  });
});

describe("Party: gemeinsamer Aufgabensatz, serverseitige Wertung, Sichtbarkeit", () => {
  let db: Db;
  beforeAll(async () => {
    process.env.ALLOW_DEMO_CONTENT = "true";
    db = await freshDb();
  });

  it("lehnt ungültige, leere und unbekannte Codes verständlich ab", async () => {
    const a = await newPlayer(db);
    await expect(joinParty(db, a, "   ", "A", AT)).rejects.toMatchObject({ code: "CODE_LEER" });
    await expect(joinParty(db, a, "ZZZZZZ", "A", AT)).rejects.toMatchObject({ code: "PARTY_UNBEKANNT" });
    await expect(joinParty(db, a, "abc", "A", AT)).rejects.toMatchObject({ code: "PARTY_UNBEKANNT" });
  });

  it("zwei Personen erhalten dieselben Fragen in derselben Reihenfolge, Ergebnisse erst nach eigenem Abschluss", async () => {
    const a = await newPlayer(db);
    const b = await newPlayer(db);
    const { code } = await createParty(db, a, "Anna", AT);
    // Beitritt mit kopiertem Code (Leerzeichen, Kleinbuchstaben)
    await joinParty(db, b, `  ${code.toLowerCase()} `, "Ben", AT);

    const ga = await startPartyGame(db, a, code, AT);
    const gb = await startPartyGame(db, b, code, AT);
    expect(ga.gameId).not.toBe(gb.gameId);
    expect(ga.mode).toBe("party");
    expect(ga.partyCode).toBe(code);
    // gleicher Aufgabensatz und gleiche Reihenfolge
    const ids = async (gameId: string) => (await db.query<{ event_id: string; event_version: number }>("select event_id, event_version from game_rounds where game_id = $1 order by position", [gameId])).map((r) => `${r.event_id}:${r.event_version}`);
    expect(await ids(ga.gameId)).toEqual(await ids(gb.gameId));

    // A spielt alles: erste Wertung bleibt bei Wiederholung unverändert
    for (let pos = 1; pos <= 5; pos++) {
      const r1 = await answerRound(db, a, ga.gameId, pos, 1960, AT);
      const r2 = await answerRound(db, a, ga.gameId, pos, 2000, AT); // Wiederholung mit anderem Wert
      expect(r2.alreadyAnswered).toBe(true);
      expect(r2.state.rounds.find((r) => r.position === pos)!.result!.guess).toBe(1960);
      expect(r1.state.totalPoints).toBeGreaterThanOrEqual(0);
    }
    const viewA = await getPartyView(db, a, code, AT);
    expect(viewA.me!.state).toBe("abgeschlossen");
    expect(viewA.waiting).toBe(true); // noch niemand sonst fertig
    expect(viewA.leaderboard).toHaveLength(1);
    // B hat nicht abgeschlossen: sieht keine Punktestände und keine fremden Tipps
    const viewB = await getPartyView(db, b, code, AT);
    expect(viewB.leaderboard).toEqual([]);
    expect(JSON.stringify(viewB)).not.toContain("1960");

    for (let pos = 1; pos <= 5; pos++) await answerRound(db, b, gb.gameId, pos, 1990, AT);
    const done = await getPartyView(db, a, code, AT);
    expect(done.waiting).toBe(false);
    expect(done.leaderboard.map((l) => l.name).sort()).toEqual(["Anna", "Ben"]);
  });

  it("Neuladen/Wiederholter Start setzt dieselbe Partie fort", async () => {
    const a = await newPlayer(db);
    const { code } = await createParty(db, a, "Anna", AT);
    const g1 = await startPartyGame(db, a, code, AT);
    await answerRound(db, a, g1.gameId, 1, 1950, AT);
    const g2 = await startPartyGame(db, a, code, AT);
    expect(g2.gameId).toBe(g1.gameId);
    expect(g2.answered).toBe(1);
  });

  it("der Aufgabensatz bleibt nach redaktioneller Änderung fix", async () => {
    const a = await newPlayer(db);
    const { code } = await createParty(db, a, "Anna", AT);
    const before = (await db.one<{ rounds: unknown }>("select rounds from parties where code = $1", [code]))!.rounds;
    await db.run("update events set correct_year = 1901, version = version + 1 where id in (select (r->>'event_id')::uuid from parties p, jsonb_array_elements(p.rounds) r where p.code = $1)", [code]);
    expect((await db.one<{ rounds: unknown }>("select rounds from parties where code = $1", [code]))!.rounds).toEqual(before);
  });
});
