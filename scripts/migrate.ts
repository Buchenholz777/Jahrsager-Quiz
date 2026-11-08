import "./env";
import { getDb, migrate } from "../src/server/db/client";

const db = await getDb();
const applied = await migrate(db);
console.log(applied.length ? `Angewendet: ${applied.join(", ")}` : "Datenbank ist aktuell.");
await db.close();
