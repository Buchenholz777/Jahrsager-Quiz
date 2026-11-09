import "./env";
import { getDb } from "../src/server/db/client";
import { KLASSIFIKATION } from "../src/server/services/klassifikation";

/**
 * Ordnet vorhandene Ereignisse den zwölf Themenfeldern zu und ergänzt Region, Land, Schlagwörter und Themenschlüssel.
 * Es werden nur diese Metadaten gesetzt (keine Texte, Bilder, Fassungen, Pakete oder Spielstände); wiederholbar.
 */
const db = await getDb();
const slugs = (await db.query<{ slug: string }>("select slug from events")).map((r) => r.slug);
let n = 0;
for (const [slug, k] of Object.entries(KLASSIFIKATION)) {
  const c = await db.run(
    "update events set category = $2, subcategory = $3, region = $4, country = $5, tags = $6::jsonb, topic_key = $7 where slug = $1",
    [slug, k.category, k.subcategory, k.region, k.country, JSON.stringify(k.tags), k.topic_key],
  );
  n += c;
}
console.log(`Zugeordnet: ${n} Ereignis(se).`);
const unmatched = slugs.filter((s) => !(s in KLASSIFIKATION));
console.log(unmatched.length ? `Ohne Zuordnung (nicht in der Liste): ${unmatched.join(", ")}` : "Alle vorhandenen Ereignisse zugeordnet.");
console.log(await db.query("select category, count(*)::int as n from events where not is_demo group by category order by n desc"));
await db.close();
