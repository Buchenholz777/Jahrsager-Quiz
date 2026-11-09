import { describe, expect, it } from "vitest";
import { MAIN_CATEGORIES } from "@/lib/constants";
import { createMemoryDb } from "@/server/db/client";
import { answerRound, getTodayStatus, startGame } from "@/server/services/games";
import { createEvent } from "@/server/services/events";
import { getPackByDate, getTodayPack, listArchivePacks, revisePack, schedulePack } from "@/server/services/packs";
import { eventInput, newPlayer, NOON, TODAY } from "./helpers";

async function released(db: Awaited<ReturnType<typeof createMemoryDb>>, i: number) {
  const e = await createEvent(
    db,
    eventInput({ category: MAIN_CATEGORIES[i % 12], correct_year: 1910 + i * 9, difficulty: [1, 1, 2, 2, 3][i % 5], image_status: "freigegeben", image_is_placeholder: false, is_demo: false, slug: `rev-${i}` }),
  );
  await db.run("update events set status = 'freigegeben' where id = $1", [e.id]);
  return e;
}

describe("Versionierte Tagespakete", () => {
  it("lässt begonnene und abgeschlossene Partien unverändert und gibt neuen Partien die neue Fassung", async () => {
    const db = await createMemoryDb();
    const evs = [];
    for (let i = 0; i < 10; i++) evs.push(await released(db, i));
    const old = await schedulePack(db, { date: TODAY, eventIds: evs.slice(0, 5).map((e) => e.id) }, NOON);
    const p1 = await newPlayer(db);
    const p2 = await newPlayer(db);

    // Spieler 1 beginnt die ursprüngliche Fassung
    const s1 = await startGame(db, p1, {}, NOON);
    expect(s1.packNumber).toBe(old.number);
    const oldEventIds = s1.rounds.map((r) => r.eventId);
    await answerRound(db, p1, s1.gameId, 1, 1950, NOON);

    // Paket wird durch eine neue Fassung ersetzt
    const fresh = await revisePack(db, { packId: old.id, eventIds: evs.slice(5).map((e) => e.id) }, NOON);
    expect(fresh.revision).toBe(2);
    expect(fresh.number).not.toBe(old.number);
    expect((await getPackByDate(db, TODAY))!.id).toBe(fresh.id);
    expect((await getTodayPack(db, NOON))!.events.map((e) => e.id).sort()).toEqual(evs.slice(5).map((e) => e.id).sort());

    // Neue Spielerin bekommt die neue Fassung, Spieler 1 setzt seine ursprüngliche Partie fort
    const s2 = await startGame(db, p2, {}, NOON);
    expect(s2.packNumber).toBe(fresh.number);
    expect(evs.slice(5).map((e) => e.id)).toContain(s2.rounds[0].eventId);
    const again = await startGame(db, p1, {}, NOON);
    expect(again.gameId).toBe(s1.gameId);
    expect(again.rounds[0].eventId).toBe(oldEventIds[0]);
    expect(evs.slice(0, 5).map((e) => e.id)).toContain(again.rounds[0].eventId);
    expect(again.answered).toBe(1);
    // Ein Link auf die ersetzte Fassung (Nummer) führt neue Spieler zur aktuellen Fassung
    const p3 = await newPlayer(db);
    expect((await startGame(db, p3, { packNumber: old.number }, NOON)).packNumber).toBe(fresh.number);

    // Spieler 1 schließt die ursprüngliche Partie ab: Ergebnis bleibt, keine zweite Wertung für dasselbe Datum
    for (let pos = 2; pos <= 5; pos++) await answerRound(db, p1, s1.gameId, pos, 1960, NOON);
    const status = await getTodayStatus(db, p1, NOON);
    expect(status.state).toBe("abgeschlossen");
    expect(status.gameId).toBe(s1.gameId);
    const noSecond = await startGame(db, p1, {}, NOON);
    expect(noSecond.gameId).toBe(s1.gameId);
    const practice = await startGame(db, p1, { practice: true }, NOON);
    expect(practice.official).toBe(false);
    expect(practice.packNumber).toBe(fresh.number);
    expect((await getTodayStatus(db, p2, NOON)).state).toBe("laufend");

    // Nichts ging verloren; die ersetzte Fassung erscheint nicht doppelt im Archiv
    const games = await db.query<{ official: boolean; pack_id: string }>("select official, pack_id from games");
    expect(games).toHaveLength(4);
    expect(games.filter((g) => g.pack_id === old.id)).toHaveLength(1);
    expect((await listArchivePacks(db, new Date("2026-11-09T11:00:00Z"))).map((p) => p.id)).not.toContain(old.id);
  });

  it("verweigert unzulässige Ersatzpakete", async () => {
    const db = await createMemoryDb();
    const evs = [];
    for (let i = 0; i < 6; i++) evs.push(await released(db, i));
    const old = await schedulePack(db, { date: TODAY, eventIds: evs.slice(0, 5).map((e) => e.id) }, NOON);
    await expect(revisePack(db, { packId: old.id, eventIds: evs.slice(0, 4).map((e) => e.id) }, NOON)).rejects.toMatchObject({ code: "PAKET_UNGUELTIG" });
    await db.run("update events set image_status = 'zu_pruefen' where id = $1", [evs[5].id]);
    await expect(revisePack(db, { packId: old.id, eventIds: [...evs.slice(1, 5), evs[5]].map((e) => e.id) }, NOON)).rejects.toMatchObject({ code: "PAKET_UNGUELTIG" });
    expect((await getPackByDate(db, TODAY))!.id).toBe(old.id); // unverändert
  });
});
