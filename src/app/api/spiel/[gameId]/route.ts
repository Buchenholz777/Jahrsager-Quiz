import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { jsonError, readPlayerId } from "@/server/http";
import { getGameState } from "@/server/services/games";
import { AppError } from "@/server/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await ctx.params;
    const player = await readPlayerId();
    if (!player) throw new AppError("NICHT_GEFUNDEN", "Partie nicht gefunden", 404);
    const state = await getGameState(await getDb(), player, gameId);
    if (!state) throw new AppError("NICHT_GEFUNDEN", "Partie nicht gefunden", 404);
    return NextResponse.json({ state }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return jsonError(e);
  }
}
