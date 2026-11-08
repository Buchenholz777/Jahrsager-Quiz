import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { assertSameOrigin, jsonError, limit, readPlayerId } from "@/server/http";
import { createReport } from "@/server/services/reports";
import { isUuid } from "@/server/services/games";
import { AppError } from "@/server/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  eventId: z.string().uuid(),
  gameId: z.string().uuid().optional(),
  message: z.string().trim().min(5, "Bitte beschreibe den Fehler kurz.").max(2000),
});

/** Fehlermeldung zu einem Ereignis. Nur für bereits aufgelöste Runden des eigenen Spiels. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    limit(req, "meldung", 10, 10 * 60_000);
    const body = Body.parse(await req.json().catch(() => null));
    const db = await getDb();
    const player = await readPlayerId();
    if (!player || !body.gameId || !isUuid(body.gameId)) throw new AppError("NICHT_ERLAUBT", "Meldung nicht möglich.", 403);
    const ok = await db.one(
      "select 1 from game_rounds r join games g on g.id = r.game_id where g.id = $1 and g.player_id = $2 and r.event_id = $3 and r.status <> 'offen'",
      [body.gameId, player, body.eventId],
    );
    if (!ok) throw new AppError("NICHT_ERLAUBT", "Meldung nur nach der Auflösung möglich.", 403);
    await createReport(db, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
