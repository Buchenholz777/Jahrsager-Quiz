// Baut die App mit OpenNext und legt das Ergebnis im Pages-Format nach dist/ ab:
// dist/ = statische Dateien, dist/_worker.js/ = Server (Advanced Mode von Cloudflare Pages).
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const run = (cmd) => execSync(cmd, { stdio: "inherit", shell: true });

run("npx opennextjs-cloudflare build");

const open = ".open-next";
if (!existsSync(path.join(open, "worker.js"))) throw new Error(".open-next/worker.js fehlt – OpenNext-Build fehlgeschlagen.");

rmSync("dist", { recursive: true, force: true });
cpSync(path.join(open, "assets"), "dist", { recursive: true });

const worker = path.join("dist", "_worker.js");
mkdirSync(worker, { recursive: true });
for (const entry of readdirSync(open)) {
  if (entry === "assets" || entry === "worker.js") continue;
  cpSync(path.join(open, entry), path.join(worker, entry), { recursive: true });
}
cpSync(path.join(open, "worker.js"), path.join(worker, "index.js"));

// Statische Build-Dateien direkt vom CDN ausliefern, alles andere über den Worker.
writeFileSync(
  path.join("dist", "_routes.json"),
  JSON.stringify({ version: 1, include: ["/*"], exclude: ["/_next/static/*", "/brand/*", "/favicon.ico"] }, null, 2),
);
console.log("Pages-Ausgabe in dist/ erstellt.");
