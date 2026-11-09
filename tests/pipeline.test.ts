import { describe, expect, it } from "vitest";
import { createMemoryDb } from "@/server/db/client";
import type { CardDraft } from "@/server/pipeline/ai";
import { blockEvent, pipelineStats } from "@/server/pipeline/admin";
import { assess, parseCommonsDay, type AssessInput } from "@/server/pipeline/evaluate";
import { evaluateLicense, type CommonsMeta } from "@/server/pipeline/license";
import { planPacks, poolEvents } from "@/server/pipeline/plan";
import { processCandidate, type Deps } from "@/server/pipeline/process";
import type { Candidate } from "@/server/pipeline/sources";
import { createEvent } from "@/server/services/events";
import { getShowcase } from "@/server/services/showcase";
import { eventInput, NOON } from "./helpers";

const words = (n: number) => Array.from({ length: n }, (_, i) => "wort" + String.fromCharCode(97 + (i % 26))).join(" ");

const meta = (over: Partial<CommonsMeta> = {}): CommonsMeta => ({
  file: "Test.jpg",
  pageUrl: "https://commons.wikimedia.org/wiki/File:Test.jpg",
  url: "https://upload.wikimedia.org/x/Test.jpg",
  width: 3000,
  height: 2000,
  mime: "image/jpeg",
  license: "Public domain",
  licenseUrl: "",
  artist: "NASA",
  credit: "NASA Johnson Space Center",
  dateOriginal: "1969-07-20",
  copyrighted: false,
  restrictions: "",
  categories: ["NASA images"],
  ...over,
});
const draft = (over: Partial<CardDraft> = {}): CardDraft => ({
  insufficient: false,
  category: "technik",
  difficulty: 2,
  neutral_title: "Ein großer Moment",
  description: words(40),
  image_alt: "Ein Raumfahrzeug auf der Startrampe",
  public_title: "Ein Ereignis",
  explanation_what: words(70),
  explanation_why: words(20),
  explanation_detail: words(12),
  image_check: { matches_event: "yes", persons_visible: false, caption_or_date_visible: false, quality_ok: true, note: "" },
  ...over,
});
const base = (over: Partial<AssessInput> = {}): AssessInput => ({
  eventDate: "1969-07-20",
  meta: meta(),
  wikipediaUrl: "https://de.wikipedia.org/wiki/Test",
  externalSources: ["https://www.nasa.gov/x"],
  draft: draft(),
  duplicate: null,
  ...over,
});

describe("Lizenz-Allowlist", () => {
  it("erlaubt CC0 und Public domain mit Nachweis eines US-Regierungswerks", () => {
    expect(evaluateLicense(meta({ license: "CC0", artist: "Jemand", credit: "", categories: [] })).allowed).toBe(true);
    const r = evaluateLicense(meta());
    expect(r.allowed).toBe(true);
    expect(r.licenseClass).toBe("pd-usgov");
  });
  it("verweist bloßes „Public domain“, CC BY und Agenturbilder in die manuelle Prüfung", () => {
    expect(evaluateLicense(meta({ artist: "Unbekannt", credit: "Archiv", categories: [] }))).toMatchObject({ allowed: false, manual: true });
    expect(evaluateLicense(meta({ license: "CC BY-SA 4.0", copyrighted: true }))).toMatchObject({ allowed: false, manual: true });
    expect(evaluateLicense(meta({ artist: "© Getty Images" }))).toMatchObject({ allowed: false, manual: true });
    expect(evaluateLicense(meta({ restrictions: "personality" }))).toMatchObject({ allowed: false, manual: true });
  });
  it("lehnt nicht freie oder fehlende Lizenzen ab", () => {
    expect(evaluateLicense(meta({ license: "" }))).toMatchObject({ allowed: false, manual: false });
    expect(evaluateLicense(meta({ license: "CC BY-NC 4.0", copyrighted: true }))).toMatchObject({ allowed: false, manual: false });
  });
});

