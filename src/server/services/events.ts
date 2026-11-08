import { CATEGORY_KEYS, type EventStatus } from "@/lib/constants";
import { findTimeHints } from "@/lib/hints";
import type { Queryable } from "../db/client";
import { AppError, EDITABLE_FIELDS, type EventInput, type EventRow } from "../types";

const JSON_COLUMNS = new Set(["sources", "checks", "research"]);

export async function getEvent(db: Queryable, id: string): Promise<EventRow | null> {
  return db.one<EventRow>("select * from events where id = $1", [id]);
}

export async function getEventBySlug(db: Queryable, slug: string): Promise<EventRow | null> {
  return db.one<EventRow>("select * from events where slug = $1", [slug]);
}

export async function listEvents(db: Queryable, status?: EventStatus): Promise<EventRow[]> {
  if (status) return db.query<EventRow>("select * from events where status = $1 order by updated_at desc", [status]);
  return db.query<EventRow>("select * from events order by updated_at desc");
}

/** Inhalt einer bestimmten Fassung (Partien behalten die Fassung, mit der sie begonnen wurden). */
export async function getEventVersion(db: Queryable, id: string, version: number): Promise<EventRow> {
  const row = await db.one<{ snapshot: EventRow }>("select snapshot from event_revisions where event_id = $1 and version = $2", [id, version]);
  if (!row) throw new AppError("FASSUNG_FEHLT", "Ereignisfassung nicht gefunden", 500);
  return row.snapshot;
}

function pickInput(e: EventInput | EventRow): EventInput {
  const out: Record<string, unknown> = {};
  for (const f of EDITABLE_FIELDS) out[f] = (e as unknown as Record<string, unknown>)[f];
  return out as unknown as EventInput;
}

export async function createEvent(db: Queryable, input: EventInput, note = "Angelegt"): Promise<EventRow> {
  const cols = EDITABLE_FIELDS;
  const values = cols.map((c) => (JSON_COLUMNS.has(c) ? JSON.stringify(input[c] ?? (c === "sources" ? [] : {})) : input[c]));
  const placeholders = cols.map((c, i) => (JSON_COLUMNS.has(c) ? `$${i + 1}::jsonb` : `$${i + 1}`));
  try {
    const row = await db.one<EventRow>(`insert into events (${cols.join(",")}) values (${placeholders.join(",")}) returning *`, values);
    await db.run("insert into event_revisions(event_id, version, snapshot, note) values ($1, 1, $2::jsonb, $3)", [row!.id, JSON.stringify(row), note]);
    return row!;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new AppError("SLUG_BELEGT", "Dieser Slug ist bereits vergeben.", 409);
    throw e;
  }
}

/**
 * Speichert Änderungen. Jede inhaltliche Änderung erzeugt eine neue Fassung samt Revision.
 * Bei eingeplanten/veröffentlichten Ereignissen ist eine Änderungsnotiz Pflicht.
 */
export async function updateEvent(db: Queryable, id: string, input: EventInput, note = ""): Promise<EventRow> {
  const current = await getEvent(db, id);
  if (!current) throw new AppError("NICHT_GEFUNDEN", "Ereignis nicht gefunden", 404);
  if (input.homepage_showcase && !current.homepage_showcase) {
    const inPack = await db.one("select 1 from daily_pack_events where event_id = $1", [id]);
    if (inPack) throw new AppError("IN_PAKET", "Das Ereignis steckt in einem Tagespaket und kann nicht für die Startseite freigegeben werden.", 409);
  }
  const before = JSON.stringify(pickInput(current));
  const after = JSON.stringify(pickInput(input));
  if (before === after) return current;
  const live = current.status === "eingeplant" || current.status === "veroeffentlicht";
  if (live && note.trim().length < 5) {
    throw new AppError("NOTIZ_FEHLT", "Für eingeplante oder veröffentlichte Ereignisse ist eine Änderungsnotiz erforderlich.");
  }
  const cols = EDITABLE_FIELDS;
  const sets = cols.map((c, i) => `${c} = ${JSON_COLUMNS.has(c) ? `$${i + 1}::jsonb` : `$${i + 1}`}`);
  const values = cols.map((c) => (JSON_COLUMNS.has(c) ? JSON.stringify(input[c]) : input[c]));
  try {
    const row = await db.one<EventRow>(
      `update events set ${sets.join(", ")}, version = version + 1, updated_at = now() where id = $${cols.length + 1} returning *`,
      [...values, id],
    );
    await db.run("insert into event_revisions(event_id, version, snapshot, note) values ($1, $2, $3::jsonb, $4)", [
      id,
      row!.version,
      JSON.stringify(row),
      note || "Bearbeitet",
    ]);
    return row!;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new AppError("SLUG_BELEGT", "Dieser Slug ist bereits vergeben.", 409);
    throw e;
  }
}

