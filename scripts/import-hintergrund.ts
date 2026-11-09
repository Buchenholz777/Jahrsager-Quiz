import "./env";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/server/db/client";
import { getEventBySlug, updateEvent } from "../src/server/services/events";
import { knowledgeQuality } from "../src/server/services/knowledge-quality";
import type { EventInput } from "../src/server/types";

/**
 * Übernimmt Hintergrundtexte (content/recherche/<datei>.json) in die Ereignisse und schaltet die Wissensseite ein.
 * Die Seiten erscheinen erst NACH dem Rätseltag und werden nur indexiert, wenn die Qualitätsschranke bestanden ist.
 *   npm run import:hintergrund -- hintergrund-1
 */
const name = process.argv[2] ?? "hintergrund-1";
const file = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "recherche", `${name}.json`), "utf8")) as { events: Record<string, string> };
const db = await getDb();
for (const [slug, background] of Object.entries(file.events)) {
  const ev = await getEventBySlug(db, slug);
  if (!ev) {
    console.log(`– ${slug}: nicht gefunden`);
    continue;
  }
  const after = await updateEvent(db, ev.id, { ...ev, background, knowledge_enabled: true } as EventInput, "Historischer Hintergrund (Entwurf aus Wikipedia-Artikel) ergänzt, Wissensseite eingeschaltet");
  const q = knowledgeQuality(after);
  console.log(`✓ ${slug}: Fassung ${after.version}, Hintergrund ${q.words.background} Wörter, gesamt ${q.words.total}; ${q.indexable ? "indexierbar" : "noindex: " + q.problems.join(" | ")}`);
}
await db.close();
