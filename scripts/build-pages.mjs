// Baut die App mit OpenNext und legt das Ergebnis im Pages-Format nach dist/ ab:
// dist/ = statische Dateien, dist/_worker.js/ = Server (Advanced Mode von Cloudflare Pages).
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, lstatSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const run = (cmd) => execSync(cmd, { stdio: "inherit", shell: true });

// NEXT_PUBLIC_* wird beim Build fest eingebaut: Standard ist die Produktiv-Domain (per Umgebungsvariable überschreibbar).
process.env.NEXT_PUBLIC_SITE_URL ||= "https://www.jahrsagerquiz.de";
// Öffentliche Tag-Manager-Container-ID (kein Geheimnis). Geladen wird Google erst nach Einwilligung (siehe src/lib/tracking.ts).
process.env.NEXT_PUBLIC_GTM_ID ||= "GTM-NKQN3HHL";
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
cpSync(path.join(open, "worker.js"), path.join(worker, "app.js"));
// Start-Wrapper: stellt `require` für gebündelte CommonJS-Teile bereit und lädt dann die OpenNext-App.
writeFileSync(
  path.join(worker, "index.js"),
  `import { createRequire } from "node:module";
globalThis.require ??= createRequire("file:///worker.js");
export default {
  async fetch(request, env, ctx) {
    const mod = await import("./app.js");
    return mod.default.fetch(request, env, ctx);
  },
};
`,
);

// Pages kennt Module nur unter ihrem Pfad relativ zu _worker.js. OpenNext schreibt aber absolute Build-Pfade
// (z. B. /opt/buildhome/repo/.open-next/.../yoga.wasm?module) in den Code: auf relative Pfade umschreiben.
const absOpen = path.resolve(open).split(path.sep).join("/") + "/";
const rewrite = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { rewrite(f); continue; }
    if (!/\.(m?js|cjs)$/.test(e.name) || lstatSync(f).size > 12 * 1024 * 1024) continue;
    const src = readFileSync(f, "utf8");
    if (!src.includes(absOpen)) continue;
    let rel = path.relative(dir, worker).split(path.sep).join("/") || ".";
    if (!rel.startsWith(".")) rel = "./" + rel;
    writeFileSync(f, src.split(absOpen).join(rel + "/").replace(/(\.wasm)\?module/g, "$1"));
    console.log("Pfade umgeschrieben: " + f);
  }
};
rewrite(worker);

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

// Symlinks (z. B. auf sharp) sind im Pages-Worker nutzlos und teils defekt: entfernen.
const stripLinks = (p) => {
  for (const e of readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    if (e.isSymbolicLink()) drop(f);
    else if (e.isDirectory()) stripLinks(f);
  }
};
stripLinks(worker);

// Bereits als statische Dateien in dist/ vorhanden bzw. nur für ISR-Cache und AWS nötig: nicht noch einmal in den Worker packen.
drop(path.join(worker, "cache"));
drop(path.join(worker, "dynamodb-provider"));
drop(path.join(worker, "server-functions", "default", ".next", "static"));
drop(path.join(worker, "server-functions", "default", ".next", "cache"));

// Dev-, CLI- und Debug-Teile von Next.js und deren Hilfspakete: ein produktiver Worker lädt sie nie.
const nx = path.join(nm, "next", "dist");
for (const rel of [
  "server/dev", "server/mcp", "cli", "lib/typescript", "telemetry", "experimental", "export", "client/dev",
  "compiled/tar", "compiled/watchpack", "compiled/conf", "compiled/comment-json", "compiled/commander", "compiled/@napi-rs",
  "compiled/cross-spawn", "compiled/@mswjs", "compiled/edge-runtime", "compiled/@edge-runtime/primitives", "compiled/ws",
  "compiled/compression", "compiled/source-map", "compiled/stacktrace-parser", "compiled/is-docker", "compiled/is-wsl",
]) drop(path.join(nx, rel));
for (const f of ["react-dom-client.production.js"]) drop(path.join(rd, f));
for (const sub of ["build/swc", "build/static-paths", "build/segment-config", "build/next-config-ts", "build/output"]) drop(path.join(nx, sub));

const sizeOf = (p) => {
  let t = 0;
  for (const e of readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    t += e.isDirectory() ? sizeOf(f) : lstatSync(f).size;
  }
  return t;
};
// Größenaufstellung (zwei Ebenen) für die Fehlersuche im Build-Log.
const report = [];
const walk = (p, depth) => {
  for (const e of readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    if (e.isDirectory()) {
      if (depth < 3) { report.push([sizeOf(f), f]); walk(f, depth + 1); }
    }
  }
};
walk(worker, 1);
report.sort((a, b) => b[0] - a[0]);
for (const [b, f] of report.slice(0, 15)) console.log((b / 1024 / 1024).toFixed(1).padStart(6) + " MiB  " + f);
const files = [];
const collect = (p) => {
  for (const e of readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    if (e.isDirectory()) collect(f); else files.push([lstatSync(f).size, f]);
  }
};
collect(worker);
files.sort((a, b) => b[0] - a[0]);
console.log("Größte Dateien:");
for (const [b, f] of files.slice(0, 25)) console.log((b / 1024 / 1024).toFixed(2).padStart(7) + " MiB  " + f.replace("dist/_worker.js/", ""));
const mib = sizeOf(worker) / 1024 / 1024;
console.log("Worker-Größe: " + mib.toFixed(1) + " MiB (Limit 25 MiB)");
if (mib > 25) throw new Error("Worker größer als 25 MiB – weitere Dateien müssen entfernt werden.");

// Statische Build-Dateien direkt vom CDN ausliefern, alles andere über den Worker.
writeFileSync(
  path.join("dist", "_routes.json"),
  JSON.stringify({ version: 1, include: ["/*"], exclude: ["/_next/static/*", "/brand/*", "/favicon.ico", "/googleca51093de23aed0e.html"] }, null, 2),
);
console.log("Pages-Ausgabe in dist/ erstellt.");
