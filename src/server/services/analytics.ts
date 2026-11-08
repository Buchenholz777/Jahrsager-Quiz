import { addDays } from "@/lib/time";
import type { Queryable } from "../db/client";

/**
 * Datensparsame Eigenmessung: nur Ereignisname, Tag und grobe Eigenschaften.
 * Keine Personen-ID, keine IP, keine Cookies, kein Fingerprinting.
 */
export const ANALYTICS_EVENTS = [
  "home_view",
  "cta_click",
  "landing",
  "game_start",
  "round_complete",
  "game_complete",
  "archive_play",
  "share",
  "knowledge_view",
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

const ALLOWED_PROPS = new Set(["channel", "method", "round", "points", "path", "variant", "device"]);

export function sanitizeProps(props: Record<string, unknown> | undefined): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(props ?? {})) {
    if (!ALLOWED_PROPS.has(k)) continue;
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, 60).replace(/[?#].*$/, ""); // Query-Strings nie speichern
  }
  return out;
}

export async function track(db: Queryable, day: string, name: AnalyticsEvent, props?: Record<string, unknown>) {
  if (process.env.ANALYTICS_ENABLED === "false") return;
  await db.run("insert into analytics_events(day, name, props) values ($1, $2, $3::jsonb)", [day, name, JSON.stringify(sanitizeProps(props))]);
}

export type Channel = "suche" | "teilen" | "sozial" | "direkt" | "sonstige";

/** Grobe Herkunftskategorie aus dem Referrer-Host (der Host selbst wird nicht gespeichert). */
export function classifyReferrer(referrer: string, ownHost: string, hasShareParam: boolean): Channel {
  if (hasShareParam) return "teilen";
  if (!referrer) return "direkt";
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "sonstige";
  }
  if (host === ownHost) return "direkt";
  if (/(^|\.)(google|bing|duckduckgo|ecosia|yahoo|startpage|qwant)\./.test(host)) return "suche";
  if (/(whatsapp|facebook|instagram|t\.co|twitter|x\.com|reddit|telegram|tiktok|linkedin|mastodon|bsky)/.test(host)) return "sozial";
  return "sonstige";
}

export async function getMetrics(db: Queryable, today: string, days = 14) {
  const from = addDays(today, -(days - 1));
  const counts = await db.query<{ day: string; name: string; n: number }>(
    "select day, name, count(*)::int as n from analytics_events where day >= $1 group by day, name order by day",
    [from],
  );
  const channels = await db.query<{ channel: string; n: number }>(
    "select coalesce(props->>'channel','unbekannt') as channel, count(*)::int as n from analytics_events where name = 'landing' and day >= $1 group by 1 order by 2 desc",
    [from],
  );
  const shares = await db.query<{ method: string; n: number }>(
    "select coalesce(props->>'method','?') as method, count(*)::int as n from analytics_events where name = 'share' and day >= $1 group by 1",
    [from],
  );
  // Abbruchpunkte: Anzahl nicht abgeschlossener offizieller Partien je zuletzt erreichter Runde
  const dropoff = await db.query<{ reached: number; n: number }>(
    `select (select count(*) from game_rounds r where r.game_id = g.id and r.status <> 'offen')::int as reached, count(*)::int as n
     from games g where g.official and g.status = 'laufend' group by 1 order by 1`,
  );
  const started = (await db.one<{ n: number }>("select count(*)::int as n from games where official"))!.n;
  const completed = (await db.one<{ n: number }>("select count(*)::int as n from games where official and status = 'abgeschlossen'"))!.n;
  const perEvent = await db.query<{ title: string; avg: number; n: number }>(
    `select e.neutral_title as title, round(avg(r.points))::int as avg, count(*)::int as n
     from game_rounds r join games g on g.id = r.game_id join events e on e.id = r.event_id
     where g.official and r.status <> 'offen' group by e.neutral_title order by avg`,
  );
  // Wiederkehr: Anteil der Spieler mit offizieller Erstpartie vor ≥ N Tagen, die danach (≥ N Tage später) erneut gespielt haben
  const retention: Record<string, { eligible: number; returned: number }> = {};
  for (const n of [1, 7, 30]) {
    const row = await db.one<{ eligible: number; returned: number }>(
      `with first as (
         select g.player_id, min(p.pack_date) as d0 from games g join daily_packs p on p.id = g.pack_id where g.official group by g.player_id)
       select count(*)::int as eligible,
         count(*) filter (where exists (select 1 from games g2 join daily_packs p2 on p2.id = g2.pack_id
           where g2.player_id = first.player_id and g2.official and p2.pack_date >= (first.d0 + $2::int)))::int as returned
       from first where d0 <= ($1::date - $2::int)`,
      [today, n],
    );
    retention[`d${n}`] = row ?? { eligible: 0, returned: 0 };
  }
  // Startseite: Aufrufe und Klicks auf den Spielstart je Variante und Gerätetyp (grobe Klasse, keine Kennung)
  const homeByVariant = await db.query<{ variant: string; device: string; views: number; clicks: number }>(
    `select coalesce(props->>'variant','–') as variant, coalesce(props->>'device','–') as device,
            count(*) filter (where name = 'home_view')::int as views, count(*) filter (where name = 'cta_click')::int as clicks
     from analytics_events where name in ('home_view','cta_click') and day >= $1 group by 1, 2 order by 1, 2`,
    [from],
  );
  const startedWithGuess = (await db.one<{ n: number }>(
    "select count(*)::int as n from games g where g.official and exists (select 1 from game_rounds r where r.game_id = g.id and r.status <> 'offen')",
  ))!.n;
  const archivePlays = (await db.one<{ n: number }>("select count(*)::int as n from games where not official"))!.n;
  return { counts, channels, shares, dropoff, started, completed, perEvent, retention, archivePlays, homeByVariant, startedWithGuess, from };
}
