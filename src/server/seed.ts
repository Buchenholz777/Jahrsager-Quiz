import { PAKETE } from "../../content/ereigniskarten";
import { placeholderId, placeholderSvg } from "../../content/placeholder";
import { addDays } from "@/lib/time";
import type { Db } from "./db/client";
import { createEvent, emptyEventInput } from "./services/events";
import { publishDuePacks } from "./services/packs";
import { putImage } from "./storage";

/**
 * Legt die 15 Ereigniskarten und 3 Tagespakete (heute-2, heute-1, heute) an.
 * Alle Karten sind is_demo (Platzhalterbild, Texte nicht redaktionell freigegeben). Der recherchierte
 * Bildkandidat steht in `research.image`; das Bild selbst wird erst auf Anstoß der Redaktion importiert.
 */
export async function seedDemo(db: Db, today: string, opts: { writeImages?: boolean } = {}) {
  const existing = await db.one<{ n: number }>("select count(*)::int as n from events where is_demo");
  if (existing && existing.n > 0) return { created: 0 };
  let created = 0;
  for (const [pi, pack] of PAKETE.entries()) {
    const ids: string[] = [];
    for (const d of pack) {
      const imageId = placeholderId(d.slug);
      const [w, h] = d.size;
      if (opts.writeImages !== false) await putImage(`${imageId}.svg`, Buffer.from(placeholderSvg(d.slug, w, h)), "image/svg+xml");
      const input = {
        ...emptyEventInput(),
        slug: d.slug,
        category: d.category,
        difficulty: d.difficulty,
        neutral_title: d.neutral_title,
        description: d.description,
        image_alt: d.placeholderAlt,
        image_credit_short: "Platzhalter-Grafik (Demo)",
        correct_year: d.correct_year,
        exact_date: d.exact_date,
        public_title: d.public_title,
        explanation_what: d.explanation_what,
        explanation_why: d.explanation_why,
        explanation_detail: d.explanation_detail,
        background: d.background,
        sources: d.sources,
        image_id: imageId,
        image_ext: "svg",
        image_width: w,
        image_height: h,
        image_is_placeholder: true,
        image_credit_full: "Platzhalter-Grafik von JAHRSAGER (generiert, kein historisches Foto)",
        image_license: "Eigene Grafik, keine Rechte Dritter",
        image_source_url: "n/a (generierte Grafik)",
        image_edits: "Keine – generiert",
        checks: { rights: false, facts: false, photoMatchesEvent: false },
        image_status: d.imageStatus,
        research: d.research,
        knowledge_enabled: true,
        is_demo: true,
      };
      const ev = await createEvent(db, input, "Seed aus content/ereigniskarten.ts");
      await db.run("update events set status = 'eingeplant' where id = $1", [ev.id]);
      ids.push(ev.id);
      created++;
    }
    const date = addDays(today, pi - (PAKETE.length - 1));
    const p = (await db.one<{ id: string }>("insert into daily_packs(pack_date) values ($1) returning id", [date]))!;
    for (const [i, id] of ids.entries()) {
      await db.run("insert into daily_pack_events(pack_id, position, event_id) values ($1, $2, $3)", [p.id, i + 1, id]);
    }
  }
  await publishDuePacks(db, today);
  return { created };
}
