// TEMPORÄR: Verbindungsdiagnose für den Cloudflare-Betrieb. Nach der Fehlersuche entfernen.
import { getDb, hyperdriveUrl } from "@/server/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const hyperdrive = Boolean(await hyperdriveUrl());
  try {
    const db = await getDb();
    const row = await db.one<{ n: number }>("select count(*)::int as n from events");
    return Response.json({ ok: true, hyperdrive, driver: db.driver, events: row?.n });
  } catch (e) {
    const err = e as Error;
    return Response.json({ ok: false, hyperdrive, message: String(err.message).replace(/:[^:@/\s]+@/g, ":***@") }, { status: 500 });
  }
}
