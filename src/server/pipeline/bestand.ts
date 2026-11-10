import { MAX_YEAR, MIN_YEAR, ROUNDS_PER_GAME } from "@/lib/constants";
import type { Queryable } from "../db/client";

export interface BestandEvent {
  id: string;
  slug: string;
  status: string;
  category: string;
  correct_year: number;
  region: string | null;
  topic_key: string | null;
  source_id: string | null;
  exact_date: string | null;
  neutral_title: string;
  tags: unknown;
  has_image: boolean;
  has_source_url: boolean;
  is_demo: boolean;
  blocked: boolean;
  /** Begründung der weltgeschichtlichen Bedeutung (research.bedeutung.reason), soweit erfasst */
  bedeutung?: string | null;
}

export interface BestandReport {
  total: number;
  playable: number;
  /** vollständige Spiele à Rundengröße ohne Wiederholung */
  completeGames: number;
  rest: number;
  excluded: { slug: string; reason: string }[];
  duplicates: { a: string; b: string; reason: string }[];
  edgeYears: string[];
  byDecade: Record<string, number>;
  byCategory: Record<string, number>;
  byRegion: Record<string, number>;
  gaps: string[];
  /** Stichprobe spielbarer Ereignisse mit Region, Jahrzehnt, Thema und Begründung */
  sample: { slug: string; region: string; decade: string; category: string; reason: string }[];
  /** spielbare Ereignisse ohne erfasste Begründung der Bedeutung (älterer Bestand: nachträglich in der Redaktion ergänzen) */
  withoutReason: number;
}

const tagsOf = (e: BestandEvent): string[] => (Array.isArray(e.tags) ? (e.tags as string[]) : []);

/**
 * Prüfregeln für „eindeutig und spielbar“:
 *  1. Status freigegeben/eingeplant/veröffentlicht, nicht gesperrt, kein Demo-Inhalt
 *  2. echtes Foto, mindestens eine Faktenquelle mit URL
 *  3. belegtes Jahr innerhalb der Spielskala (MIN_YEAR–MAX_YEAR)
 *  4. keine Dubletten (gleiche Wikidata-ID, gleicher Themenschlüssel, gleiches Jahr mit mindestens 2 gemeinsamen Schlagwörtern)
 */
