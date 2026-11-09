import "./env";
import sharp from "sharp";
import { todayKey } from "../src/server/clock";
import { getDb } from "../src/server/db/client";
import { draftCard } from "../src/server/pipeline/ai";
import { logRun, pipelineStats } from "../src/server/pipeline/admin";
import { aiBudget, aiCallsAllowed, aiCallsUsed, poolLevel, poolThresholds } from "../src/server/pipeline/monitor";
import { planPacks, poolEvents } from "../src/server/pipeline/plan";
import { processCandidate, type Deps, type Outcome } from "../src/server/pipeline/process";
import { findEventImage } from "../src/server/pipeline/imagesearch";
import { commonsMeta, downloadImage, findCandidates, reachable, wikipediaInfo, type Candidate } from "../src/server/pipeline/sources";
import { processUpload } from "../src/server/images";

/**
 * Zeitgesteuerter Redaktionsprozess (GitHub Actions, siehe .github/workflows/redaktion.yml).
 *   npm run pipeline -- research [--max 25] [--target 300]   Kandidaten recherchieren/prüfen (budgetiert), Vorrat auffüllen
 *   npm run pipeline -- plan [--days 30]                     fehlende Tagespakete aus dem geprüften Pool planen
 *   npm run pipeline -- monitor                              Vorrat, Veröffentlichung und Läufe prüfen; Exit 1 bei kritischem Zustand
 *   npm run pipeline -- all                                  research, plan, monitor (Standard)
 * Ein kritischer Zustand beendet den Lauf mit Fehler: GitHub benachrichtigt den Repository-Inhaber per E-Mail über fehlgeschlagene Workflows.
 */
const args = process.argv.slice(2);
const arg = (k: string, d: number) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const mode = args.find((a) => !a.startsWith("--")) ?? "all";
const apiKey = process.env.ANTHROPIC_API_KEY;
const thresholds = poolThresholds();

const db = await getDb();
let failed = false;
let aiCalls = 0;
let aiLimit = 0;

const deps: Deps = {
  commonsMeta,
  wikipediaInfo,
  reachable,
  previewJpegBase64: async (meta) => {
    const buf = await downloadImage(meta);
    return (await sharp(buf).rotate().resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()).toString("base64");
  },
  storeImage: async (meta) => processUpload(await downloadImage(meta)),
  // KI-Aufrufe nur mit Schlüssel und innerhalb des Budgets (je Lauf, Tag und Monat)
  draft: (input) => {
    if (!apiKey || aiCalls >= aiLimit) return null;
    aiCalls++;
    return draftCard(input, apiKey);
  },
};

try {
  if (mode === "research" || mode === "all") {
    await logRun(db, "research", async () => {
      const target = arg("target", thresholds.target);
      const maxPerRun = arg("max", 25);
      const before = (await poolEvents(db)).length;
      const stats: Record<string, number> = {};
      const outcomes: Outcome[] = [];
      const used = await aiCallsUsed(db);
      aiLimit = aiCallsAllowed(used, aiBudget());
      if (before < target && apiKey && aiLimit > 0) {
        // Zwei Suchwege: Ereignisse in den USA (dort sind Bilder von Bundesbehörden häufig) zuerst, danach weltweit.
        const rnd = (n: number) => Math.floor(Math.random() * n);
        const batch: Candidate[] = [];
        const seenIds = new Set<string>();
        for (const part of [await findCandidates(maxPerRun * 2, rnd(150), { variant: "us" }), await findCandidates(maxPerRun, rnd(400))]) {
          for (const c of part) if (!seenIds.has(c.sourceId)) { seenIds.add(c.sourceId); batch.push(c); }
        }
        let processed = 0;
        for (const c of batch) {
          if (processed >= maxPerRun || aiCalls >= aiLimit || (await poolEvents(db)).length >= target) break;
          try {
            // Bildsuche je Ereignis: ein Foto aus der Ereigniskategorie, das Lizenz-, Datums- und Größenregeln erfüllt, ersetzt das Wikidata-Standardbild.
            const better = await findEventImage(c).catch(() => null);
            if (better) c.commonsFile = better.file;
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
        console.log("ANTHROPIC_API_KEY fehlt: keine Recherche (es werden keine Texte ohne Quelle erzeugt).");
      } else if (aiLimit <= 0) {
        console.log(`KI-Budget erschöpft (heute ${used.today}, Monat ${used.month} Aufrufe): keine Recherche in diesem Lauf.`);
      }
      const after = (await poolEvents(db)).length;
      console.log(`Vorrat: ${before} → ${after} (Ziel ${target}); KI-Aufrufe: ${aiCalls}.`, stats);
      // Gründe je Kandidat (gekürzt), damit im Protokoll sichtbar ist, woran die Ausbeute scheitert
      const reasons = new Map<string, number>();
      for (const o of outcomes) for (const r of o.reason.split(" | ")) reasons.set(`${o.decision}: ${r.slice(0, 110)}`, (reasons.get(`${o.decision}: ${r.slice(0, 110)}`) ?? 0) + 1);
      for (const [r, n] of [...reasons].sort((x, y) => y[1] - x[1]).slice(0, 15)) console.log(`  ${n}× ${r}`);
      return { before, after, target, aiCalls, ...stats, apiKey: Boolean(apiKey) };
    });
  }
  if (mode === "plan" || mode === "all") {
    await logRun(db, "plan", async () => {
      const r = await planPacks(db, { days: arg("days", 30) });
      console.log(`Pakete geplant: ${r.planned.join(", ") || "–"}; ohne ausreichenden Pool: ${r.missing.join(", ") || "–"}; Vorrat ${r.stock} (${r.stockDays} Tage).`);
      if (r.missing.length) console.warn(["WARNUNG: Für manche Tage ist keine regelkonforme Auswahl möglich:", ...r.warnings].join(String.fromCharCode(10)));
      return r;
    });
  }
  if (mode === "monitor" || mode === "all") {
    await logRun(db, "monitor", async () => {
      const s = await pipelineStats(db);
      const lvl = poolLevel(s.stock, thresholds);
      const today = todayKey();
      const prepared = s.nextPacks.filter((p) => p.pack_date >= today).length;
      const todayReady = s.nextPacks.some((p) => p.pack_date === today);
      const problems: string[] = [];
      if (lvl.level === "critical" || lvl.level === "blocker") problems.push(lvl.message);
      if (!todayReady) problems.push(`Für heute (${today}) ist kein Tagesrätsel vorbereitet.`);
      console.log(`Vorrat: ${lvl.message} Vorbereitete Tage (nächste 7 sichtbar): ${prepared}. Fehlgeschlagene Läufe (letzte 10): ${s.lastErrors}.`);
      if (lvl.level === "warn" || lvl.level === "boost") console.warn(lvl.message);
      if (problems.length) throw new Error("ALARM: " + problems.join(" "));
      return { stock: s.stock, level: lvl.level, preparedDays: prepared, lastErrors: s.lastErrors };
    });
  }
} catch (e) {
  failed = true;
  console.error((e as Error).message);
}
await db.close();
if (failed) process.exit(1);
