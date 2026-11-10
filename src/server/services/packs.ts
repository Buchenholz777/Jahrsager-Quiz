import { ROUNDS_PER_GAME } from "@/lib/constants";
import { addDays } from "@/lib/time";
import type { Db, Queryable } from "../db/client";
import { now as clockNow, todayKey } from "../clock";
import { AppError, type EventRow, type PackInfo } from "../types";

export const demoAllowed = () => process.env.ALLOW_DEMO_CONTENT === "true";

const PACK_COLS = "id, number, pack_date, status";

export async function getPackByNumber(db: Queryable, number: number) {
  return db.one<PackInfo>(`select ${PACK_COLS} from daily_packs where number = $1`, [number]);
}
export async function getPackByDate(db: Queryable, date: string) {
  return db.one<PackInfo>(`select ${PACK_COLS} from daily_packs where pack_date = $1 and superseded_at is null`, [date]);
}

export async function getPackEvents(db: Queryable, packId: string): Promise<EventRow[]> {
  return db.query<EventRow>(
    "select e.* from daily_pack_events pe join events e on e.id = pe.event_id where pe.pack_id = $1 order by pe.position",
    [packId],
  );
}

/** Markiert fällige Pakete und ihre Ereignisse als veröffentlicht (idempotent). */
export async function publishDuePacks(db: Queryable, today: string) {
  await db.run("update daily_packs set status = 'veroeffentlicht' where status = 'geplant' and pack_date <= $1", [today]);
  await db.run(
    `update events set status = 'veroeffentlicht', published_at = coalesce(published_at, now())
     where status = 'eingeplant' and id in (
       select pe.event_id from daily_pack_events pe join daily_packs p on p.id = pe.pack_id where p.status = 'veroeffentlicht')`,
  );
}

/** Nur Entwicklung: Legt automatisch ein Demo-Paket für heute an, wenn keines geplant ist. */
async function ensureDemoPackForToday(db: Db, today: string) {
  if (process.env.DEMO_AUTOSCHEDULE !== "true" || process.env.NODE_ENV === "production") return;
  if (await getPackByDate(db, today)) return;
  await db.transaction(async (tx) => {
    if (await getPackByDate(tx, today)) return;
    const templates = await tx.query<{ id: string }>(
      `select p.id from daily_packs p where not exists (
         select 1 from daily_pack_events pe join events e on e.id = pe.event_id where pe.pack_id = p.id and not e.is_demo)
       order by p.number limit 3`,
    );
    if (!templates.length) return;
    const total = (await tx.one<{ n: number }>("select count(*)::int as n from daily_packs"))!.n;
    const tpl = templates[total % templates.length];
    const pack = (await tx.one<{ id: string }>("insert into daily_packs(pack_date, status) values ($1, 'veroeffentlicht') returning id", [today]))!;
    await tx.run(
      "insert into daily_pack_events(pack_id, position, event_id) select $1, position, event_id from daily_pack_events where pack_id = $2",
      [pack.id, tpl.id],
    );
  });
}

export type TodayPack = { pack: PackInfo; events: EventRow[] };

/** Heutiges Paket (Europe/Berlin). Gibt null zurück, wenn keines hinterlegt oder nicht öffentlich nutzbar ist. */
export async function getTodayPack(db: Db, at: Date = clockNow()): Promise<TodayPack | null> {
  const today = todayKey(at);
  await publishDuePacks(db, today);
  await ensureDemoPackForToday(db, today);
  let pack = await getPackByDate(db, today);
  if (!pack && !demoAllowed()) {
    // Selbstheilung: fehlt das Rätsel von heute (z. B. Planungslauf nicht gelaufen oder Vorrat knapp), wird es aus dem geprüften Pool angelegt.
    try {
      const { planPacks } = await import("../pipeline/plan");
      await planPacks(db, { days: 1, now: at });
      await publishDuePacks(db, today);
      pack = await getPackByDate(db, today);
    } catch {
      /* z. B. gleichzeitige Anlage durch eine zweite Anfrage: unten erneut lesen */
      pack = await getPackByDate(db, today);
    }
  }
  if (!pack) return null;
  const events = await getPackEvents(db, pack.id);
  if (events.length !== ROUNDS_PER_GAME) return null;
  if (!demoAllowed() && events.some((e) => e.is_demo)) return null;
  return { pack, events };
}

