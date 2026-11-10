import "./env";
import { getDb } from "../src/server/db/client";
import { analyseRejections, formatRejections, loadRejections } from "../src/server/pipeline/ablehnungen";

// Auswertung der Ablehnungsgründe der automatischen Ereignisproduktion:  npm run ablehnungen
// Liest nur (pipeline_seen); verändert nichts.
const db = await getDb();
console.log(formatRejections(analyseRejections(await loadRejections(db))));
await db.close();