describe("Aufnahmedatum", () => {
  it("liest ISO, ausgeschriebene und nur jahresgenaue Angaben", () => {
    expect(parseCommonsDay("Taken on 9 August 1974")).toEqual({ y: 1974, m: 8, d: 9 });
    expect(parseCommonsDay("1936-08-04")).toEqual({ y: 1936, m: 8, d: 4 });
    expect(parseCommonsDay("August 1936")).toEqual({ y: 1936, m: 8 });
    expect(parseCommonsDay("1927")).toEqual({ y: 1927 });
    expect(parseCommonsDay("unbekannt")).toBeNull();
  });
});

describe("Automatische Entscheidung", () => {
  it("gibt nur frei, wenn ALLE Regeln erfüllt sind, und protokolliert die Prüfung", () => {
    const a = assess(base());
    expect(a.decision).toBe("auto_approved");
    expect(a.audit.map((e) => e.step)).toEqual(expect.arrayContaining(["lizenz", "datierung", "bildqualitaet", "quellen", "inhalt", "bildkontrolle", "entscheidung"]));
  });
  it("lehnt ab: Aufnahme aus anderem Jahr, Dublette, schlechte Qualität, Foto passt nicht, Jahr außerhalb", () => {
    expect(assess(base({ meta: meta({ dateOriginal: "2019-01-01" }) })).decision).toBe("rejected");
    expect(assess(base({ duplicate: "apollo-1969" })).decision).toBe("rejected");
    expect(assess(base({ meta: meta({ width: 640 }) })).decision).toBe("rejected");
    expect(assess(base({ draft: draft({ image_check: { matches_event: "no", persons_visible: false, caption_or_date_visible: false, quality_ok: true, note: "" } }) })).decision).toBe("rejected");
    expect(assess(base({ eventDate: "1890-01-01", meta: meta({ dateOriginal: "1890-01-01" }) })).decision).toBe("rejected");
  });
  it("verweist in die manuelle Prüfung: Personen, unklare Datierung, fehlende Quellen, Zeitspoiler, fehlender Entwurf", () => {
    expect(assess(base({ draft: draft({ image_check: { matches_event: "yes", persons_visible: true, caption_or_date_visible: false, quality_ok: true, note: "" } }) })).decision).toBe("manual_review");
    expect(assess(base({ meta: meta({ dateOriginal: "July 1969" }) })).decision).toBe("manual_review");
    expect(assess(base({ meta: meta({ dateOriginal: "" }) })).decision).toBe("manual_review");
    expect(assess(base({ externalSources: [] })).decision).toBe("manual_review");
    expect(assess(base({ draft: draft({ description: words(35) + " im Jahr 1969" }) })).decision).toBe("manual_review");
    expect(assess(base({ draft: draft({ explanation_what: words(20) }) })).decision).toBe("manual_review");
    expect(assess(base({ draft: draft({ insufficient: true }) })).decision).toBe("manual_review");
    expect(assess(base({ draft: null })).decision).toBe("manual_review");
    expect(assess(base({ meta: meta({ license: "CC BY-SA 4.0", copyrighted: true }) })).decision).toBe("manual_review");
  });
});

const cand = (n: number, over: Partial<Candidate> = {}): Candidate => ({
  sourceId: `Q${n}`,
  date: "1969-07-20",
  commonsFile: `Test${n}.jpg`,
  articleUrl: `https://de.wikipedia.org/wiki/Test_${n}`,
  articleTitle: `Test ${n}`,
  ...over,
});
function fakeDeps(over: Partial<Deps> = {}, m: Partial<CommonsMeta> = {}): Deps {
  let n = 0;
  return {
    commonsMeta: async (f) => meta({ file: f, pageUrl: `https://commons.wikimedia.org/wiki/File:${f}`, ...m }),
    wikipediaInfo: async (u) => ({ title: decodeURIComponent(u.split("/wiki/").pop()!), url: u, extract: "Auszug", externalLinks: ["https://www.nasa.gov/x"] }),
    reachable: async () => true,
    previewJpegBase64: async () => "AAAA",
    storeImage: async () => ({ id: `imtest${++n}`, ext: "webp", width: 2000, height: 1333 }),
    draft: async () => draft(),
    ...over,
  };
}

