import { describe, expect, it } from "vitest";
import { checkSignificance, significanceProblemsForApproval } from "@/lib/bedeutung";
import { createMemoryDb } from "@/server/db/client";
import type { CardDraft } from "@/server/pipeline/ai";
import { assess, type AssessInput } from "@/server/pipeline/evaluate";
import type { CommonsMeta } from "@/server/pipeline/license";
import { processCandidate, type Deps } from "@/server/pipeline/process";
import type { Candidate } from "@/server/pipeline/sources";
import { createEvent, transitionEvent } from "@/server/services/events";
import { putImage } from "@/server/storage";
import { eventInput } from "./helpers";

const words = (n: number) => Array.from({ length: n }, (_, i) => "wort" + String.fromCharCode(97 + (i % 26))).join(" ");

const meta = (date: string, over: Partial<CommonsMeta> = {}): CommonsMeta => ({
  file: "Foto.jpg",
  pageUrl: "https://commons.wikimedia.org/wiki/File:Foto.jpg",
  url: "https://upload.wikimedia.org/x/Foto.jpg",
  width: 3000,
  height: 2000,
  mime: "image/jpeg",
  license: "CC0",
  licenseUrl: "",
  artist: "Nationalarchiv",
  credit: "Archiv",
  dateOriginal: date,
  copyrighted: false,
  restrictions: "",
  categories: [],
  ...over,
});

type Sig = NonNullable<CardDraft["significance"]>;
const draft = (sig: Partial<Sig>, spec: "ereignisspezifisch" | "generisch" | "unklar" = "ereignisspezifisch"): CardDraft => ({
  insufficient: false,
  category: "politik",
  difficulty: 2,
  subcategory: "Wahlen",
  tags: ["wahl", "demokratie"],
  region: "afrika",
  country: "Südafrika",
  topic_key: "wahl",
  neutral_title: "Menschen warten geduldig an einem Ort",
  description: words(35),
  image_alt: "Schwarzweißfoto: ein Ort",
  public_title: "Ereignis",
  explanation_what: words(70),
  explanation_why: words(20),
  explanation_detail: words(12),
  significance: { verdict: "weltgeschichtlich", reason: "Die Wahl beendete die Herrschaft der Rassentrennung und machte Südafrika erstmals zu einer Demokratie für alle Bürger.", cross_border_effects: true, year_unambiguous: true, ...sig },
  image_check: { matches_event: "yes", specificity: spec, persons_visible: false, caption_or_date_visible: false, quality_ok: true, note: "" },
});

const input = (date: string, d: CardDraft, over: Partial<AssessInput> = {}): AssessInput => ({
  eventDate: date,
  meta: meta(date),
  wikipediaUrl: "https://de.wikipedia.org/wiki/X",
  externalSources: ["https://www.sahistory.org.za/a", "https://www.nelsonmandela.org/b"],
  draft: d,
  duplicate: null,
  sitelinks: 90,
  ...over,
});

