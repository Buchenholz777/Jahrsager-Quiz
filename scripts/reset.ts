import "./env";
import fs from "node:fs";
import path from "node:path";

if (process.env.DATABASE_URL) {
  console.error("db:reset löscht nur die lokale PGlite-Datenbank (.data/pglite). DATABASE_URL ist gesetzt – Abbruch.");
  process.exit(1);
}
fs.rmSync(path.join(process.cwd(), ".data", "pglite"), { recursive: true, force: true });
fs.rmSync(path.join(process.cwd(), "storage", "images"), { recursive: true, force: true });
console.log("Lokale Datenbank und Bilder gelöscht. Danach: npm run db:seed");
