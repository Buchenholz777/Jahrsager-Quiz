import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getDb } from "@/server/db/client";
import { listKnowledge } from "@/server/services/knowledge";

export const dynamic = "force-dynamic";

/**
 * Nur öffentliche, redaktionell freigegebene Seiten. Demo-, Entwurfs-, Spiel- und Ergebnisseiten sind nicht enthalten.
 * lastmod nur bei tatsächlicher Änderung: Startseite/Archiv ändern sich mit dem jeweils letzten veröffentlichten Tagesrätsel,
 * Wissensseiten mit ihrer letzten Fassung. (changefreq/priority werden von Google ignoriert und entfallen.)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDb();
  const events = (await listKnowledge(db)).filter((e) => !e.is_demo);
  const last = await db.one<{ d: string | null }>("select max(pack_date)::text as d from daily_packs where status = veroeffentlicht and superseded_at is null");
  const packLast = last?.d ? new Date(last.d + "T00:00:00Z") : undefined;
  const newest = events.reduce<Date | undefined>((m, e) => (m && m > new Date(e.updated_at) ? m : new Date(e.updated_at)), undefined);
  return [
    { url: absoluteUrl("/"), lastModified: packLast },
    { url: absoluteUrl("/so-funktionierts") },
    { url: absoluteUrl("/archiv"), lastModified: packLast },
    ...(events.length ? [{ url: absoluteUrl("/geschichte"), lastModified: newest }] : []),
    ...events.map((e) => ({ url: absoluteUrl(`/geschichte/${e.slug}`), lastModified: new Date(e.updated_at) })),
  ];
}