describe("Weltgeschichtliche Bedeutung: Abnahmefälle (Erstellungsfluss)", () => {
  it("1) Historische Wahl (Südafrika 1994) mit belegtem Jahr und ereignisspezifischem Motiv besteht", () => {
    const a = assess(input("1994-04-27", draft({})));
    expect(a.decision).toBe("auto_approved");
    expect(a.bedeutung?.reason).toContain("Rassentrennung");
    expect(a.audit.find((x) => x.step === "bedeutung")!.decision).toBe("ok");
  });

  it("2) Dieselbe Wahl mit beliebigem Wahllokal-Foto scheitert an der Bildprüfung", () => {
    const a = assess(input("1994-04-27", draft({}, "generisch")));
    expect(a.decision).toBe("rejected");
    expect(a.reasons.join(" ")).toContain("Bildprüfung");
    expect(a.reasons.join(" ")).toContain("austauschbar");
  });

  it("3a) Routinemäßige Wahl scheitert an der Relevanzprüfung", () => {
    const a = assess(input("2013-09-22", draft({ verdict: "nicht_weltgeschichtlich", reason: "Routinemäßige Landtagswahl ohne Folgen über das Land hinaus.", cross_border_effects: false }), { sitelinks: 18 }));
    expect(a.decision).toBe("rejected");
    expect(a.reasons.join(" ")).toContain("Relevanzprüfung");
  });

  it("3b) Gewöhnlicher Sturm scheitert an der Relevanzprüfung (auch schon an der geringen internationalen Beachtung)", () => {
    const a = assess(input("2007-01-18", draft({ verdict: "nicht_weltgeschichtlich", reason: "Gewöhnlicher Sturm ohne internationale Tragweite.", cross_border_effects: false }), { sitelinks: 6 }));
    expect(a.decision).toBe("rejected");
    expect(a.reasons.join(" ")).toMatch(/Sprachversionen|Keine weltgeschichtliche Bedeutung/);
    // vor jeder KI-Prüfung aussortiert: kein Textentwurf nötig
    expect(assess(input("2007-01-18", null as unknown as CardDraft, { draft: null, sitelinks: 6 })).decision).toBe("rejected");
  });

  it("4) Naturereignis mit nachweisbaren internationalen Folgen (Tsunami 2004) und belegtem Motiv besteht", () => {
    const a = assess(input("2004-12-26", draft({ reason: "Der Tsunami im Indischen Ozean forderte rund 230.000 Todesopfer in vierzehn Ländern und löste die größte internationale Katastrophenhilfe seiner Zeit aus." }, "ereignisspezifisch"), { sitelinks: 140 }));
    expect(a.decision).toBe("auto_approved");
  });

  it("5) Kurzfristig weltweites Medienecho ohne belegbare Bedeutung scheitert bzw. wird nicht freigegeben", () => {
    // KI urteilt eindeutig: nicht weltgeschichtlich => abgelehnt
    expect(assess(input("2015-03-12", draft({ verdict: "nicht_weltgeschichtlich", reason: "Virales Ereignis mit kurzem weltweitem Medienecho ohne bleibende Folgen." }), { sitelinks: 40 })).decision).toBe("rejected");
    // KI behauptet Bedeutung, begründet aber nur mit Medienecho => nie automatisch
    const weak = assess(input("2015-03-12", draft({ reason: "Das Ereignis sorgte weltweit für großes Medienecho und war monatelang in allen Schlagzeilen." }), { sitelinks: 70 }));
    expect(weak.decision).toBe("manual_review");
    expect(weak.reasons.join(" ")).toContain("Medienecho");
  });

  it("6) Mehrdeutiges Jahr oder fehlende Quellen werden zur redaktionellen Prüfung zurückgestellt", () => {
    const ambiguous = assess(input("1994-04-27", draft({ year_unambiguous: false })));
    expect(ambiguous.decision).toBe("manual_review");
    expect(ambiguous.reasons.join(" ")).toContain("Jahr nicht eindeutig");
    const noSources = assess(input("1994-04-27", draft({}), { externalSources: [] }));
    expect(noSources.decision).toBe("manual_review");
    expect(noSources.reasons.join(" ")).toContain("Faktenquellen");
    // unklare Bedeutung ebenfalls
    expect(assess(input("1994-04-27", draft({ verdict: "unklar" }))).decision).toBe("manual_review");
  });

  it("KI allein genügt nicht: wenig internationale Beachtung verhindert die automatische Freigabe trotz positivem Urteil", () => {
    const a = assess(input("1994-04-27", draft({}), { sitelinks: 14 }));
    expect(a.decision).toBe("manual_review");
    expect(a.reasons.join(" ")).toContain("Sprachversionen");
    // ohne Angabe der Sprachversionen ebenfalls keine automatische Freigabe
    expect(assess(input("1994-04-27", draft({}), { sitelinks: undefined })).decision).toBe("manual_review");
  });
});

