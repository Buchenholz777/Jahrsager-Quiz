import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { jsonError, limit, readPlayerId } from "@/server/http";
import { getPartyView } from "@/server/services/parties";

export const dynamic = "force-dynamic";

/** Stand der Party aus Sicht der anfragenden Person. Fremde Ergebnisse erscheinen erst nach dem eigenen Abschluss. */
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    limit(req, "party-get", 120);
    const { code } = await ctx.params;
    return NextResponse.json({ party: await getPartyView(await getDb(), await readPlayerId(), code) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return jsonError(e);
  }
}
