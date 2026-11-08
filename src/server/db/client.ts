import fs from "node:fs";
import path from "node:path";

/** Minimale, treiberunabhängige Datenbankschnittstelle (PGlite lokal, `pg` in Produktion). */
export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  one<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
  /** Führt ein Statement aus und liefert die Anzahl betroffener Zeilen. */
  run(sql: string, params?: unknown[]): Promise<number>;
  exec(sql: string): Promise<void>;
}
export interface Db extends Queryable {
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  readonly driver: "pglite" | "pg";
}

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

export async function migrate(db: Queryable): Promise<string[]> {
  await db.exec(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const done = new Set((await db.query<{ name: string }>("select name from schema_migrations")).map((r) => r.name));
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  const applied: string[] = [];
  for (const f of files) {
    if (done.has(f)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8");
    await db.exec(sql);
    await db.run("insert into schema_migrations(name) values ($1)", [f]);
    applied.push(f);
  }
  return applied;
}

export async function createPgliteDb(dataDir?: string): Promise<Db> {
  const { PGlite, types } = await import("@electric-sql/pglite");
  if (dataDir) fs.mkdirSync(dataDir, { recursive: true });
  const pg = new PGlite({
    dataDir,
    parsers: {
      [types.DATE]: (v: string) => v,
      [types.INT8]: (v: string) => parseInt(v, 10),
    },
  });
  await pg.waitReady;
  const wrap = (q: PgLike): Queryable => ({
    async query<T>(sql: string, params?: unknown[]) {
      return (await q.query(sql, params)).rows as T[];
    },
    async one<T>(sql: string, params?: unknown[]) {
      return ((await q.query(sql, params)).rows[0] as T | undefined) ?? null;
    },
    async run(sql: string, params?: unknown[]) {
      return (await q.query(sql, params)).affectedRows ?? 0;
    },
    async exec(sql: string) {
      await q.exec(sql);
    },
  });
  const base = wrap(pg);
  return {
    ...base,
    driver: "pglite",
    transaction: (fn) => pg.transaction((tx) => fn(wrap(tx as unknown as PgLike))),
    close: () => pg.close(),
  };
}

export async function createPgDb(connectionString: string, ssl: boolean): Promise<Db> {
  const pgMod = await import("pg");
  const pg = pgMod.default;
  pg.types.setTypeParser(1082, (v: string) => v); // DATE als String
  pg.types.setTypeParser(20, (v: string) => parseInt(v, 10)); // INT8 als Zahl
  const pool = new pg.Pool({ connectionString, max: 5, ssl: ssl ? { rejectUnauthorized: false } : undefined });
  const wrap = (c: { query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }> }): Queryable => ({
    async query<T>(sql: string, params?: unknown[]) {
      return (await c.query(sql, params)).rows as T[];
    },
    async one<T>(sql: string, params?: unknown[]) {
      return ((await c.query(sql, params)).rows[0] as T | undefined) ?? null;
    },
    async run(sql: string, params?: unknown[]) {
      return (await c.query(sql, params)).rowCount ?? 0;
    },
    async exec(sql: string) {
      await c.query(sql);
    },
  });
  return {
    ...wrap(pool),
    driver: "pg",
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const out = await fn(wrap(client));
        await client.query("commit");
        return out;
      } catch (e) {
        await client.query("rollback").catch(() => undefined);
        throw e;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

export async function createMemoryDb(): Promise<Db> {
  const db = await createPgliteDb();
  await migrate(db);
  return db;
}

const g = globalThis as unknown as { __zsDb?: Promise<Db> };

/** Prozessweite Verbindung (übersteht HMR im Entwicklungsmodus). */
export function getDb(): Promise<Db> {
  if (!g.__zsDb) {
    g.__zsDb = (async () => {
      const url = process.env.DATABASE_URL;
      if (url) return createPgDb(url, process.env.DATABASE_SSL === "true");
      const db = process.env.PGLITE_MEMORY === "1" ? await createPgliteDb() : await createPgliteDb(process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite"));
      await migrate(db); // lokale Entwicklung: automatisch
      return db;
    })();
  }
  return g.__zsDb;
}

export function setDbForTests(db: Db) {
  g.__zsDb = Promise.resolve(db);
}

type PgLike = {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[]; affectedRows?: number }>;
  exec(sql: string): Promise<unknown>;
};
