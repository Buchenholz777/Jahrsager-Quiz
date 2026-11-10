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
// Entwürfe für den Freigabe-Assistenten (Löschen-Test): echte Ereignisse (kein Demo) mit Bild
const { createEvent, emptyEventInput } = await import("../src/server/services/events");
for (const n of [1, 2, 3, 4]) {
  await createEvent(db, {
    ...emptyEventInput(),
    slug: `entwurf-test-${n}`,
    neutral_title: `Entwurf Testereignis ${n}`,
    description: "Eine Szene.",
    image_alt: "Testbild",
    correct_year: 1950 + n,
    public_title: `Entwurf ${n}`,
    explanation_what: "Was.",
    explanation_why: "Warum.",
    explanation_detail: "Detail.",
    sources: [{ label: "Quelle", url: "https://example.org/q" }],
    image_id: "phtest",
    image_ext: "svg",
    image_width: 1200,
    image_height: 800,
    is_demo: false,
    image_status: "zu_pruefen",
  });
}
await db.close();
console.log("E2E-Datenbank bereit.");
