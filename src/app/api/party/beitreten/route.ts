import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { assertSameOrigin, jsonError, limit, requirePlayer } from "@/server/http";
import { joinParty } from "@/server/services/parties";

export const dynamic = "force-dynamic";
const Body = z.object({ code: z.string().max(40), name: z.string().max(60).optional() });

/** Party beitreten (Code beliebig geschrieben): idempotent, auch als Gast. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    limit(req, "party-join", 30);
    const body = Body.parse(await req.json().catch(() => null));
    const db = await getDb();
    const player = await requirePlayer(db);
    return NextResponse.json(await joinParty(db, player, body.code, body.name), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return jsonError(e);
  }
}
