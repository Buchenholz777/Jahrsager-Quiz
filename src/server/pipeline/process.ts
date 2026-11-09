import { findTimeHints } from "@/lib/hints";
import type { Queryable } from "../db/client";
import type { AuditEntry, EventInput, EventRow, Source } from "../types";
import { createEvent, emptyEventInput } from "../services/events";
import { draftCard, type CardDraft } from "./ai";
import { assess, type Assessment } from "./evaluate";
import type { CommonsMeta } from "./license";
import { auditEntry } from "./license";
import { allowedSource, type Candidate, type WikiInfo } from "./sources";

/** Austauschbare Abhängigkeiten (Netzwerk, Bildverarbeitung, KI) – in Tests durch Attrappen ersetzt. */
export interface Deps {
  commonsMeta(file: string): Promise<CommonsMeta | null>;
  wikipediaInfo(url: string): Promise<WikiInfo | null>;
  reachable(url: string): Promise<boolean>;
  /** lädt das Bild, liefert JPEG (≤ 1024 px) für die Bildkontrolle */
  previewJpegBase64(meta: CommonsMeta): Promise<string>;
  /** verarbeitet und speichert das Bild (Metadaten entfernt, WebP-Varianten) */
  storeImage(meta: CommonsMeta): Promise<{ id: string; ext: string; width: number; height: number }>;
  draft(input: { title: string; date: string; extract: string; imageJpegBase64: string }): Promise<CardDraft> | null;
}

export type Outcome = { sourceId: string; decision: Assessment["decision"] | "uebersprungen" | "fehler"; reason: string; slug?: string };

const slugify = (s: string) =>
  s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

async function markSeen(db: Queryable, id: string, decision: string, reason: string) {
  await db.run(
    "insert into pipeline_seen(source_id, decision, reason) values ($1, $2, $3) on conflict (source_id) do update set decision = $2, reason = $3, seen_at = now()",
    [id, decision, reason.slice(0, 1000)],
  );
}

