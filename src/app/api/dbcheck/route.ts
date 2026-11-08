// TEMPORÄR: Verbindungsdiagnose für den Cloudflare-Betrieb. Nach der Fehlersuche entfernen.
import { getDb } from "@/server/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const row = await db.one<{ n: number }>("select count(*)::int as n from events");
    return Response.json({ ok: true, driver: db.driver, events: row?.n });
  } catch (e) {
    const err = e as Error;
    return Response.json({ ok: false, name: err.name, message: String(err.message).replace(/:[^:@/]+@/g, ":***@"), stack: String(err.stack).split("\n").slice(0, 6) }, { status: 500 });
  }
}
