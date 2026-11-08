import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/client";
import { getEvent } from "@/server/services/events";
import { importCandidateImage } from "@/server/services/image-import";
import { freshDb } from "./helpers";

let db: Db;
let id: string;
beforeAll(async () => {
  db = await freshDb();
  id = (await db.one<{ id: string }>("select id from events where slug = 'apollo-11-mondlandung'"))!.id;
});
afterEach(() => vi.unstubAllGlobals());

function commons(license: string, thumb = "https://upload.wikimedia.org/wikipedia/commons/thumb/x/y.jpg") {
  return {
    ok: true,
    status: 200,
    json: async () => ({ query: { pages: [{ imageinfo: [{ url: thumb, thumburl: thumb, extmetadata: { LicenseShortName: { value: license } } }] }] } }),
  };
}

describe("Import des Kandidatenbildes", () => {
  it("bricht ab, wenn die Commons-Lizenz von der Recherche abweicht", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => commons("CC BY-NC 2.0")));
    await expect(importCandidateImage(db, id)).rejects.toMatchObject({ code: "LIZENZ_ABWEICHUNG" });
  });

  it("lädt nur von upload.wikimedia.org", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => commons("Public domain", "https://evil.example/x.jpg")));
    await expect(importCandidateImage(db, id)).rejects.toMatchObject({ code: "QUELLE_UNZULAESSIG" });
  });

  it("importiert, setzt Nachweisfelder und gibt das Bild NICHT frei", async () => {
    const png = await sharp({ create: { width: 640, height: 480, channels: 3, background: "#876" } }).png().toBuffer();
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (u: string | URL) => {
        calls.push(String(u));
        if (String(u).includes("commons.wikimedia.org")) return commons("Public domain");
        return { ok: true, status: 200, headers: new Headers(), arrayBuffer: async () => png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) };
      }),
    );
    const before = await getEvent(db, id);
    expect(before!.image_is_placeholder).toBe(true);
    const ev = await importCandidateImage(db, id);
    try {
      expect(ev.image_is_placeholder).toBe(false);
      expect(ev.image_ext).toBe("webp");
      expect(ev.image_status).toBe("zu_pruefen"); // nie automatisch freigegeben
      expect(ev.checks).toEqual({ rights: false, facts: false, photoMatchesEvent: false });
      expect(ev.image_credit_short).toBe("Foto: Neil Armstrong / NASA");
      expect(ev.image_license).toContain("Public Domain");
      expect(ev.version).toBe(before!.version + 1);
      expect(calls.some((c) => c.startsWith("https://upload.wikimedia.org/"))).toBe(true);
    } finally {
      for (const f of fs.readdirSync(path.join(process.cwd(), "storage", "images"))) {
        if (ev.image_id && f.startsWith(ev.image_id)) fs.rmSync(path.join(process.cwd(), "storage", "images", f));
      }
    }
  });
});
