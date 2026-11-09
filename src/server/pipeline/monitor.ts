import type { Queryable } from "../db/client";

/** Konfigurierbare Schwellen für den Ereignisvorrat (Umgebungsvariablen), Standard laut Betreiberanforderung. */
export interface PoolThresholds {
  target: number; // Zielbestand
  boost: number; // darunter: erhöhte Produktion
  warn: number; // darunter: Warnung (< 21 Spieltage)
  critical: number; // darunter: kritische Warnung (< 7 Spieltage)
  blocker: number; // darunter: Produktionsblocker (weniger als ein Tagesrätsel)
}

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? n : d;
};

export function poolThresholds(env: Record<string, string | undefined> = process.env): PoolThresholds {
  return {
    target: num(env.POOL_TARGET, 300),
    boost: num(env.POOL_BOOST, 150),
    warn: num(env.POOL_WARN, 105),
    critical: num(env.POOL_CRITICAL, 35),
    blocker: num(env.POOL_BLOCKER, 5),
  };
}

export type PoolLevel = "target" | "fill" | "boost" | "warn" | "critical" | "blocker";

export function poolLevel(stock: number, t: PoolThresholds = poolThresholds()): { level: PoolLevel; message: string; days: number } {
  const days = Math.floor(stock / 5);
  if (stock < t.blocker) return { level: "blocker", days, message: `Produktionsblocker: nur ${stock} freigegebene Ereignisse – nicht einmal ein Tagesrätsel.` };
  if (stock < t.critical) return { level: "critical", days, message: `Kritisch: ${stock} Ereignisse reichen nur für ${days} Spieltage (Schwelle ${t.critical}).` };
  if (stock < t.warn) return { level: "warn", days, message: `Warnung: ${stock} Ereignisse reichen für ${days} Spieltage (Schwelle ${t.warn}, weniger als 21 Tage).` };
  if (stock < t.boost) return { level: "boost", days, message: `Vorrat ${stock}: erhöhte Content-Produktion (unter ${t.boost}).` };
  if (stock < t.target) return { level: "fill", days, message: `Vorrat ${stock} von ${t.target}: Auffüllung läuft.` };
  return { level: "target", days, message: `Zielbestand erreicht (${stock} von ${t.target}).` };
}

/** Kosten-/Mengenbremse für KI-Aufrufe (Anzahl Aufrufe je Lauf, Tag und Monat). */
export interface AiBudget {
  perRun: number;
  perDay: number;
  perMonth: number;
}
export function aiBudget(env: Record<string, string | undefined> = process.env): AiBudget {
  return { perRun: num(env.AI_MAX_CALLS_PER_RUN, 25), perDay: num(env.AI_MAX_CALLS_PER_DAY, 60), perMonth: num(env.AI_MAX_CALLS_PER_MONTH, 1200) };
}

/** Wie viele KI-Aufrufe heute/in diesem Monat bereits protokolliert wurden (aus pipeline_runs.summary.aiCalls). */
export async function aiCallsUsed(db: Queryable): Promise<{ today: number; month: number }> {
  const row = await db.one<{ today: number; month: number }>(
    `select coalesce(sum((summary->>'aiCalls')::int) filter (where started_at >= date_trunc('day', now())), 0)::int as today,
            coalesce(sum((summary->>'aiCalls')::int) filter (where started_at >= date_trunc('month', now())), 0)::int as month
     from pipeline_runs where summary ? 'aiCalls'`,
  );
  return row ?? { today: 0, month: 0 };
}

/** Verbleibende erlaubte KI-Aufrufe für diesen Lauf (0 = Budget erschöpft). */
export function aiCallsAllowed(used: { today: number; month: number }, b: AiBudget): number {
  return Math.max(0, Math.min(b.perRun, b.perDay - used.today, b.perMonth - used.month));
}
