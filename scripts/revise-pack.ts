import "./env";
import { todayKey } from "../src/server/clock";
import { getDb } from "../src/server/db/client";
import { toSel } from "../src/server/pipeline/plan";
import { packViolations } from "../src/server/pipeline/select";
import { getPackByDate, revisePack } from "../src/server/services/packs";
import type { EventRow } from "../src/server/types";

/**
 * Ersetzt das heutige Tagespaket durch eine neue Fassung (nur für NEUE Partien; bestehende Partien und Ergebnisse bleiben).
 *   npm run revise:pack -- slug1 slug2 slug3 slug4 slug5 [--yes]
 * Ohne --yes: Trockenlauf mit Prüfung der Vielfaltsregeln.
 */
const slugs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const yes = process.argv.includes("--yes");
const db = await getDb();
const today = todayKey();
const pack = await getPackByDate(db, today);
if (!pack) throw new Error("Für heute gibt es kein aktives Paket.");
const events: EventRow[] = [];
for (const s of slugs) {
  const e = await db.one<EventRow>("select * from events where slug = $1", [s]);
  if (!e) throw new Error(`Ereignis nicht gefunden: ${s}`);
  events.push(e);
}
const oldIds = new Set((await db.query<{ event_id: string }>("select event_id from daily_pack_events where pack_id = $1", [pack.id])).map((r) => r.event_id));
// Verlauf = alle anderen Tage (die zu ersetzende Fassung zählt nicht)
const history = (
  await db.query<EventRow>(
    "select e.* from daily_pack_events pe join daily_packs p on p.id = pe.pack_id join events e on e.id = pe.event_id where p.pack_date <> $1 order by p.pack_date, pe.position",
    [today],
  )
).map(toSel);
const sel = events.map(toSel);
const strict = packViolations(sel, history, true);
const lax = packViolations(sel, history, false);
console.log(`Heutiges Paket: Nr. ${pack.number}; neue Fassung:`);
for (const e of events) console.log(` - ${e.slug} | ${e.category} | ${e.correct_year} | Schwierigkeit ${e.difficulty} | ${e.region} | ${oldIds.has(e.id) ? "(war schon im Paket)" : "neu"}`);
console.log(strict.length ? `Regelverstöße (strikt): ${strict.join(" | ")}` : "Alle Vielfaltsregeln erfüllt.");
if (strict.length && lax.length) throw new Error("Vielfaltsregeln verletzt – nicht angewendet.");
if (!yes) {
  console.log("Trockenlauf. Mit --yes anwenden.");
} else {
  const fresh = await revisePack(db, { packId: pack.id, eventIds: events.map((e) => e.id) });
  console.log(`Neue Fassung angelegt: Nr. ${fresh.number} (Fassung ${fresh.revision}).`);
}
await db.close();