describe("Weltgeschichtliche Bedeutung: Redaktion (Freigabe)", () => {
  it("manuelle Freigabe verlangt die Begründung und verweigert nicht-weltgeschichtliche oder zweifelhafte Einträge", async () => {
    const db = await createMemoryDb();
    const mk = async (research: object) => {
      const e = await createEvent(db, eventInput({ is_demo: false, image_is_placeholder: false, image_id: `phbed${Math.random().toString(36).slice(2, 8)}`, research } as never));
      await putImage(`${e.image_id}.${e.image_ext}`, Buffer.alloc(4000, 1), "image/webp");
      await transitionEvent(db, e.id, "in_pruefung");
      return e;
    };
    const none = await mk({});
    await expect(transitionEvent(db, none.id, "freigegeben")).rejects.toMatchObject({ code: "FREIGABE_VERWEIGERT", message: expect.stringContaining("Bedeutung") });
    const no = await mk({ bedeutung: { verdict: "nicht_weltgeschichtlich", reason: "Gewöhnlicher lokaler Sturm ohne internationale Tragweite für die Welt." } });
    await expect(transitionEvent(db, no.id, "freigegeben")).rejects.toMatchObject({ message: expect.stringContaining("nicht weltgeschichtlich") });
    const weak = await mk({ bedeutung: { verdict: "weltgeschichtlich", reason: "Das Ereignis war sehr bekannt und sorgte weltweit für großes Medienecho." } });
    await expect(transitionEvent(db, weak.id, "freigegeben")).rejects.toMatchObject({ message: expect.stringContaining("Medienecho") });
    const good = await mk({ bedeutung: { verdict: "weltgeschichtlich", reason: "Der Fall der Mauer beendete die Teilung Europas und besiegelte das Ende des Kalten Krieges.", checkedBy: "admin" } });
    expect((await transitionEvent(db, good.id, "freigegeben")).status).toBe("freigegeben");
  });

  it("Regelmodul: konkrete Begründung nötig, Hinweise nennen den Grund", () => {
    expect(significanceProblemsForApproval(null)[0]).toContain("nicht erfasst");
    expect(significanceProblemsForApproval({ verdict: "weltgeschichtlich", reason: "zu kurz" }).join(" ")).toContain("zu kurz");
    expect(significanceProblemsForApproval({ verdict: "weltgeschichtlich", reason: "Die Landung veränderte weltweit das Verständnis menschlicher Möglichkeiten." })).toEqual([]);
    expect(checkSignificance({ verdict: "weltgeschichtlich", reason: "Konkrete Folge über Ländergrenzen hinweg für viele Staaten.", sitelinks: 50 }).result).toBe("ok");
  });
});

describe("Erstellungsfluss: Prüfung, Ablehnung und Speicherung der Begründung", () => {
  const cand = (n: number, sitelinks: number): Candidate => ({ sourceId: `Q${n}`, date: "1994-04-27", commonsFile: `T${n}.jpg`, articleUrl: `https://de.wikipedia.org/wiki/T${n}`, articleTitle: `T ${n}`, sitelinks });
  const deps = (d: CardDraft): Deps => ({
    commonsMeta: async () => meta("1994-04-27"),
    wikipediaInfo: async () => ({ title: "Wahl", url: "https://de.wikipedia.org/wiki/Wahl", extract: words(100), externalLinks: ["https://www.bpb.de/a", "https://www.loc.gov/b"] }),
    reachable: async () => true,
    previewJpegBase64: async () => "AA==",
    storeImage: async () => ({ id: "imgbed", ext: "webp", width: 2000, height: 1300 }),
    draft: async () => d,
  });

  it("akzeptiert: weltgeschichtliche Wahl wird freigegeben und die Begründung gespeichert (für die Auflösung)", async () => {
    const db = await createMemoryDb();
    const o = await processCandidate(db, cand(1, 95), deps(draft({})));
    expect(o.decision).toBe("auto_approved");
    const row = (await db.one<{ research: { bedeutung: { reason: string; verdict: string; sitelinks: number } }; status: string }>("select research, status from events where source_id = 'Q1'"))!;
    expect(row.status).toBe("freigegeben");
    expect(row.research.bedeutung).toMatchObject({ verdict: "weltgeschichtlich", sitelinks: 95 });
    expect(row.research.bedeutung.reason).toContain("Rassentrennung");
  });

  it("lehnt ab: beliebiges Motiv; der Grund steht in der Rechercheliste (pipeline_seen)", async () => {
    const db = await createMemoryDb();
    const o = await processCandidate(db, cand(2, 95), deps(draft({}, "generisch")));
    expect(o.decision).toBe("rejected");
    const seen = (await db.one<{ decision: string; reason: string }>("select decision, reason from pipeline_seen where source_id = 'Q2'"))!;
    expect(seen.decision).toBe("rejected");
    expect(seen.reason).toContain("Bildprüfung");
    expect(await db.one("select 1 from events where source_id = 'Q2'")).toBeNull();
  });

  it("stellt zurück: mehrdeutiges Jahr landet als Entwurf mit Grund im Prüfprotokoll", async () => {
    const db = await createMemoryDb();
    const o = await processCandidate(db, cand(3, 95), deps(draft({ year_unambiguous: false })));
    expect(o.decision).toBe("manual_review");
    const ev = (await db.one<{ status: string; audit: { step: string; rules: string[] }[] }>("select status, audit from events where source_id = 'Q3'"))!;
    expect(ev.status).toBe("entwurf");
    expect(ev.audit.find((a) => a.step === "bedeutung")!.rules.join(" ")).toContain("Jahr nicht eindeutig");
  });
});
