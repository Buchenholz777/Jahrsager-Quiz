import { CATEGORIES, ROUNDS_PER_GAME } from "@/lib/constants";
import { toSel } from "./plan";
import { distribution, type Distribution } from "./select";
import type { Queryable } from "../db/client";
import { todayKey } from "../clock";
import { AppError, type AuditEntry, type EventRow } from "../types";
import { auditEntry } from "./license";

export const STOCK_TARGET = 150;

export interface PipelineStats {
  stock: number;
  stockDays: number;
  target: number;
  lowStock: boolean;
  candidatesWeek: number;
  autoApproved: number;
  manualReview: number;
  rejected: number;
  blocked: number;
  nextPacks: { pack_date: string; titles: string[] }[];
  runs: { id: number; kind: string; started_at: string; ok: boolean | null; error: string; summary: unknown }[];
  lastErrors: number;
}

export async function pipelineStats(db: Queryable, now = new Date()): Promise<PipelineStats> {
  const n = async (sql: string, p: unknown[] = []) => (await db.one<{ n: number }>(sql, p))!.n;
  const stock = await n(
    `select count(*)::int as n from events e where e.status = 'freigegeben' and not e.blocked and not e.is_demo and not e.homepage_showcase
       and e.image_status = 'freigegeben' and not exists (select 1 from daily_pack_events pe where pe.event_id = e.id)`,
  );
  const nextPacks = await db.query<{ pack_date: string; titles: string[] }>(
    `select p.pack_date::text as pack_date,
       array(select e.neutral_title from daily_pack_events pe join events e on e.id = pe.event_id where pe.pack_id = p.id order by pe.position) as titles
     from daily_packs p where p.pack_date >= $1 order by p.pack_date limit 7`,
    [todayKey(now)],
  );
  const runs = await db.query<PipelineStats["runs"][number]>("select id, kind, started_at::text as started_at, ok, error, summary from pipeline_runs order by id desc limit 10");
  return {
    stock,
    stockDays: Math.floor(stock / ROUNDS_PER_GAME),
    target: STOCK_TARGET,
    lowStock: stock < 30,
    candidatesWeek: await n("select count(*)::int as n from events where pipeline_state is not null and created_at > now() - interval '7 days'"),
    autoApproved: await n("select count(*)::int as n from events where pipeline_state = 'auto_approved' and not blocked"),
    manualReview: await n("select count(*)::int as n from events where pipeline_state = 'manual_review' and not blocked"),
    rejected: await n("select count(*)::int as n from pipeline_seen where decision = 'rejected'"),
    blocked: await n("select count(*)::int as n from events where blocked"),
    nextPacks,
    runs,
    lastErrors: runs.filter((r) => r.ok === false).length,
  };
}

export async function logRun<T>(db: Queryable, kind: string, fn: () => Promise<T>): Promise<T> {
  const id = (await db.one<{ id: number }>("insert into pipeline_runs(kind) values ($1) returning id", [kind]))!.id;
  try {
    const out = await fn();
    await db.run("update pipeline_runs set finished_at = now(), ok = true, summary = $2::jsonb where id = $1", [id, JSON.stringify(out ?? {})]);
    return out;
  } catch (e) {
    await db.run("update pipeline_runs set finished_at = now(), ok = false, error = $2 where id = $1", [id, String((e as Error).message).slice(0, 1000)]);
    throw e;
  }
}

async function appendAudit(db: Queryable, id: string, entry: AuditEntry) {
  await db.run("update events set audit = audit || $2::jsonb where id = $1", [id, JSON.stringify([entry])]);
}

/**
 * Sperrt ein Ereignis sofort: es verlässt Pool, Startseite, Wissensseiten und Archiv-Bildauslieferung.
 * Noch nicht begonnene zukünftige Pakete mit dem Ereignis werden zurückgenommen; die übrigen Ereignisse kehren in den Pool zurück.
 */
export async function blockEvent(db: Queryable, id: string, reason: string, actor = "admin"): Promise<{ unscheduledPacks: string[] }> {
  if (reason.trim().length < 3) throw new AppError("GRUND_FEHLT", "Bitte einen Sperrgrund angeben.");
  const ev = await db.one<{ id: string; status: string }>("select id, status from events where id = $1", [id]);
  if (!ev) throw new AppError("NICHT_GEFUNDEN", "Ereignis nicht gefunden", 404);
  const today = todayKey();
  const packs = await db.query<{ id: string; pack_date: string }>(
    "select p.id, p.pack_date::text as pack_date from daily_packs p join daily_pack_events pe on pe.pack_id = p.id where pe.event_id = $1 and p.pack_date > $2",
    [id, today],
  );
  for (const p of packs) {
    const others = await db.query<{ event_id: string }>("select event_id from daily_pack_events where pack_id = $1 and event_id <> $2", [p.id, id]);
    await db.run("delete from daily_packs where id = $1", [p.id]);
    for (const o of others) {
      if (!(await db.one("select 1 from daily_pack_events where event_id = $1", [o.event_id]))) {
        await db.run("update events set status = 'freigegeben' where id = $1 and status = 'eingeplant'", [o.event_id]);
      }
    }
  }
  const status = ev.status === "eingeplant" ? "entwurf" : ev.status === "freigegeben" ? "entwurf" : ev.status;
  await db.run("update events set blocked = true, blocked_reason = $2, pipeline_state = 'rejected', status = $3, updated_at = now() where id = $1", [id, reason.trim(), status]);
  await appendAudit(db, id, auditEntry("sperre", "abgelehnt", [reason.trim()], { pakete: packs.map((p) => p.pack_date) }, actor));
  return { unscheduledPacks: packs.map((p) => p.pack_date) };
}

export async function unblockEvent(db: Queryable, id: string, actor = "admin") {
  await db.run("update events set blocked = false, blocked_reason = '', pipeline_state = 'manual_review', updated_at = now() where id = $1", [id]);
  await appendAudit(db, id, auditEntry("sperre_aufgehoben", "info", ["Sperre aufgehoben; zurück in die manuelle Prüfung"], undefined, actor));
}

export interface DiversityStats {
  all: Distribution;
  last30: Distribution;
  similar: { topic: string; titles: string[] }[];
  unclassified: number;
}

/** Verteilung des freigegebenen Bestands und der letzten 30 Tage (Themenfelder, Regionen, Jahrzehnte) samt ähnlicher Ereignisse. */
export async function diversityStats(db: Queryable, now = new Date()): Promise<DiversityStats> {
  const labels = CATEGORIES as unknown as Record<string, string>;
  const rows = await db.query<EventRow & { neutral_title: string }>(
    "select * from events where not is_demo and not blocked and status in ('freigegeben','eingeplant','veroeffentlicht')",
  );
  const since = new Date(now.getTime() - 30 * 86_400_000);
  const recent = await db.query<EventRow>(
    `select e.* from daily_pack_events pe join daily_packs p on p.id = pe.pack_id join events e on e.id = pe.event_id
     where p.pack_date >= $1 and p.pack_date <= $2`,
    [todayKey(since), todayKey(now)],
  );
  const groups = new Map<string, string[]>();
  for (const r of rows) if (r.topic_key) groups.set(r.topic_key, [...(groups.get(r.topic_key) ?? []), r.neutral_title]);
  return {
    all: distribution(rows.map(toSel), labels),
    last30: distribution(recent.map(toSel), labels),
    similar: [...groups].filter(([, t]) => t.length > 1).map(([topic, titles]) => ({ topic, titles })),
    unclassified: rows.filter((r) => !r.region).length,
  };
}
