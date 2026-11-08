// TEMPORÄR: Verbindungsdiagnose für den Cloudflare-Betrieb. Nach der Fehlersuche entfernen.
import pg from "pg";

export const dynamic = "force-dynamic";

async function attempt(label: string, make: () => InstanceType<typeof pg.Client>) {
  const t = Date.now();
  const c = make();
  try {
    await c.connect();
    const r = await c.query("select count(*)::int as n from events");
    return { label, ok: true, events: r.rows[0]?.n, ms: Date.now() - t };
  } catch (e) {
    const err = e as Error;
    return { label, ok: false, error: String(err.message).replace(/:[^:@/\s]+@/g, ":***@"), ms: Date.now() - t };
  } finally {
    await c.end().catch(() => undefined);
  }
}

export async function GET() {
  const raw = process.env.DATABASE_URL ?? "";
  if (!raw) return Response.json({ ok: false, error: "DATABASE_URL fehlt" }, { status: 500 });
  const u = new URL(raw);
  const withPort = (port: string, query = "") => {
    const x = new URL(raw);
    x.port = port;
    x.search = query;
    return x.toString();
  };
  const base = { connectionTimeoutMillis: 8000 };
  const results = [];
  results.push(await attempt("6543 ssl{rejectUnauthorized:false}", () => new pg.Client({ ...base, connectionString: raw, ssl: { rejectUnauthorized: false } })));
  results.push(await attempt("6543 ssl:true", () => new pg.Client({ ...base, connectionString: raw, ssl: true })));
  results.push(await attempt("6543 sslmode=require", () => new pg.Client({ ...base, connectionString: withPort("6543", "?sslmode=require") })));
  results.push(await attempt("5432 ssl{rejectUnauthorized:false}", () => new pg.Client({ ...base, connectionString: withPort("5432"), ssl: { rejectUnauthorized: false } })));
  results.push(await attempt("6543 ohne ssl", () => new pg.Client({ ...base, connectionString: raw })));
  return Response.json({ host: u.hostname, port: u.port, results });
}
