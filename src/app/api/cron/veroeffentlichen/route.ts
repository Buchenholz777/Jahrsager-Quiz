import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { todayKey } from "@/server/clock";
import { publishDuePacks } from "@/server/services/packs";

export const dynamic = "force-dynamic";

/** Veröffentlicht fällige Tagespakete. Geschützt per CRON_SECRET (Vercel Cron sendet "Authorization: Bearer"). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 401 });
  }
  await publishDuePacks(await getDb(), todayKey());
  return NextResponse.json({ ok: true });
}
