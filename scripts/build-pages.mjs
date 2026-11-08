// Baut die App mit OpenNext und legt das Ergebnis im Pages-Format nach dist/ ab:
// dist/ = statische Dateien, dist/_worker.js/ = Server (Advanced Mode von Cloudflare Pages).
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
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

// Pages erlaubt höchstens 25 MiB für den Worker. Entfernt werden nur Dateien, die auf Cloudflare nie geladen werden:
// lokale PGlite-Datenbank (dort gilt DATABASE_URL), React-Development-/Profiling-Builds, Node-Varianten von react-dom und @vercel/og.
const nm = path.join(worker, "server-functions", "default", "node_modules");
const drop = (p) => rmSync(p, { recursive: true, force: true });
drop(path.join(nm, "@electric-sql"));
const rd = path.join(nm, "react-dom", "cjs");
if (existsSync(rd)) {
  for (const f of readdirSync(rd)) {
    const keep = f === "react-dom-server.edge.production.js" || f === "react-dom-server.browser.production.js" || f === "react-dom.production.js";
    if (!keep) drop(path.join(rd, f));
  }
}
const sch = path.join(nm, "scheduler", "cjs");
if (existsSync(sch)) for (const f of readdirSync(sch)) if (/mock|post_task|native|development/.test(f)) drop(path.join(sch, f));
drop(path.join(nm, "next", "dist", "compiled", "@vercel", "og", "index.node.js"));
drop(path.join(nm, "next", "dist", "compiled", "next-server", "app-page-turbo-experimental.runtime.prod.js"));
drop(path.join(nm, "next", "dist", "compiled", "next-server", "pages-turbo.runtime.prod.js"));

const sizeOf = (p) => {
  let t = 0;
  for (const e of readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    t += e.isDirectory() ? sizeOf(f) : statSync(f).size;
  }
  return t;
};
const mib = sizeOf(worker) / 1024 / 1024;
console.log("Worker-Größe: " + mib.toFixed(1) + " MiB (Limit 25 MiB)");
if (mib > 25) throw new Error("Worker größer als 25 MiB – weitere Dateien müssen entfernt werden.");

// Statische Build-Dateien direkt vom CDN ausliefern, alles andere über den Worker.
writeFileSync(
  path.join("dist", "_routes.json"),
  JSON.stringify({ version: 1, include: ["/*"], exclude: ["/_next/static/*", "/brand/*", "/favicon.ico"] }, null, 2),
);
console.log("Pages-Ausgabe in dist/ erstellt.");
