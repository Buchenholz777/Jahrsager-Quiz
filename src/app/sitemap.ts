import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getDb } from "@/server/db/client";
import { listKnowledge } from "@/server/services/knowledge";

export const dynamic = "force-dynamic";

/** Nur öffentliche, redaktionell freigegebene Seiten. Demo-, Entwurfs- und Spielseiten sind nicht enthalten. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = (await listKnowledge(await getDb())).filter((e) => !e.is_demo);
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/so-funktionierts"), changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/archiv"), lastModified: now, changeFrequency: "daily", priority: 0.6 },
    ...(events.length ? [{ url: absoluteUrl("/geschichte"), lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 }] : []),
    ...events.map((e) => ({
      url: absoluteUrl(`/geschichte/${e.slug}`),
      lastModified: new Date(e.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
