import "./env";
import { getDb } from "../src/server/db/client";
import { analyseBestand, formatBestand, loadBestand } from "../src/server/pipeline/bestand";

// Reproduzierbarer Bestandscheck:  npm run bestand
// Liest die Datenbank aus DATABASE_URL bzw. SUPABASE_URL/SUPABASE_SERVICE_KEY; verändert nichts.
const db = await getDb();
console.log(formatBestand(analyseBestand(await loadBestand(db))));
await db.close();
