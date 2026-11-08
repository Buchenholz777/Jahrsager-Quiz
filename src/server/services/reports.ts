import type { Queryable } from "../db/client";

export async function createReport(db: Queryable, input: { eventId: string; gameId?: string | null; message: string }) {
  const ev = await db.one("select 1 from events where id = $1", [input.eventId]);
  if (!ev) return false;
  await db.run("insert into error_reports(event_id, game_id, message) values ($1, $2, $3)", [input.eventId, input.gameId ?? null, input.message.trim()]);
  return true;
}

export async function listReports(db: Queryable, status?: string) {
  return db.query<{
    id: string;
    event_id: string | null;
    neutral_title: string | null;
    message: string;
    status: string;
    resolution_note: string;
    created_at: Date | string;
  }>(
    `select r.id, r.event_id, e.neutral_title, r.message, r.status, r.resolution_note, r.created_at
     from error_reports r left join events e on e.id = r.event_id
     ${status ? "where r.status = $1" : ""} order by r.created_at desc limit 200`,
    status ? [status] : [],
  );
}

export async function resolveReport(db: Queryable, id: string, status: "bearbeitet" | "verworfen", note: string) {
  await db.run("update error_reports set status = $2, resolution_note = $3 where id = $1", [id, status, note.slice(0, 1000)]);
}