export async function listRevisions(db: Queryable, id: string) {
  return db.query<{ version: number; note: string; created_at: Date | string }>(
    "select version, note, created_at from event_revisions where event_id = $1 order by version desc",
    [id],
  );
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Zeitliche Hinweise in allen Feldern, die vor dem Tipp sichtbar sind. */
export function preTipHints(
  e: Pick<EventRow, "neutral_title" | "description" | "image_alt" | "image_credit_short" | "image_license" | "image_license_url">,
) {
  const fields: [string, string][] = [
    ["Neutrale Überschrift", e.neutral_title],
    ["Beschreibung", e.description],
    ["Alternativtext", e.image_alt],
    ["Kurz-Bildnachweis", e.image_credit_short],
    ["Lizenzangabe", e.image_license],
    ["Lizenz-URL", e.image_license_url],
  ];
  return fields.flatMap(([label, text]) => findTimeHints(text ?? "").map((h) => `${label}: Zeitlicher Hinweis „${h.match}“ (${h.kind})`));
}

export function eventProblems(e: EventRow, stage: "review" | "approval"): string[] {
  const p: string[] = [];
  const req: [keyof EventRow, string][] = [
    ["neutral_title", "Neutrale Überschrift"],
    ["description", "Beschreibung vor dem Tipp"],
    ["image_alt", "Alternativtext"],
    ["public_title", "Titel der Auflösung"],
    ["explanation_what", "Auflösung: Was geschah?"],
    ["explanation_why", "Auflösung: Warum bedeutsam?"],
    ["explanation_detail", "Auflösung: Detail"],
  ];
  for (const [k, label] of req) if (!String(e[k] ?? "").trim()) p.push(`${label} fehlt.`);
  if (!CATEGORY_KEYS.includes(e.category as never)) p.push("Themenfeld fehlt.");
  if (!e.image_id) p.push("Es ist kein Bild hinterlegt.");
  if (!e.sources?.length) p.push("Mindestens eine Faktenquelle ist erforderlich.");
  const words = wordCount(e.description);
  if (e.description.trim() && (words < 20 || words > 90)) p.push(`Beschreibung hat ${words} Wörter (Richtwert 30–55).`);
  p.push(...preTipHints(e));
  if (stage === "approval") {
    if (!e.checks?.rights) p.push("Bildrechte sind nicht als geprüft bestätigt.");
    if (!e.checks?.facts) p.push("Fakten und Ereignisjahr sind nicht als geprüft bestätigt.");
    if (!e.checks?.photoMatchesEvent) p.push("Die Zuordnung von Foto und Ereignis (Aufnahmedatum) ist nicht bestätigt.");
    if (e.image_status !== "freigegeben") p.push(`Das Bild ist nicht redaktionell freigegeben (Bildstatus: ${e.image_status}).`);
    if (!e.image_credit_full.trim()) p.push("Vollständiger Bildnachweis fehlt.");
    if (!e.image_license.trim()) p.push("Bildlizenz fehlt.");
    if (!e.image_source_url.trim()) p.push("Originalfundstelle des Bildes fehlt.");
    if (!e.is_demo) {
      if (e.image_is_placeholder) p.push("Platzhalterbilder dürfen nicht für Produktionsinhalte freigegeben werden.");
      if (!e.sources.some((s) => s.url && /^https?:\/\//.test(s.url))) p.push("Mindestens eine Faktenquelle mit URL ist erforderlich.");
    }
  }
  return p;
}

const TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  entwurf: ["in_pruefung"],
  in_pruefung: ["freigegeben", "entwurf"],
  freigegeben: ["in_pruefung", "entwurf"],
  eingeplant: [], // nur über die Paketplanung
  veroeffentlicht: [],
};

export async function transitionEvent(db: Queryable, id: string, to: EventStatus): Promise<EventRow> {
  const e = await getEvent(db, id);
  if (!e) throw new AppError("NICHT_GEFUNDEN", "Ereignis nicht gefunden", 404);
  if (!TRANSITIONS[e.status].includes(to)) {
    throw new AppError("STATUS_UNZULAESSIG", `Statuswechsel ${e.status} → ${to} ist nicht erlaubt.`, 409);
  }
  if (to === "in_pruefung" && e.status === "entwurf") {
    const probs = eventProblems(e, "review");
    if (probs.length) throw new AppError("PRUEFUNG_FEHLGESCHLAGEN", probs.join(" "), 422);
  }
  if (to === "freigegeben") {
    const probs = eventProblems(e, "approval");
    if (probs.length) throw new AppError("FREIGABE_VERWEIGERT", probs.join(" "), 422);
  }
  return (await db.one<EventRow>("update events set status = $2, updated_at = now() where id = $1 returning *", [id, to]))!;
}

export function emptyEventInput(): EventInput {
  return {
    slug: "",
    category: "politik",
    difficulty: 2,
    neutral_title: "",
    description: "",
    image_alt: "",
    image_credit_short: "",
    correct_year: 1950,
    exact_date: null,
    photo_date: null,
    public_title: "",
    explanation_what: "",
    explanation_why: "",
    explanation_detail: "",
    background: "",
    sources: [],
    image_id: null,
    image_ext: null,
    image_width: null,
    image_height: null,
    image_is_placeholder: false,
    image_photographer: "",
    image_institution: "",
    image_credit_full: "",
    image_license: "",
    image_license_url: "",
    image_source_url: "",
    image_edits: "",
    checks: {},
    image_status: "platzhalter",
    research: {},
    knowledge_enabled: false,
    homepage_showcase: false,
    is_demo: false,
  };
}
