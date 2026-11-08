// TEMPORÄR: Verbindungsdiagnose für den Cloudflare-Betrieb. Nach der Fehlersuche entfernen.
import { getDb } from "@/server/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = { url: Boolean(process.env.SUPABASE_URL), key: Boolean(process.env.SUPABASE_SERVICE_KEY), dburl: Boolean(process.env.DATABASE_URL) };
  try {
    const db = await getDb();
    const row = await db.one<{ n: number }>("select count(*)::int as n from events where status <> $1", ["x"]);
    return Response.json({ ok: true, driver: db.driver, env, events: row?.n });
  } catch (e) {
    return Response.json({ ok: false, env, message: String((e as Error).message).slice(0, 300) }, { status: 500 });
  }
}
