import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { assertSameOrigin, jsonError, limit, requirePlayer } from "@/server/http";
import { startPartyGame } from "@/server/services/parties";

export const dynamic = "force-dynamic";

/** Startet oder setzt das eigene Party-Spiel fort. */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    assertSameOrigin(req);
    limit(req, "party-start", 60);
    const { code } = await ctx.params;
    const db = await getDb();
    const state = await startPartyGame(db, await requirePlayer(db), code);
    return NextResponse.json({ state }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return jsonError(e);
  }
}