/** Prüft einen Kandidaten vollständig und legt ihn je nach Entscheidung als freigegeben / zur manuellen Prüfung an. */
export async function processCandidate(db: Queryable, c: Candidate, deps: Deps): Promise<Outcome> {
  const known = await db.one("select 1 from pipeline_seen where source_id = $1 union all select 1 from events where source_id = $1", [c.sourceId]);
  if (known) return { sourceId: c.sourceId, decision: "uebersprungen", reason: "bereits bekannt" };

  const meta = await deps.commonsMeta(c.commonsFile);
  const wiki = await deps.wikipediaInfo(c.articleUrl);
  if (!meta || !wiki) {
    await markSeen(db, c.sourceId, "rejected", "Bild- oder Artikeldaten nicht abrufbar");
    return { sourceId: c.sourceId, decision: "rejected", reason: "Bild- oder Artikeldaten nicht abrufbar" };
  }

  const dup = await db.one<{ slug: string }>("select slug from events where image_source_url = $1 or source_id = $2", [meta.pageUrl, c.sourceId]);
  const external: string[] = [];
  for (const u of wiki.externalLinks.filter(allowedSource).slice(0, 4)) {
    if (external.length >= 2) break;
    if (await deps.reachable(u)) external.push(u);
  }

  // Vorab ohne KI: harte Ablehnungen kosten keine Tokens.
  const pre = assess({ eventDate: c.date, meta, wikipediaUrl: c.articleUrl, externalSources: external, draft: null, duplicate: dup?.slug ?? null });
  if (pre.decision === "rejected") {
    await markSeen(db, c.sourceId, "rejected", pre.reasons.join(" | "));
    return { sourceId: c.sourceId, decision: "rejected", reason: pre.reasons.join(" | ") };
  }

  let draft: CardDraft | null = null;
  const pending = deps.draft({ title: wiki.title, date: c.date, extract: wiki.extract, imageJpegBase64: await deps.previewJpegBase64(meta) });
  if (pending) draft = await pending;
  const a = assess({ eventDate: c.date, meta, wikipediaUrl: c.articleUrl, externalSources: external, draft, duplicate: null });
  if (a.decision === "rejected") {
    await markSeen(db, c.sourceId, "rejected", a.reasons.join(" | "));
    return { sourceId: c.sourceId, decision: "rejected", reason: a.reasons.join(" | ") };
  }
  if (!draft) {
    // Ohne Textentwurf (kein API-Schlüssel) wird nichts angelegt; der Kandidat bleibt unbekannt und wird später erneut geprüft.
    return { sourceId: c.sourceId, decision: "uebersprungen", reason: "kein Textentwurf (ANTHROPIC_API_KEY fehlt)" };
  }

  const img = await deps.storeImage(meta);
  const year = +c.date.slice(0, 4);
  const sources: Source[] = [
    { label: `Wikipedia (de): ${wiki.title}`, url: c.articleUrl },
    ...external.map((u) => ({ label: new URL(u).hostname.replace(/^www\./, ""), url: u })),
    { label: `Wikidata ${c.sourceId}`, url: `https://www.wikidata.org/wiki/${c.sourceId}` },
  ];
  const credit = [meta.artist, meta.credit].filter(Boolean).join(" / ");
  const creditShort = [meta.artist || meta.credit, meta.license].filter(Boolean).join(" · ").slice(0, 80);
  const auto = a.decision === "auto_approved";
  const input: EventInput = {
    ...emptyEventInput(),
    slug: `${slugify(wiki.title)}-${year}`,
    category: draft.category,
    difficulty: draft.difficulty,
    neutral_title: draft.neutral_title,
    description: draft.description,
    image_alt: draft.image_alt,
    image_credit_short: findTimeHints(creditShort).length ? "Wikimedia Commons" : creditShort,
    correct_year: year,
    exact_date: c.date,
    photo_date: meta.dateOriginal.slice(0, 40) || null,
    public_title: draft.public_title,
    explanation_what: draft.explanation_what,
    explanation_why: draft.explanation_why,
    explanation_detail: draft.explanation_detail,
    sources,
    image_id: img.id,
    image_ext: img.ext,
    image_width: img.width,
    image_height: img.height,
    image_photographer: meta.artist,
    image_institution: meta.credit,
    image_credit_full: `${credit}${credit ? ", " : ""}${meta.license}, über Wikimedia Commons`,
    image_license: meta.license,
    image_license_url: meta.licenseUrl,
    image_source_url: meta.pageUrl,
    image_edits: "Automatischer Import: skaliert auf max. 2000 px Breite, in WebP konvertiert, Metadaten entfernt.",
    checks: auto ? { rights: true, facts: true, photoMatchesEvent: true } : {},
    image_status: auto ? "freigegeben" : "zu_pruefen",
  };
  let ev: EventRow;
  try {
    ev = await createEvent(db, input, auto ? "Automatisch recherchiert und freigegeben" : "Automatisch recherchiert (manuelle Prüfung)");
  } catch {
    input.slug = `${input.slug}-${c.sourceId.toLowerCase()}`;
    ev = await createEvent(db, input, "Automatisch recherchiert");
  }
  const audit: AuditEntry[] = [auditEntry("recherche", "info", ["Quelle: Wikidata + Wikimedia Commons + Wikipedia (de)"], { sourceId: c.sourceId, commons: meta.pageUrl }), ...a.audit];
  await db.run(
    "update events set pipeline_state = $2, source_id = $3, audit = $4::jsonb, status = $5 where id = $1",
    [ev.id, a.decision, c.sourceId, JSON.stringify(audit), auto ? "freigegeben" : "entwurf"],
  );
  await markSeen(db, c.sourceId, a.decision, a.reasons.join(" | "));
  return { sourceId: c.sourceId, decision: a.decision, reason: a.reasons.join(" | "), slug: ev.slug };
}

export { draftCard };
