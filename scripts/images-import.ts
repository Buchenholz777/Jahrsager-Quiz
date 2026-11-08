import "./env";
import { getDb } from "../src/server/db/client";
import { importCandidateImage } from "../src/server/services/image-import";
import type { Research } from "../src/server/types";

const args = process.argv.slice(2);
const yes = args.includes("--yes");
const target = args.find((a) => !a.startsWith("--"));
const db = await getDb();
const rows = await db.query<{ id: string; slug: string; image_is_placeholder: boolean; research: Research }>(
  "select id, slug, image_is_placeholder, research from events where research ? 'image' and (image_is_placeholder or image_id is null) and ($1::text is null or slug = $1) order by slug",
  [target ?? null],
);
if (!rows.length) {
  console.log("Keine Ereignisse mit Bildkandidat gefunden.");
  await db.close();
  process.exit(0);
}
console.log(`${rows.length} Bildkandidat(en):`);
for (const r of rows) console.log(` - ${r.slug}: ${r.research.image!.commonsFile} (${r.research.image!.license})`);
if (!yes) {
  console.log("\nTrockenlauf. Mit --yes werden die Bilder von upload.wikimedia.org heruntergeladen, verarbeitet und");
  console.log("als Bildstatus „zu_pruefen“ eingetragen (KEINE Freigabe). Aufruf: npm run images:import -- [slug] --yes");
  await db.close();
  process.exit(0);
}
for (const r of rows) {
  await new Promise((res) => setTimeout(res, 4000)); // Rate-Limits der Wikimedia-APIs respektieren
  try {
    await importCandidateImage(db, r.id);
    console.log(`✓ ${r.slug}`);
  } catch (e) {
    console.error(`✗ ${r.slug}: ${(e as Error).message}`);
  }
}
await db.close();