describe("Kandidatenverarbeitung", () => {
  it("legt auto-freigegebene Ereignisse mit Prüfprotokoll an und verhindert Dubletten", async () => {
    const db = await createMemoryDb();
    const o = await processCandidate(db, cand(1), fakeDeps());
    expect(o.decision).toBe("auto_approved");
    const ev = (await db.one<Record<string, unknown>>("select * from events where source_id = 'Q1'"))!;
    expect(ev.status).toBe("freigegeben");
    expect(ev.image_status).toBe("freigegeben");
    expect(ev.pipeline_state).toBe("auto_approved");
    expect((ev.audit as unknown[]).length).toBeGreaterThan(5);
    expect(ev.image_license).toBe("Public domain");
    expect(String(ev.image_credit_full)).toContain("Wikimedia Commons");
    // gleicher Kandidat / gleiche Bilddatei unter anderer Q-Nummer
    expect((await processCandidate(db, cand(1), fakeDeps())).decision).toBe("uebersprungen");
    const dupImage = await processCandidate(db, cand(2, { commonsFile: "Test1.jpg" }), fakeDeps());
    expect(dupImage.decision).toBe("rejected");
    expect((await db.one<{ n: number }>("select count(*)::int as n from events"))!.n).toBe(1);
  });
  it("lehnt problematische Lizenzen ohne KI-Aufruf ab und merkt sich den Kandidaten", async () => {
    const db = await createMemoryDb();
    let aiCalls = 0;
    const o = await processCandidate(db, cand(3), fakeDeps({ draft: async () => (aiCalls++, draft()) }, { license: "CC BY-NC 4.0", copyrighted: true }));
    expect(o.decision).toBe("rejected");
    expect(aiCalls).toBe(0);
    expect((await db.one<{ n: number }>("select count(*)::int as n from events"))!.n).toBe(0);
    expect((await processCandidate(db, cand(3), fakeDeps())).decision).toBe("uebersprungen");
  });
  it("legt Zweifelsfälle als Entwurf zur manuellen Prüfung an (Personen sichtbar)", async () => {
    const db = await createMemoryDb();
    const deps = fakeDeps({ draft: async () => draft({ image_check: { matches_event: "yes", persons_visible: true, caption_or_date_visible: false, quality_ok: true, note: "" } }) });
    expect((await processCandidate(db, cand(4), deps)).decision).toBe("manual_review");
    const ev = (await db.one<{ status: string; image_status: string; checks: object }>("select status, image_status, checks from events where source_id = 'Q4'"))!;
    expect(ev).toMatchObject({ status: "entwurf", image_status: "zu_pruefen", checks: {} });
    expect((await poolEvents(db)).length).toBe(0);
  });
  it("legt nichts an, wenn Quellen-APIs ausfallen oder der Text-Dienst fehlt – und merkt sich den Kandidaten nicht", async () => {
    const db = await createMemoryDb();
    await expect(processCandidate(db, cand(5), fakeDeps({ commonsMeta: async () => { throw new Error("Commons-API: HTTP 503"); } }))).rejects.toThrow("503");
    expect((await processCandidate(db, cand(6), fakeDeps({ draft: () => null }))).decision).toBe("uebersprungen");
    expect((await db.one<{ n: number }>("select count(*)::int as n from events"))!.n).toBe(0);
    expect((await db.one<{ n: number }>("select count(*)::int as n from pipeline_seen"))!.n).toBe(0);
    expect((await processCandidate(db, cand(7), fakeDeps({ wikipediaInfo: async () => null }))).decision).toBe("rejected");
  });
});

const cats = ["politik", "technik", "sport", "gesellschaft", "kultur", "wissenschaft", "wirtschaft"];
async function poolEvent(db: Awaited<ReturnType<typeof createMemoryDb>>, i: number, over = {}) {
  const e = await createEvent(db, eventInput({ category: cats[i % cats.length], correct_year: 1910 + ((i * 17) % 100), difficulty: i % 3 === 0 ? 3 : 1, image_status: "freigegeben", image_is_placeholder: false, is_demo: false, ...over }));
  await db.run("update events set status = 'freigegeben' where id = $1", [e.id]);
  return e;
}

