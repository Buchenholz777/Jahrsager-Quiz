import { todayKey } from "../clock";
import { addDays } from "@/lib/time";
import type { Db, Queryable } from "../db/client";
import { schedulePack } from "../services/packs";
import type { EventRow } from "../types";
import { ROUNDS_PER_GAME } from "@/lib/constants";
import { pickDiversePack, pickLeastBad, type SelEvent } from "./select";

/** Pool: automatisch oder manuell freigegebene, ungesperrte Produktionsereignisse, die noch in keinem Paket vorkommen. */
export async function poolEvents(db: Queryable): Promise<EventRow[]> {
  return db.query<EventRow>(
    `select e.* from events e
     where e.status = 'freigegeben' and not e.blocked and not e.is_demo and not e.homepage_showcase
       and e.image_status = 'freigegeben' and e.image_id is not null and not e.image_is_placeholder
       and not exists (select 1 from daily_pack_events pe where pe.event_id = e.id)`,
  );
}

export const toSel = (e: EventRow): SelEvent => ({
  id: e.id,
  category: e.category,
  correct_year: e.correct_year,
  difficulty: e.difficulty,
  region: e.region ?? "",
  country: e.country ?? "",
  tags: Array.isArray(e.tags) ? e.tags : [],
  topic_key: e.topic_key ?? "",
  image_width: e.image_width,
});

/** Verlauf aller veröffentlichten und bereits geplanten Ereignisse, chronologisch. */
export async function packHistory(db: Queryable): Promise<SelEvent[]> {
  const rows = await db.query<EventRow>(
    `select e.* from daily_pack_events pe join daily_packs p on p.id = pe.pack_id join events e on e.id = pe.event_id
     order by p.pack_date, pe.position`,
  );
  return rows.map(toSel);
}

export interface PlanResult {
  planned: string[];
  missing: string[];
  stock: number;
  stockDays: number;
  warnings: string[];
}

/**
 * Plant für die nächsten Tage fehlende Tagespakete – ausschließlich aus dem geprüften Pool und nur, wenn alle Vielfaltsregeln
 * (Themenfelder, Jahrzehnte, Regionen, Ähnlichkeit, Raumfahrt-Fenster, Schwierigkeit) erfüllbar sind. Nie mit Ungeprüftem aufgefüllt.
 */
export async function planPacks(db: Db, opts: { days: number; now?: Date; rnd?: () => number }): Promise<PlanResult> {
  const now = opts.now ?? new Date();
  const start = todayKey(now);
  const planned: string[] = [];
  const missing: string[] = [];
  const warnings: string[] = [];
  let history = await packHistory(db);
  let pool = await poolEvents(db);
  for (let i = 0; i < opts.days; i++) {
    const date = addDays(start, i);
    if (await db.one("select 1 from daily_packs where pack_date = $1", [date])) continue;
    let pick = pickDiversePack(pool.map(toSel), history, opts.rnd);
    // Nur für heute: lieber ein weniger ausgewogenes Rätsel aus geprüften Ereignissen als gar keines.
    if (!pick.set && i === 0) pick = pickLeastBad(pool.map(toSel), history, opts.rnd);
    if (!pick.set) {
      missing.push(date);
      warnings.push(`${date}: ${pick.reasons.join(" ")}`);
      continue;
    }
    warnings.push(...pick.warnings.map((w) => `${date}: ${w}`));
    const ids = pick.set.map((s) => s.id);
    await schedulePack(db, { date, eventIds: ids }, now);
    planned.push(date);
    history = [...history, ...pick.set];
    pool = pool.filter((e) => !ids.includes(e.id));
  }
  const stock = (await poolEvents(db)).length;
  return { planned, missing, stock, stockDays: Math.floor(stock / ROUNDS_PER_GAME), warnings };
}