/** Ein Paket ist öffentlich, wenn sein Datum erreicht ist (und Demo-Inhalte zulässig sind). */
export async function getPublicPack(db: Db, number: number, at: Date = clockNow()): Promise<TodayPack | null> {
  const today = todayKey(at);
  await publishDuePacks(db, today);
  const pack = await getPackByNumber(db, number);
  if (!pack || pack.pack_date > today) return null;
  const events = await getPackEvents(db, pack.id);
  if (events.length !== ROUNDS_PER_GAME) return null;
  if (!demoAllowed() && events.some((e) => e.is_demo)) return null;
  return { pack, events };
}

export async function listArchivePacks(db: Db, at: Date = clockNow(), limit = 60) {
  const today = todayKey(at);
  await publishDuePacks(db, today);
  const rows = await db.query<{ id: string; number: number; pack_date: string; demo: boolean }>(
    `select p.id, p.number, p.pack_date,
       exists(select 1 from daily_pack_events pe join events e on e.id = pe.event_id where pe.pack_id = p.id and e.is_demo) as demo
     from daily_packs p where p.pack_date < $1 and p.superseded_at is null order by p.pack_date desc limit $2`,
    [today, limit],
  );
  return demoAllowed() ? rows : rows.filter((r) => !r.demo);
}

export function validatePack(events: EventRow[], packId?: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (events.length !== ROUNDS_PER_GAME) errors.push(`Ein Tagespaket benötigt genau ${ROUNDS_PER_GAME} Ereignisse.`);
  if (new Set(events.map((e) => e.id)).size !== events.length) errors.push("Ereignisse dürfen nur einmal vorkommen.");
  if (new Set(events.map((e) => e.category)).size < 3) errors.push("Mindestens drei Themenfelder erforderlich.");
  for (const e of events) {
    if (e.status !== "freigegeben" && !(packId && e.status === "eingeplant"))
      errors.push(`„${e.neutral_title}“ ist nicht freigegeben (Status: ${e.status}).`);
  }
  for (const e of events) if (e.homepage_showcase) errors.push(`„${e.neutral_title}“ ist für die Startseite freigegeben und darf nicht im Tagesrätsel vorkommen.`);
  if (new Set(events.map((e) => e.is_demo)).size > 1) errors.push("Demo- und Produktionsinhalte dürfen nicht gemischt werden.");
  if (new Set(events.map((e) => e.correct_year)).size < events.length) warnings.push("Mehrere Ereignisse haben dasselbe Jahr.");
  const years = events.map((e) => e.correct_year);
  if (years.length && Math.max(...years) - Math.min(...years) < 30) warnings.push("Die Ereignisse decken weniger als drei Jahrzehnte ab.");
  const easy = events.filter((e) => e.difficulty === 1).length;
  const hard = events.filter((e) => e.difficulty === 3).length;
  if (events.length === ROUNDS_PER_GAME && (easy < 2 || hard > 1))
    warnings.push("Angestrebte Mischung: zwei leichte, zwei mittlere und höchstens eine knifflige Aufgabe.");
  return { errors, warnings };
}

export async function schedulePack(db: Db, input: { date: string; eventIds: string[] }, at: Date = clockNow()): Promise<PackInfo> {
  const today = todayKey(at);
  if (input.date < today) throw new AppError("DATUM_VERGANGEN", "Das Datum liegt in der Vergangenheit.");
  return db.transaction(async (tx) => {
    const events: EventRow[] = [];
    for (const id of input.eventIds) {
      const e = await tx.one<EventRow>("select * from events where id = $1 for update", [id]);
      if (!e) throw new AppError("NICHT_GEFUNDEN", "Ereignis nicht gefunden", 404);
      events.push(e);
    }
    const { errors } = validatePack(events);
    if (errors.length) throw new AppError("PAKET_UNGUELTIG", errors.join(" "), 422);
    if (await getPackByDate(tx, input.date)) throw new AppError("DATUM_BELEGT", "Für dieses Datum existiert bereits ein Tagespaket.", 409);
    const pack = (await tx.one<PackInfo>(`insert into daily_packs(pack_date) values ($1) returning ${PACK_COLS}`, [input.date]))!;
    for (const [i, e] of events.entries()) {
      await tx.run("insert into daily_pack_events(pack_id, position, event_id) values ($1, $2, $3)", [pack.id, i + 1, e.id]);
      await tx.run("update events set status = 'eingeplant', updated_at = now() where id = $1", [e.id]);
    }
    return pack;
  });
}

