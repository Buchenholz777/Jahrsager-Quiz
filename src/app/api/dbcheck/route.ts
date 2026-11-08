// TEMPORÄR: Verbindungsdiagnose für den Cloudflare-Betrieb. Nach der Fehlersuche entfernen.
import { getDb } from "@/server/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const row = await db.one<{ n: number }>("select count(*)::int as n from events where status <> $1", ["x"]);
    return Response.json({ ok: true, driver: db.driver, events: row?.n });
  } catch (e) {
    return Response.json({ ok: false, message: String((e as Error).message).slice(0, 300) }, { status: 500 });
  }
}
