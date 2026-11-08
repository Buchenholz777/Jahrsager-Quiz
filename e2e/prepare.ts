// Bereitet eine frische lokale Datenbank (.data/e2e) mit Demo-Daten für den E2E-Lauf vor.
import fs from "node:fs";
import path from "node:path";

process.env.PGLITE_DIR = path.join(process.cwd(), ".data", "e2e");
fs.rmSync(process.env.PGLITE_DIR, { recursive: true, force: true });

const { getDb } = await import("../src/server/db/client");
const { seedDemo } = await import("../src/server/seed");
const { todayKey } = await import("../src/server/clock");
const db = await getDb();
await seedDemo(db, todayKey());
// Testdaten: Bilder der Ereignisse gelten als „echt“, damit die Startseiten-Komposition geprüft werden kann
await db.run("update events set image_is_placeholder = false");
await db.close();
console.log("E2E-Datenbank bereit.");