/** Nimmt ein zukünftiges, noch nicht begonnenes Paket zurück. */
export async function unschedulePack(db: Db, packId: string, at: Date = clockNow()) {
  const today = todayKey(at);
  await db.transaction(async (tx) => {
    const pack = await tx.one<PackInfo>(`select ${PACK_COLS} from daily_packs where id = $1 for update`, [packId]);
    if (!pack) throw new AppError("NICHT_GEFUNDEN", "Paket nicht gefunden", 404);
    if (pack.pack_date <= today) throw new AppError("PAKET_AKTIV", "Heutige oder frühere Pakete können nicht zurückgenommen werden.", 409);
    const evs = await tx.query<{ event_id: string }>("select event_id from daily_pack_events where pack_id = $1", [packId]);
    await tx.run("delete from daily_packs where id = $1", [packId]);
    for (const { event_id } of evs) {
      const used = await tx.one("select 1 from daily_pack_events where event_id = $1", [event_id]);
      if (!used) await tx.run("update events set status = 'freigegeben' where id = $1 and status = 'eingeplant'", [event_id]);
    }
  });
}

/**
 * Ersetzt das (bereits veröffentlichte) Paket eines Tages durch eine neue Fassung für NEUE Partien.
 * Bestehende Partien und Ergebnisse bleiben unverändert und werden mit dem ursprünglichen Paket abgeschlossen.
 * Wer für den Tag bereits eine offizielle Partie hat, spielt keine zweite Wertung (siehe startGame).
 */
export async function revisePack(db: Db, input: { packId: string; eventIds: string[] }, at: Date = clockNow()): Promise<PackInfo & { revision: number }> {
  const today = todayKey(at);
  const old = await db.one<PackInfo & { revision: number }>("select id, number, pack_date, status, revision from daily_packs where id = $1 and superseded_at is null", [input.packId]);
  if (!old) throw new AppError("NICHT_GEFUNDEN", "Aktives Paket nicht gefunden", 404);
  if (old.pack_date > today) throw new AppError("PAKET_ZUKUENFTIG", "Zukünftige Pakete werden zurückgenommen und neu geplant, nicht versioniert.", 409);
  if (new Set(input.eventIds).size !== ROUNDS_PER_GAME) throw new AppError("PAKET_UNGUELTIG", "Ein Tagespaket benötigt genau fünf verschiedene Ereignisse.", 422);
  const events: EventRow[] = [];
  for (const id of input.eventIds) {
    const e = await db.one<EventRow>("select * from events where id = $1", [id]);
    if (!e) throw new AppError("NICHT_GEFUNDEN", "Ereignis nicht gefunden", 404);
    if (e.blocked || e.is_demo || e.image_status !== "freigegeben" || !["freigegeben", "veroeffentlicht"].includes(e.status)) {
      throw new AppError("PAKET_UNGUELTIG", `„${e.neutral_title}“ ist nicht freigegeben bzw. gesperrt.`, 422);
    }
    events.push(e);
  }
  return db.transaction(async (tx) => {
    await tx.run("update daily_packs set superseded_at = now() where id = $1", [old.id]);
    const pack = (await tx.one<PackInfo & { revision: number }>(
      "insert into daily_packs(pack_date, status, revision) values ($1, 'veroeffentlicht', $2) returning id, number, pack_date, status, revision",
      [old.pack_date, old.revision + 1],
    ))!;
    for (const [i, e] of events.entries()) {
      await tx.run("insert into daily_pack_events(pack_id, position, event_id) values ($1, $2, $3)", [pack.id, i + 1, e.id]);
      await tx.run("update events set status = 'veroeffentlicht', published_at = coalesce(published_at, now()) where id = $1 and status in ('freigegeben', 'eingeplant')", [e.id]);
    }
    return pack;
  });
}

export async function listPacks(db: Queryable) {
  return db.query<{ id: string; number: number; pack_date: string; status: string; titles: string[]; games: number }>(
    `select p.id, p.number, p.pack_date, p.status,
       array(select e.neutral_title from daily_pack_events pe join events e on e.id = pe.event_id where pe.pack_id = p.id order by pe.position) as titles,
       (select count(*)::int from games g where g.pack_id = p.id) as games
     from daily_packs p order by p.pack_date desc`,
  );
}

export { addDays };
