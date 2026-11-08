import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { jsonError, readPlayerId } from "@/server/http";
import { getTodayStatus } from "@/server/services/games";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const status = await getTodayStatus(db, await readPlayerId());
    return NextResponse.json({ status }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return jsonError(e);
  }
}
