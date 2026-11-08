import "./env";
import { getDb } from "../src/server/db/client";
import { todayKey } from "../src/server/clock";
import { seedDemo } from "../src/server/seed";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  console.error("Seed-Daten sind Demo-Inhalte. In Produktion nur mit ALLOW_DEMO_SEED=true.");
  process.exit(1);
}
const db = await getDb();
const r = await seedDemo(db, todayKey());
console.log(r.created ? `${r.created} Demo-Ereignisse und 3 Tagespakete angelegt.` : "Demo-Daten sind bereits vorhanden.");
await db.close();
