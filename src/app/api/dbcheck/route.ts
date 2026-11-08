// TEMPORÄR: Verbindungsdiagnose für den Cloudflare-Betrieb. Nach der Fehlersuche entfernen.
import postgres from "postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const mask = (m: string) => m.replace(/:[^:@/\s]+@/g, ":***@");
  const out: Record<string, unknown> = {};
  for (const [name, ssl] of [["require", "require"], ["true", true], ["prefer", "prefer"]] as const) {
    const sql = postgres(url, { ssl: ssl as never, max: 1, prepare: false, connect_timeout: 8 });
    try {
      const rows = await sql`select count(*)::int as n from events`;
      out[name] = { ok: true, events: rows[0]?.n };
    } catch (e) {
      out[name] = { ok: false, message: mask(String((e as Error).message)) };
    } finally {
      await sql.end({ timeout: 1 }).catch(() => undefined);
    }
  }
  return Response.json(out);
}