export function analyseBestand(events: BestandEvent[]): BestandReport {
  const excluded: BestandReport["excluded"] = [];
  const ok: BestandEvent[] = [];
  for (const e of events) {
    const why: string[] = [];
    if (!["freigegeben", "eingeplant", "veroeffentlicht"].includes(e.status)) why.push(`Status ${e.status}`);
    if (e.blocked) why.push("gesperrt");
    if (e.is_demo) why.push("Demo-Inhalt");
    if (!e.has_image) why.push("kein Foto");
    if (!e.has_source_url) why.push("keine Quelle mit URL");
    if (!(e.correct_year >= MIN_YEAR && e.correct_year <= MAX_YEAR)) why.push(`Jahr ${e.correct_year} außerhalb ${MIN_YEAR}–${MAX_YEAR}`);
    if (why.length) excluded.push({ slug: e.slug, reason: why.join(", ") });
    else ok.push(e);
  }
  const duplicates: BestandReport["duplicates"] = [];
  const dropped = new Set<string>();
  for (let i = 0; i < ok.length; i++) {
    for (let j = i + 1; j < ok.length; j++) {
      const a = ok[i];
      const b = ok[j];
      let reason = "";
      if (a.source_id && a.source_id === b.source_id) reason = "gleiche Wikidata-ID";
      else if (a.topic_key && a.topic_key === b.topic_key) reason = `gleicher Themenschlüssel „${a.topic_key}“`;
      else if (a.correct_year === b.correct_year && tagsOf(a).filter((t) => tagsOf(b).includes(t)).length >= 2) reason = "gleiches Jahr und mindestens 2 gemeinsame Schlagwörter";
      if (reason) {
        duplicates.push({ a: a.slug, b: b.slug, reason });
        dropped.add(b.id);
      }
    }
  }
  const unique = ok.filter((e) => !dropped.has(e.id));
  const count = (key: (e: BestandEvent) => string) => {
    const m: Record<string, number> = {};
    for (const e of unique) m[key(e)] = (m[key(e)] ?? 0) + 1;
    return m;
  };
  const byDecade = count((e) => `${Math.floor(e.correct_year / 10) * 10}er`);
  const byCategory = count((e) => e.category);
  const byRegion = count((e) => e.region || "ohne Region");
  const gaps: string[] = [];
  for (let d = Math.floor(MIN_YEAR / 10) * 10; d <= MAX_YEAR; d += 10) if (!byDecade[`${d}er`]) gaps.push(`Jahrzehnt ${d}er ohne Ereignis`);
  const withoutDate = unique.filter((e) => !e.exact_date).length;
  if (withoutDate) gaps.push(`${withoutDate} Ereignisse ohne exaktes Datum (nur Jahr belegt)`);
  const sample = [...unique]
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .filter((_, i, all) => i % Math.max(1, Math.ceil(all.length / 8)) === 0)
    .slice(0, 8)
    .map((e) => ({ slug: e.slug, region: e.region || "ohne Region", decade: `${Math.floor(e.correct_year / 10) * 10}er`, category: e.category, reason: (e.bedeutung ?? "").trim() }));
  return {
    sample,
    withoutReason: unique.filter((e) => !(e.bedeutung ?? "").trim()).length,
    total: events.length,
    playable: unique.length,
    completeGames: Math.floor(unique.length / ROUNDS_PER_GAME),
    rest: unique.length % ROUNDS_PER_GAME,
    excluded,
    duplicates,
    edgeYears: unique.filter((e) => e.correct_year <= MIN_YEAR + 2 || e.correct_year >= MAX_YEAR - 2).map((e) => `${e.slug} (${e.correct_year})`),
    byDecade,
    byCategory,
    byRegion,
    gaps,
  };
}

export async function loadBestand(db: Queryable): Promise<BestandEvent[]> {
  return db.query<BestandEvent>(
    `select id, slug, status, category, correct_year, region, topic_key, source_id, exact_date, neutral_title, tags,
       (image_id is not null and not image_is_placeholder) as has_image,
       exists (select 1 from jsonb_array_elements(sources) s where s->>'url' like 'http%') as has_source_url,
       is_demo, blocked, research->'bedeutung'->>'reason' as bedeutung
     from events`,
  );
}

export function formatBestand(r: BestandReport): string {
  const line = (m: Record<string, number>) =>
    Object.entries(m)
      .sort()
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ") || "–";
  return [
    `Fragenbestand: ${r.total} Ereignisse insgesamt, ${r.playable} eindeutig und spielbar.`,
    `Vollständige Spiele ohne Wiederholung (je ${ROUNDS_PER_GAME} Ereignisse): ${r.completeGames} (Rest ${r.rest}).`,
    `Ausgeschlossen (${r.excluded.length}): ${r.excluded.map((e) => `${e.slug} [${e.reason}]`).join("; ") || "–"}`,
    `Dubletten/Mehrdeutigkeit (${r.duplicates.length}): ${r.duplicates.map((d) => `${d.a} ~ ${d.b} (${d.reason})`).join("; ") || "–"}`,
    `Jahre am Skalenrand: ${r.edgeYears.join(", ") || "–"}`,
    `Nach Jahrzehnt: ${line(r.byDecade)}`,
    `Nach Thema: ${line(r.byCategory)}`,
    `Nach Region: ${line(r.byRegion)}`,
    `Lücken: ${r.gaps.join("; ") || "–"}`,
    `Spielbare Ereignisse ohne erfasste Begründung der weltgeschichtlichen Bedeutung: ${r.withoutReason} von ${r.playable}`,
    "Stichprobe (Region · Jahrzehnt · Thema → Begründung):",
    ...r.sample.map((s) => `  ${s.slug}: ${s.region} · ${s.decade} · ${s.category} → ${s.reason || "KEINE Begründung erfasst"}`),
  ].join("\n");
}
