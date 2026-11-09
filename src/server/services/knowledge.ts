import { todayKey, now } from "../clock";
import { demoAllowed, publishDuePacks } from "./packs";
import type { Db } from "../db/client";
import type { EventRow } from "../types";
import { KNOWLEDGE_MIN, knowledgeQuality } from "./knowledge-quality";

export type KnowledgeEvent = EventRow & { first_date: string };

/**
 * Öffentliche Wissensseiten: nur Ereignisse, die veröffentlicht sind, redaktionell für das
 * Wissensarchiv freigeschaltet wurden UND deren erstes Tagesrätsel bereits VORBEI ist (Datum < heute).
 * So verraten die Seiten nie die Lösung eines laufenden oder zukünftigen Tagesrätsels.
 */
const BASE = `select e.*, min(p.pack_date) as first_date
  from events e join daily_pack_events pe on pe.event_id = e.id join daily_packs p on p.id = pe.pack_id
  where e.status = 'veroeffentlicht' and e.knowledge_enabled and not e.blocked and p.pack_date < $1 ${"__DEMO__"}`;

function sql(extra: string, demo: boolean) {
  return `${BASE.replace("__DEMO__", demo ? "" : "and not e.is_demo")} ${extra}`;
}

export async function listKnowledge(db: Db, at: Date = now()): Promise<KnowledgeEvent[]> {
  const today = todayKey(at);
  await publishDuePacks(db, today);
  return db.query<KnowledgeEvent>(sql("group by e.id order by min(p.pack_date) desc, e.correct_year", demoAllowed()), [today]);
}

export async function getKnowledge(db: Db, slug: string, at: Date = now()): Promise<KnowledgeEvent | null> {
  const today = todayKey(at);
  await publishDuePacks(db, today);
  return db.one<KnowledgeEvent>(sql("and e.slug = $2 group by e.id", demoAllowed()), [today, slug]);
}

/** Nur Wissensseiten, die die Qualitätsschranke bestehen (Sitemap, Kategorie-Übersichten, Indexierung). */
export async function listIndexableKnowledge(db: Db, at: Date = now()): Promise<KnowledgeEvent[]> {
  return (await listKnowledge(db, at)).filter((e) => knowledgeQuality(e).indexable);
}

/** Kategorien mit genug indexierbaren Seiten für eine eigenständige Übersichtsseite. */
export function categoriesWithOverview(indexable: KnowledgeEvent[]): string[] {
  const n = new Map<string, number>();
  for (const e of indexable) n.set(e.category, (n.get(e.category) ?? 0) + 1);
  return [...n].filter(([, c]) => c >= KNOWLEDGE_MIN.listingMinPages).map(([k]) => k);
}

/** Verwandte Ereignisse nach gemeinsamen Schlagwörtern/Themenschlüssel, Themenfeld, Region und Epoche (nachvollziehbar, nicht zufällig). */
export async function relatedKnowledge(db: Db, ev: KnowledgeEvent, at: Date = now(), limit = 3): Promise<KnowledgeEvent[]> {
  const all = await listKnowledge(db, at);
  const tags = new Set(ev.tags ?? []);
  const score = (e: KnowledgeEvent) =>
    (e.topic_key && e.topic_key === ev.topic_key ? 4 : 0) +
    (e.tags ?? []).filter((t) => tags.has(t)).length * 3 +
    (e.category === ev.category ? 2 : 0) +
    (e.region && e.region === ev.region ? 1 : 0) +
    (Math.floor(e.correct_year / 10) === Math.floor(ev.correct_year / 10) ? 1 : 0) -
    Math.abs(e.correct_year - ev.correct_year) / 200;
  return all
    .filter((e) => e.id !== ev.id)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}
