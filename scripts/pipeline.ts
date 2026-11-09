import "./env";
import sharp from "sharp";
import { getDb } from "../src/server/db/client";
import { draftCard } from "../src/server/pipeline/ai";
import { logRun, STOCK_TARGET } from "../src/server/pipeline/admin";
import { planPacks, poolEvents } from "../src/server/pipeline/plan";
import { processCandidate, type Deps, type Outcome } from "../src/server/pipeline/process";
import { commonsMeta, downloadImage, findCandidates, reachable, wikipediaInfo } from "../src/server/pipeline/sources";
import { processUpload } from "../src/server/images";

/**
 * Zeitgesteuerter Redaktionsprozess (GitHub Actions, siehe .github/workflows/redaktion.yml).
 *   npm run pipeline -- research [--max 25] [--target 150]   Kandidaten recherchieren, prüfen, Vorrat auffüllen
 *   npm run pipeline -- plan [--days 14]                     fehlende Tagespakete aus dem geprüften Pool planen
 *   npm run pipeline -- all                                  beides (Standard)
 */
const args = process.argv.slice(2);
const arg = (k: string, d: number) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const mode = args.find((a) => !a.startsWith("--")) ?? "all";
const apiKey = process.env.ANTHROPIC_API_KEY;

const deps: Deps = {
  commonsMeta,
  wikipediaInfo,
  reachable,
  previewJpegBase64: async (meta) => {
    const buf = await downloadImage(meta);
    return (await sharp(buf).rotate().resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()).toString("base64");
  },
  storeImage: async (meta) => processUpload(await downloadImage(meta)),
  draft: (input) => (apiKey ? draftCard(input, apiKey) : null),
};

const db = await getDb();
let failed = false;
try {
  if (mode === "research" || mode === "all") {
    await logRun(db, "research", async () => {
      const target = arg("target", STOCK_TARGET);
      const maxPerRun = arg("max", 25);
      const before = (await poolEvents(db)).length;
      const stats: Record<string, number> = {};
      const outcomes: Outcome[] = [];
      if (before < target && apiKey) {
        const offset = Math.floor(Math.random() * 400);
        const batch = await findCandidates(maxPerRun * 3, offset);
        let processed = 0;
        for (const c of batch) {
          if (processed >= maxPerRun || (await poolEvents(db)).length >= target) break;
          try {
            const o = await processCandidate(db, c, deps);
            outcomes.push(o);
            stats[o.decision] = (stats[o.decision] ?? 0) + 1;
            if (o.decision !== "uebersprungen") processed++;
          } catch (e) {
            stats.fehler = (stats.fehler ?? 0) + 1;
            console.error(`Kandidat ${c.sourceId}: ${(e as Error).message}`);
          }
        }
      } else if (!apiKey) {
        console.log("ANTHROPIC_API_KEY fehlt: keine Recherche (keine Texte ohne Quelle erzeugt).");
      }
      const after = (await poolEvents(db)).length;
      console.log(`Vorrat: ${before} → ${after} (Ziel ${target}).`, stats);
      return { before, after, target, ...stats, apiKey: Boolean(apiKey) };
    });
  }
  if (mode === "plan" || mode === "all") {
    await logRun(db, "plan", async () => {
      const r = await planPacks(db, { days: arg("days", 14) });
      console.log(`Pakete geplant: ${r.planned.join(", ") || "–"}; ohne ausreichenden Pool: ${r.missing.join(", ") || "–"}; Vorrat ${r.stock} (${r.stockDays} Tage).`);
      if (r.missing.length) console.warn(["WARNUNG: Für manche Tage ist keine regelkonforme Auswahl möglich:", ...r.warnings].join(String.fromCharCode(10)));
      return r;
    });
  }
} catch (e) {
  failed = true;
  console.error((e as Error).message);
}
await db.close();
if (failed) process.exit(1);
