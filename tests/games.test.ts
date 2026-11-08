import { beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/server/db/client";
import { answerRound, getGameState, getTodayStatus, startGame } from "@/server/services/games";
import { getPlayerStats } from "@/server/services/stats";
import { getPackByDate, getPublicPack, getTodayPack } from "@/server/services/packs";
import { freshDb, newPlayer, NOON, TODAY } from "./helpers";

let db: Db;
let years: number[];
beforeAll(async () => {
  db = await freshDb();
  const t = await getTodayPack(db, NOON);
  years = t!.events.map((e) => e.correct_year);
});

describe("Spielstart und Lösungsschutz", () => {
  it("liefert nur die erste Runde und keine Lösung offener Runden", async () => {
    const p = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    expect(s.official).toBe(true);
    expect(s.rounds).toHaveLength(1);
    expect(s.currentPosition).toBe(1);
    expect(s.rounds[0].result).toBeUndefined();
    const json = JSON.stringify(s);
    expect(json).not.toContain("correct");
    expect(json).not.toContain("explanation");
    for (const y of years) expect(json).not.toMatch(new RegExp(`\\b${y}\\b`));
  });

  it("setzt eine begonnene Partie nach Neuladen fort", async () => {
    const p = await newPlayer(db);
    const a = await startGame(db, p, {}, NOON);
    await answerRound(db, p, a.gameId, 1, 1969, NOON);
    const b = await startGame(db, p, {}, NOON);
    expect(b.gameId).toBe(a.gameId);
    expect(b.currentPosition).toBe(2);
    expect(b.rounds).toHaveLength(2);
    expect(b.rounds[0].result?.points).toBeGreaterThanOrEqual(0);
  });
});

describe("Wertung", () => {
  it("berechnet Punkte serverseitig nach der Formel", async () => {
    const p = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    const correct = years[0];
    const { state } = await answerRound(db, p, s.gameId, 1, correct + 3, NOON);
    expect(state.rounds[0].result).toMatchObject({ guess: correct + 3, correct, difference: 3, points: 850 });
  });

  it("wertet doppelte Antworten genau einmal (idempotent)", async () => {
    const p = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    const first = await answerRound(db, p, s.gameId, 1, years[0], NOON);
    const second = await answerRound(db, p, s.gameId, 1, 1900, NOON);
    expect(first.alreadyAnswered).toBe(false);
    expect(second.alreadyAnswered).toBe(true);
    expect(second.state.rounds[0].result?.points).toBe(1000);
    expect(second.state.rounds[0].result?.guess).toBe(years[0]);
  });

  it("verträgt parallele Doppelklicks", async () => {
    const p = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    const rs = await Promise.all(Array.from({ length: 5 }, () => answerRound(db, p, s.gameId, 1, years[0] + 1, NOON)));
    expect(rs.filter((r) => !r.alreadyAnswered)).toHaveLength(1);
    const n = await db.one<{ n: number }>("select count(*)::int as n from game_rounds where game_id = $1 and status <> 'offen'", [s.gameId]);
    expect(n!.n).toBe(1);
  });

  it("verbraucht bei ungültigen Eingaben keinen Tipp", async () => {
    const p = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    for (const bad of [1899, 2021, 1950.5, Number.NaN]) {
      await expect(answerRound(db, p, s.gameId, 1, bad, NOON)).rejects.toMatchObject({ code: "UNGUELTIGES_JAHR" });
    }
    await expect(answerRound(db, p, s.gameId, 9, 1950, NOON)).rejects.toMatchObject({ code: "UNGUELTIGE_RUNDE" });
    const st = await getGameState(db, p, s.gameId, NOON);
    expect(st!.currentPosition).toBe(1);
    expect(st!.answered).toBe(0);
  });

  it("erzwingt die Reihenfolge der Runden", async () => {
    const p = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    await expect(answerRound(db, p, s.gameId, 3, 1950, NOON)).rejects.toMatchObject({ code: "REIHENFOLGE" });
  });

  it("löst ohne Tipp mit null Punkten auf", async () => {
    const p = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    const { state } = await answerRound(db, p, s.gameId, 1, null, NOON);
    expect(state.rounds[0]).toMatchObject({ status: "ohne_tipp" });
    expect(state.rounds[0].result).toMatchObject({ guess: null, difference: null, points: 0 });
  });

  it("verweigert fremden Spielern den Zugriff", async () => {
    const p = await newPlayer(db);
    const other = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    await expect(answerRound(db, other, s.gameId, 1, 1950, NOON)).rejects.toMatchObject({ code: "NICHT_GEFUNDEN" });
    expect(await getGameState(db, other, s.gameId, NOON)).toBeNull();
  });
});

async function playAll(p: string, gameId: string, at: Date, offsets = [0, 1, 3, 10, 25]) {
  let state = await getGameState(db, p, gameId, at);
  for (let i = 1; i <= 5; i++) {
    const r = state!.rounds.find((x) => x.position === i);
    // Lösung aus dem Paket (nur im Test bekannt)
    const ev = await db.one<{ correct_year: number }>("select e.correct_year from game_rounds r join events e on e.id = r.event_id where r.game_id = $1 and r.position = $2", [gameId, i]);
    expect(r).toBeDefined();
    state = (await answerRound(db, p, gameId, i, Math.min(2020, ev!.correct_year + offsets[i - 1]), at)).state;
  }
  return state!;
}

describe("Tagespartie, Übung und Statistik", () => {
  it("schließt eine Partie ab und summiert die Punkte", async () => {
    const p = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    const done = await playAll(p, s.gameId, NOON, [0, 1, 3, 10, 25]);
    expect(done.status).toBe("abgeschlossen");
    expect(done.currentPosition).toBeNull();
    expect(done.rounds).toHaveLength(5);
    // 1000 + 950 + 850 + 500 + 0
    expect(done.totalPoints).toBe(3300);
  });

  it("erzeugt nur eine offizielle Wertung; Wiederholungen sind Übung", async () => {
    const p = await newPlayer(db);
    const s = await startGame(db, p, {}, NOON);
    await playAll(p, s.gameId, NOON, [0, 0, 0, 0, 0]);
    const again = await startGame(db, p, {}, NOON);
    expect(again.gameId).toBe(s.gameId); // zeigt das offizielle Ergebnis
    const practice = await startGame(db, p, { practice: true }, NOON);
    expect(practice.official).toBe(false);
    expect(practice.gameId).not.toBe(s.gameId);
    await playAll(p, practice.gameId, NOON, [25, 25, 25, 25, 25]);
    const stats = await getPlayerStats(db, p, TODAY);
    expect(stats.completed).toBe(1);
    expect(stats.averagePoints).toBe(5000);
    expect(stats.exactHits).toBe(5);
    expect(stats.practiceGames).toBe(1);
    const officials = await db.one<{ n: number }>("select count(*)::int as n from games where player_id = $1 and official", [p]);
    expect(officials!.n).toBe(1);
  });

  it("erlaubt Übung am heutigen Paket erst nach abgeschlossener offizieller Wertung", async () => {
    const p = await newPlayer(db);
    const first = await startGame(db, p, { practice: true }, NOON);
    expect(first.official).toBe(true); // wird zur offiziellen Partie, keine Lösungsvorschau
  });

  it("behandelt frühere Pakete als Übung, ohne die Tageswertung zu verändern", async () => {
    const p = await newPlayer(db);
    const old = await getPackByDate(db, "2026-11-07");
    const s = await startGame(db, p, { packNumber: old!.number }, NOON);
    expect(s.official).toBe(false);
    expect(s.mode).toBe("practice");
    const st = await getTodayStatus(db, p, NOON);
    expect(st.state).toBe("neu");
  });

  it("lässt eine begonnene Partie nach Mitternacht abschließen (bisherige Ausgabe)", async () => {
    const p = await newPlayer(db);
    const late = new Date("2026-11-08T22:50:00Z"); // 23:50 Berlin
    const s = await startGame(db, p, {}, late);
    await answerRound(db, p, s.gameId, 1, 1950, late);
    const after = new Date("2026-11-08T23:30:00Z"); // 00:30 Berlin, neuer Tag
    const st = await getTodayStatus(db, p, after);
    expect(st.openOlder?.number).toBe(s.packNumber);
    const cont = await startGame(db, p, { packNumber: s.packNumber }, after);
    expect(cont.gameId).toBe(s.gameId);
    expect(cont.official).toBe(true);
    expect(cont.currentPosition).toBe(2);
    const done = await playAll(p, s.gameId, after, [0, 0, 0, 0, 0]);
    expect(done.status).toBe("abgeschlossen");
  });

  it("zeigt zukünftige Pakete nicht an", async () => {
    expect(await getPublicPack(db, 999, NOON)).toBeNull();
    const p = await newPlayer(db);
    await expect(startGame(db, p, { packNumber: 999 }, NOON)).rejects.toMatchObject({ code: "NICHT_VERFUEGBAR" });
  });
});