describe("Paketplanung und Vorrat", () => {
  it("plant nur aus dem geprüften Pool, nie mit Ungeprüftem aufgefüllt", async () => {
    const db = await createMemoryDb();
    for (let i = 0; i < 12; i++) await poolEvent(db, i);
    await poolEvent(db, 20, { image_status: "zu_pruefen" }); // Bild nicht freigegeben
    await poolEvent(db, 21, { homepage_showcase: true }); // Startseite
    const r = await planPacks(db, { days: 3, now: NOON });
    expect(r.planned).toHaveLength(2); // 12 Ereignisse = 2 Pakete; Tag 3 fehlt
    expect(r.missing).toHaveLength(1);
    expect(r.stock).toBe(2);
    const used = await db.query<{ slug: string; image_status: string; homepage_showcase: boolean }>(
      "select e.slug, e.image_status, e.homepage_showcase from daily_pack_events pe join events e on e.id = pe.event_id",
    );
    expect(used).toHaveLength(10);
    expect(used.every((u) => u.image_status === "freigegeben" && !u.homepage_showcase)).toBe(true);
    // wiederholter Lauf ändert nichts
    const again = await planPacks(db, { days: 3, now: NOON });
    expect(again.planned).toEqual([]);
    expect((await db.one<{ n: number }>("select count(*)::int as n from daily_packs"))!.n).toBe(2);
  });
  it("wählt unterschiedliche Themenfelder und verwendet kein Ereignis zweimal", async () => {
    const db = await createMemoryDb();
    for (let i = 0; i < 35; i++) await poolEvent(db, i);
    await planPacks(db, { days: 7, now: NOON });
    const rows = await db.query<{ pack_id: string; category: string; event_id: string }>("select pe.pack_id, e.category, pe.event_id from daily_pack_events pe join events e on e.id = pe.event_id");
    expect(new Set(rows.map((r) => r.event_id)).size).toBe(35);
    for (const id of new Set(rows.map((r) => r.pack_id))) expect(new Set(rows.filter((r) => r.pack_id === id).map((r) => r.category)).size).toBeGreaterThanOrEqual(3);
  });
});

describe("Sperre und Rückzug", () => {
  it("sperrt Ereignisse sofort, nimmt künftige Pakete zurück und entfernt sie aus der Startseite", async () => {
    const db = await createMemoryDb();
    const evs = [];
    for (let i = 0; i < 6; i++) evs.push(await poolEvent(db, i));
    await planPacks(db, { days: 1, now: NOON });
    const packEvent = (await db.one<{ event_id: string }>("select pe.event_id from daily_pack_events pe join daily_packs p on p.id = pe.pack_id where p.pack_date = '2026-11-08'"))!;
    // heutiges Paket ist aktiv: Sperre ändert das Paket nicht, Ereignis ist aber gesperrt (Bildauslieferung endet)
    await blockEvent(db, packEvent.event_id, "Bildrechte widerrufen");
    expect((await db.one<{ blocked: boolean }>("select blocked from events where id = $1", [packEvent.event_id]))!.blocked).toBe(true);
    // Startseiten-Ereignis wird nach Sperre nicht mehr gezeigt
    const s = await poolEvent(db, 30, { homepage_showcase: true });
    expect((await getShowcase(db, NOON)).hero.map((h) => h.slug)).toContain(s.slug);
    await blockEvent(db, s.id, "Fehler im Text");
    expect((await getShowcase(db, NOON)).hero).toEqual([]);
    await expect(blockEvent(db, s.id, "")).rejects.toMatchObject({ code: "GRUND_FEHLT" });
    const stats = await pipelineStats(db, NOON);
    expect(stats.blocked).toBe(2);
    expect(stats.stock).toBeGreaterThanOrEqual(0);
  });
});
