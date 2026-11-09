import "./env";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/server/db/client";
import { processUpload } from "../src/server/images";
import { type CardDraft, validateDraft } from "../src/server/pipeline/ai";
import { logRun } from "../src/server/pipeline/admin";
import { processCandidate, type Deps } from "../src/server/pipeline/process";
import { commonsMeta, downloadImage, reachable, wikipediaInfo } from "../src/server/pipeline/sources";

/**
 * Kuratierter Import: Kandidaten und Texte aus einer Datei (content/recherche/kuratiert-N.json), z. B. aus einer
 * Redaktionssitzung. Durchläuft dieselben Pipeline-Regeln wie die Automatik (Lizenz-Allowlist, Datierung, Qualität,
 * Quellen, Dubletten, Zeitspoiler, Wortzahlen). Aufruf: npm run import:kuratiert -- kuratiert-1 [--dry]
 */
interface Entry {
  sourceId: string;
  date: string;
  commonsFile: string;
  article: string;
  extra_sources: string[];
  draft: CardDraft;
}
const name = process.argv[2] ?? "kuratiert-1";
const dry = process.argv.includes("--dry");
const file = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "recherche", `${name}.json`), "utf8")) as { events: Entry[] };

if (dry) {
  let bad = 0;
  for (const e of file.events) {
    const p = validateDraft(e.draft, +e.date.slice(0, 4));
    console.log(p.length ? "✗" : "✓", e.article, p.join(" | "));
    bad += p.length;
  }
  process.exit(bad ? 1 : 0);
}

const byId = new Map(file.events.map((e) => [e.sourceId, e]));
const deps: Deps = {
  commonsMeta,
  wikipediaInfo: async (url) => {
    const info = await wikipediaInfo(url);
    const extra = [...byId.values()].find((e) => url.endsWith(encodeURIComponent(e.article.replace(/ /g, "_"))))?.extra_sources ?? [];
    return info ? { ...info, externalLinks: [...extra, ...info.externalLinks] } : null;
  },
  reachable,
  previewJpegBase64: async () => "",
  storeImage: async (meta) => processUpload(await downloadImage(meta)),
  draft: null as never,
};

const db = await getDb();
await logRun(db, "kuratiert", async () => {
  const stats: Record<string, number> = {};
  for (const e of file.events) {
    const d: Deps = { ...deps, draft: async () => e.draft };
    const o = await processCandidate(
      db,
      { sourceId: e.sourceId, date: e.date, commonsFile: e.commonsFile, articleUrl: `https://de.wikipedia.org/wiki/${encodeURIComponent(e.article.replace(/ /g, "_"))}`, articleTitle: e.article },
      d,
    );
    stats[o.decision] = (stats[o.decision] ?? 0) + 1;
    console.log(o.decision.padEnd(14), e.article, o.reason ? `| ${o.reason}` : "");
  }
  return stats;
});
await db.close();
