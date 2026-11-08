import "./env";
import { PAKETE } from "../content/ereigniskarten";
import { getDb } from "../src/server/db/client";
import { getEventBySlug, updateEvent } from "../src/server/services/events";
import { recropImported } from "../src/server/services/image-import";
import type { EventInput } from "../src/server/types";

/**
 * Überträgt Textänderungen aus content/ereigniskarten.ts in eine bereits befüllte Datenbank, ohne Bilder
 * oder Prüfbestätigungen anzufassen. Jede Änderung erzeugt eine neue Fassung mit Notiz.
 */
const db = await getDb();
let changed = 0;
for (const c of PAKETE.flat()) {
  const ev = await getEventBySlug(db, c.slug);
  if (!ev) {
    console.log(`– ${c.slug}: nicht in der Datenbank (db:seed ausführen)`);
    continue;
  }
  const next = {
    ...ev,
    neutral_title: c.neutral_title,
    description: c.description,
    image_alt: ev.image_is_placeholder ? c.placeholderAlt : c.research.image!.altDraft,
    explanation_what: c.explanation_what,
    explanation_why: c.explanation_why,
    explanation_detail: c.explanation_detail,
    background: c.background,
    sources: c.sources,
    research: c.research,
  } as EventInput;
  const after = await updateEvent(db, ev.id, next, "Abgleich mit content/ereigniskarten.ts");
  if (after.version !== ev.version) {
    changed++;
    console.log(`✓ ${c.slug}: Fassung ${after.version}`);
  }
  const cropped = await recropImported(db, ev.id);
  if (cropped) console.log(`✓ ${c.slug}: Bild zugeschnitten (Fassung ${cropped.version})`);
}
console.log(`${changed} Ereignis(se) aktualisiert.`);
await db.close();
