import "./env";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/server/db/client";
import { importRedaktion, type RedaktionFile } from "../src/server/services/redaktion-import";

/**
 * Importiert die redaktionellen Recherche-Entwürfe (content/recherche/jahrsager-10-ereignisse.json) als ENTWÜRFE.
 * Wiederholbar (Schlüssel: Slug). Nichts wird freigegeben, eingeplant oder veröffentlicht.
 *   npm run import:redaktion              Import (legt nur fehlende Entwürfe an)
 *   npm run import:redaktion -- --update  überschreibt zusätzlich geänderte, noch unbearbeitete Entwürfe
 */
const file = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "recherche", "jahrsager-10-ereignisse.json"), "utf8")) as RedaktionFile;
const db = await getDb();
const r = await importRedaktion(db, file, { update: process.argv.includes("--update") });
console.log(`Datenbank-Treiber: ${db.driver}`);
console.log(`Neu angelegt (${r.created.length}): ${r.created.join(", ") || "–"}`);
console.log(`Unverändert (${r.unchanged.length}): ${r.unchanged.join(", ") || "–"}`);
for (const p of r.proposals) console.log(`${p.applied ? "Aktualisiert" : "Änderungsvorschlag"} ${p.slug}: ${p.fields.join(", ")}`);
if (r.skipped.length) console.log(`Übersprungen (bereits weiterbearbeitet, nicht überschrieben): ${r.skipped.join(", ")}`);
if (r.spoilers.length) {
  console.error("Zeit-Spoiler gefunden, nicht importiert:\n" + r.spoilers.join("\n"));
  process.exitCode = 1;
}
await db.close();
