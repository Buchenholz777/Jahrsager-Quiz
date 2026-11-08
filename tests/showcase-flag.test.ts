import { describe, expect, it } from "vitest";
import { createMemoryDb } from "@/server/db/client";
import { createEvent, updateEvent } from "@/server/services/events";
import { schedulePack } from "@/server/services/packs";
import { getShowcase } from "@/server/services/showcase";
import { eventInput, NOON } from "./helpers";

async function released(db: Awaited<ReturnType<typeof createMemoryDb>>, over = {}) {
  const e = await createEvent(db, eventInput({ image_status: "freigegeben", is_demo: false, image_is_placeholder: false, ...over }));
  await db.run("update events set status = 'freigegeben' where id = $1", [e.id]);
  return e;
}

describe("Startseiten-Freigabe", () => {
  it("zeigt nur ausdrücklich freigegebene, bildgeprüfte Ereignisse – ohne Tagesrätsel-Vergangenheit", async () => {
    const db = await createMemoryDb();
    const a = await released(db, { homepage_showcase: true });
    await released(db, { homepage_showcase: false }); // nicht für Startseite markiert
    await released(db, { homepage_showcase: true, image_status: "zu_pruefen" }); // Bild nicht freigegeben
    const show = await getShowcase(db, NOON);
    expect(show.hero.map((h) => h.slug)).toEqual([a.slug]);
    expect(show.teaser).toEqual([]); // keine Wissensseite ohne vergangenes Tagesrätsel
  });

  it("verhindert, dass ein Startseiten-Ereignis ins Tagesrätsel kommt – und umgekehrt", async () => {
    const db = await createMemoryDb();
    const cats = ["politik", "technik", "sport", "gesellschaft", "kultur"];
    const evs = [];
    for (let i = 0; i < 5; i++) evs.push(await released(db, { category: cats[i], correct_year: 1920 + i * 20, difficulty: i < 2 ? 1 : 2, homepage_showcase: i === 0 }));
    await expect(schedulePack(db, { date: "2026-12-01", eventIds: evs.map((e) => e.id) }, NOON)).rejects.toMatchObject({ code: "PAKET_UNGUELTIG" });
    await db.run("update events set homepage_showcase = false");
    await schedulePack(db, { date: "2026-12-01", eventIds: evs.map((e) => e.id) }, NOON);
    await expect(updateEvent(db, evs[0].id, { ...evs[0], homepage_showcase: true } as never, "Startseite")).rejects.toMatchObject({ code: "IN_PAKET" });
  });
});
