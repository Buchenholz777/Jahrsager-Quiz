import type { Db, Queryable } from "../db/client";
import { todayKey } from "../clock";
import { addDays } from "@/lib/time";
import { schedulePack, validatePack } from "../services/packs";
import type { EventRow } from "../types";
import { ROUNDS_PER_GAME } from "@/lib/constants";

/** Pool: automatisch oder manuell freigegebene, ungesperrte Produktionsereignisse, die noch in keinem Paket vorkommen. */
export async function poolEvents(db: Queryable): Promise<EventRow[]> {
  return db.query<EventRow>(
    `select e.* from events e
     where e.status = 'freigegeben' and not e.blocked and not e.is_demo and not e.homepage_showcase
       and e.image_status = 'freigegeben' and e.image_id is not null and not e.image_is_placeholder
       and not exists (select 1 from daily_pack_events pe where pe.event_id = e.id)`,
  );
}

function shuffle<T>(a: T[], rnd: () => number): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Wählt fünf Ereignisse: ≥ 3 Themenfelder, verschiedene Jahre/Jahrzehnte, Schwierigkeitsmix (so gut wie möglich). */
export function pickFive(pool: EventRow[], rnd: () => number = Math.random): EventRow[] | null {
  if (pool.length < ROUNDS_PER_GAME) return null;
  let best: { set: EventRow[]; score: number } | null = null;
  for (let t = 0; t < 300; t++) {
    const set = shuffle(pool, rnd).slice(0, ROUNDS_PER_GAME);
    const { errors, warnings } = validatePack(set);
    if (errors.length) continue;
    const decades = new Set(set.map((e) => Math.floor(e.correct_year / 10))).size;
    const score = warnings.length * 10 - decades; // weniger Warnungen, mehr Jahrzehnte
    if (!best || score < best.score) best = { set, score };
    if (!warnings.length && decades >= 4) break;
  }
  return best ? best.set : null;
}

export interface PlanResult {
  planned: string[];
  missing: string[];
  stock: number;
  stockDays: number;
}

/** Plant für die nächsten Tage fehlende Tagespakete – ausschließlich aus dem geprüften Pool, niemals mit Ungeprüftem aufgefüllt. */
export async function planPacks(db: Db, opts: { days: number; now?: Date; rnd?: () => number }): Promise<PlanResult> {
  const now = opts.now ?? new Date();
  const start = todayKey(now);
  const planned: string[] = [];
  const missing: string[] = [];
  for (let i = 0; i < opts.days; i++) {
    const date = addDays(start, i);
    if (await db.one("select 1 from daily_packs where pack_date = $1", [date])) continue;
    const five = pickFive(await poolEvents(db), opts.rnd);
    if (!five) {
      missing.push(date);
      continue;
    }
    await schedulePack(db, { date, eventIds: five.map((e) => e.id) }, now);
    planned.push(date);
  }
  const stock = (await poolEvents(db)).length;
  return { planned, missing, stock, stockDays: Math.floor(stock / ROUNDS_PER_GAME) };
}
