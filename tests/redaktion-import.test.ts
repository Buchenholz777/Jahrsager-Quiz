import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createMemoryDb } from "@/server/db/client";
import { findTimeHints } from "@/lib/hints";
import { getEventBySlug, listRevisions, transitionEvent, updateEvent } from "@/server/services/events";
import { schedulePack } from "@/server/services/packs";
import { getShowcase } from "@/server/services/showcase";
import { importRedaktion, type RedaktionFile } from "@/server/services/redaktion-import";
import { NOON, TODAY } from "./helpers";

const file = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "recherche", "jahrsager-10-ereignisse.json"), "utf8")) as RedaktionFile;

describe("Redaktions-Import (10 Ereignisse)", () => {
  it("legt zehn Entwürfe an und läuft wiederholt ohne Dubletten oder neue Fassungen", async () => {
    const db = await createMemoryDb();
    const a = await importRedaktion(db, file);
    expect(a.created).toHaveLength(10);
    expect(a.spoilers).toEqual([]);
    const b = await importRedaktion(db, file);
    expect(b.created).toHaveLength(0);
    expect(b.unchanged).toHaveLength(10);
    expect((await db.one<{ n: number }>("select count(*)::int as n from events"))!.n).toBe(10);
    const ev = (await getEventBySlug(db, "hubble-start-1990"))!;
    expect(await listRevisions(db, ev.id)).toHaveLength(1);
  });

  it("legt nur Entwürfe ohne Bild, ohne Prüfbestätigung und ohne Demo-Kennzeichen an", async () => {
    const db = await createMemoryDb();
    await importRedaktion(db, file);
    const rows = await db.query<{ status: string; image_id: string | null; checks: object; is_demo: boolean; image_status: string }>(
      "select status, image_id, checks, is_demo, image_status from events",
    );
    for (const r of rows) {
      expect(r.status).toBe("entwurf");
      expect(r.image_id).toBeNull();
      expect(r.checks).toEqual({});
      expect(r.is_demo).toBe(false);
      expect(r.image_status).not.toBe("freigegeben");
    }
    const open = rows.filter((r) => r.image_status === "zu_pruefen").length;
    expect(open).toBe(6);
  });

  it("enthält vor dem Tipp keine Zeitangaben", async () => {
    const db = await createMemoryDb();
    await importRedaktion(db, file);
    const rows = await db.query<{ neutral_title: string; description: string; image_credit_short: string }>("select neutral_title, description, image_credit_short from events");
    for (const r of rows) {
      expect(findTimeHints(r.neutral_title)).toEqual([]);
      expect(findTimeHints(r.description)).toEqual([]);
      expect(findTimeHints(r.image_credit_short)).toEqual([]);
    }
  });

  it("kann weder freigegeben noch in ein Tagespaket eingeplant werden und erscheint nicht öffentlich", async () => {
    const db = await createMemoryDb();
    await importRedaktion(db, file);
    const ev = (await getEventBySlug(db, "nixon-ruecktritt-1974"))!;
    await expect(transitionEvent(db, ev.id, "freigegeben")).rejects.toMatchObject({ status: 409 });
    await expect(transitionEvent(db, ev.id, "in_pruefung")).rejects.toMatchObject({ code: "PRUEFUNG_FEHLGESCHLAGEN" });
    const ids = (await db.query<{ id: string }>("select id from events order by slug limit 5")).map((r) => r.id);
    await expect(schedulePack(db, { date: "2026-12-01", eventIds: ids }, NOON)).rejects.toMatchObject({ code: "PAKET_UNGUELTIG" });
    const show = await getShowcase(db, NOON);
    expect(show.hero).toEqual([]);
    expect(show.teaser).toEqual([]);
    expect(TODAY).toBe("2026-11-08");
  });

  it("überschreibt weiterbearbeitete Ereignisse nie und zeigt Änderungen als Vorschlag", async () => {
    const db = await createMemoryDb();
    await importRedaktion(db, file);
    const ev = (await getEventBySlug(db, "hubble-start-1990"))!;
    await updateEvent(db, ev.id, { ...ev, image_alt: "Selbst formulierter Alternativtext" } as never, "manuell");
    const changed = structuredClone(file);
    changed.events.find((e) => e.slug === "hubble-start-1990")!.reveal.extra_fact = "Geänderter Text";
    const prop = await importRedaktion(db, changed);
    expect(prop.proposals.map((p) => p.slug)).toContain("hubble-start-1990");
    expect(prop.proposals.every((p) => !p.applied)).toBe(true);
    expect((await getEventBySlug(db, "hubble-start-1990"))!.explanation_detail).not.toBe("Geänderter Text");
    await db.run("update events set status = 'in_pruefung' where slug = 'hubble-start-1990'");
    const skipped = await importRedaktion(db, changed, { update: true });
    expect(skipped.skipped).toContain("hubble-start-1990");
    expect((await getEventBySlug(db, "hubble-start-1990"))!.explanation_detail).not.toBe("Geänderter Text");
  });
});
