import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { assertSameOrigin, jsonError, limit, requirePlayer } from "@/server/http";
import { createParty } from "@/server/services/parties";

export const dynamic = "force-dynamic";
const Body = z.object({ name: z.string().max(60).optional() });

/** Party erstellen: liefert den kurzen Code; der Ersteller ist Teilnehmer. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    limit(req, "party-neu", 20);
    const body = Body.parse(await req.json().catch(() => ({})));
    const db = await getDb();
    const player = await requirePlayer(db);
    return NextResponse.json(await createParty(db, player, body.name), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return jsonError(e);
  }
}
