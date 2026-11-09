import { todayKey, now } from "../clock";
import { demoAllowed, publishDuePacks } from "./packs";
import type { Db } from "../db/client";
import type { EventRow } from "../types";

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

export async function relatedKnowledge(db: Db, ev: KnowledgeEvent, at: Date = now(), limit = 3): Promise<KnowledgeEvent[]> {
  const all = await listKnowledge(db, at);
  const others = all.filter((e) => e.id !== ev.id);
  const same = others.filter((e) => e.category === ev.category);
  const rest = others.filter((e) => e.category !== ev.category).sort((a, b) => Math.abs(a.correct_year - ev.correct_year) - Math.abs(b.correct_year - ev.correct_year));
  return [...same, ...rest].slice(0, limit);
}
