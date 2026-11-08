import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/server/db/client";
import { getShowcase } from "@/server/services/showcase";
import { getTodayPack } from "@/server/services/packs";
import { freshDb, NOON } from "./helpers";

let db: Db;
beforeAll(async () => {
  db = await freshDb();
});
afterEach(() => {
  process.env.ALLOW_DEMO_CONTENT = "true";
});

describe("Startseiten-Bildauswahl (Hero und Teaser)", () => {
  it("zeigt keine Platzhalterbilder", async () => {
    const s = await getShowcase(db, NOON);
    expect(s.hero).toEqual([]);
    expect(s.teaser).toEqual([]);
  });

  it("verwendet nur Ereignisse vergangener Rätsel – nie Ereignisse des heutigen Tagesrätsels", async () => {
    await db.run("update events set image_is_placeholder = false");
    const today = (await getTodayPack(db, NOON))!.events.map((e) => e.slug);
    const s = await getShowcase(db, NOON);
    expect(s.hero.length).toBe(4);
    expect(s.teaser.length).toBeGreaterThan(0);
    for (const e of [...s.hero, ...s.teaser]) expect(today, e.slug).not.toContain(e.slug);
    expect(s.hero[0].slug).toBe("apollo-11-mondlandung");
    expect(new Set([...s.hero, ...s.teaser].map((e) => e.slug)).size).toBe(s.hero.length + s.teaser.length); // keine Doppelungen
  });

  it("schließt ein Ereignis aus, das auch in einem heutigen oder zukünftigen Paket vorkommt", async () => {
    const apollo = (await db.one<{ id: string }>("select id from events where slug = 'apollo-11-mondlandung'"))!.id;
    const pack = (await db.one<{ id: string }>("select id from daily_packs where pack_date = '2026-11-08'"))!.id;
    await db.run("update daily_pack_events set event_id = $1 where pack_id = $2 and position = 1", [apollo, pack]);
    const s = await getShowcase(db, NOON);
    expect([...s.hero, ...s.teaser].map((e) => e.slug)).not.toContain("apollo-11-mondlandung");
  });

  it("zeigt Produktionsinhalte nur mit Bildstatus „freigegeben“ und blendet Demo-Bilder ohne ALLOW_DEMO_CONTENT aus", async () => {
    process.env.ALLOW_DEMO_CONTENT = "false";
    expect((await getShowcase(db, NOON)).hero).toEqual([]); // alles Demo
    const id = (await db.one<{ id: string }>("select id from events where slug = 'wunder-von-bern'"))!.id;
    await db.run("update events set is_demo = false, image_status = 'zu_pruefen' where id = $1", [id]);
    expect((await getShowcase(db, NOON)).hero.map((e) => e.slug)).not.toContain("wunder-von-bern");
    await db.run("update events set image_status = 'freigegeben' where id = $1", [id]);
    const all = await getShowcase(db, NOON);
    expect([...all.hero, ...all.teaser].map((e) => e.slug)).toContain("wunder-von-bern");
  });
});
