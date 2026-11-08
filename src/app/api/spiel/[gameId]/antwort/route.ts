import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_YEAR, MIN_YEAR } from "@/lib/constants";
import { getDb } from "@/server/db/client";
import { assertSameOrigin, jsonError, limit, readPlayerId } from "@/server/http";
import { answerRound } from "@/server/services/games";
import { track } from "@/server/services/analytics";
import { todayKey } from "@/server/clock";
import { AppError } from "@/server/types";

export const dynamic = "force-dynamic";

// year: Jahr 1900–2020 als Tipp, oder null für "Auflösen ohne Tipp" (0 Punkte).
const Body = z.object({
  position: z.number().int().min(1).max(5),
  year: z.number().int().min(MIN_YEAR).max(MAX_YEAR).nullable(),
});

export async function POST(req: Request, ctx: { params: Promise<{ gameId: string }> }) {
  try {
    assertSameOrigin(req);
    limit(req, "antwort", 120);
    const { gameId } = await ctx.params;
    const player = await readPlayerId();
    if (!player) throw new AppError("NICHT_GEFUNDEN", "Partie nicht gefunden", 404);
    const body = Body.parse(await req.json().catch(() => null));
    const db = await getDb();
    const { state, alreadyAnswered } = await answerRound(db, player, gameId, body.position, body.year);
    if (!alreadyAnswered) {
      await track(db, todayKey(), "round_complete", { round: body.position });
      if (state.status === "abgeschlossen" && state.official) await track(db, todayKey(), "game_complete", { points: state.totalPoints });
    }
    return NextResponse.json({ state, alreadyAnswered }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return jsonError(e);
  }
}
