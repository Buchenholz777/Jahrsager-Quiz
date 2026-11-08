import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { assertSameOrigin, jsonError, limit, requirePlayer } from "@/server/http";
import { startGame } from "@/server/services/games";
import { track } from "@/server/services/analytics";
import { todayKey } from "@/server/clock";

export const dynamic = "force-dynamic";

const Body = z.object({
  packNumber: z.number().int().positive().optional(),
  practice: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    limit(req, "start", 60);
    const body = Body.parse(await req.json().catch(() => ({})));
    const db = await getDb();
    const player = await requirePlayer(db);
    const state = await startGame(db, player, body);
    const fresh = state.answered === 0;
    if (fresh) await track(db, todayKey(), state.official ? "game_start" : "archive_play");
    return NextResponse.json({ state }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return jsonError(e);
  }
}
