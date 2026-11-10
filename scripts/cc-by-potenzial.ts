import { evaluateLicense, type CommonsMeta } from "../src/server/pipeline/license";
import { parseCommonsDay } from "../src/server/pipeline/evaluate";
import { categoryImages, commonsMeta, findCandidates, type Candidate } from "../src/server/pipeline/sources";

/**
 * Messung (nur Lesen, kein Datenbankzugriff): Wie viele zufällig gezogene Wikidata-Ereignisse haben ein Foto, das Tag, Größe und Lizenzregeln erfüllt?
 * Unterschieden wird zwischen automatisch erlaubten Lizenzen (CC0, US-Regierung), CC BY 4.0 mit erfüllten Herkunftsregeln (Zusätzliche Rechteprüfung)
 * und nur theoretisch nutzbaren Lizenzen (CC BY 2.0/3.0, BY-SA, CC BY 4.0 ohne erfüllte Regeln).
 *   npx tsx scripts/cc-by-potenzial.ts [Stichprobe je Suchweg, Standard 12]
 */
const perVariant = Number(process.argv[2]) || 12;
const variants = (process.argv[3] ? process.argv[3].split(",") : ["sport", "kultur", "gesellschaft", "breit", "us"]) as ("sport" | "kultur" | "gesellschaft" | "breit" | "us")[];
type Tier = "auto" | "ccby4_regeln_erfuellt" | "theoretisch" | "keines";

function tier(m: CommonsMeta, year: number, date: string): Tier {
  const d = evaluateLicense(m, { eventYear: year, eventDate: date, auto: ["cc0", "pd-usgov"] });
  if (d.allowed) return "auto";
  if (d.licenseClass === "cc-by-4.0" && d.rulesMet) return "ccby4_regeln_erfuellt";
  if (d.manual && d.licenseClass) return "theoretisch";
  return "keines";
}

const rows: Record<string, Record<Tier, number> & { n: number; mitBild: number }> = {};
const examples: string[] = [];
const licenses: Record<string, number> = {};
for (const v of variants) {
  rows[v] = { n: 0, mitBild: 0, auto: 0, ccby4_regeln_erfuellt: 0, theoretisch: 0, keines: 0 };
  let cands: Candidate[] = [];
  try {
    const maxOff = v === "breit" ? 120 : v === "us" ? 60 : 10;
    cands = await findCandidates(perVariant, Math.floor(Math.random() * maxOff), { variant: v });
    if (!cands.length) cands = await findCandidates(perVariant, 0, { variant: v });
  } catch (e) {
    console.error(`Suchweg ${v}: ${(e as Error).message}`);
  }
  for (const c of cands) {
    rows[v].n++;
    const [y, mo, d] = c.date.split("-").map(Number);
    const pool: CommonsMeta[] = [];
    try {
      const main = await commonsMeta(c.commonsFile);
      if (main) pool.push(main);
      if (c.commonsCategory) pool.push(...(await categoryImages(c.commonsCategory, 40)));
    } catch {
      continue;
    }
    // nur Bilder, die Größe und Aufnahmetag erfüllen
    const fit = pool.filter((m) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(m.mime)) return false;
      if (Math.max(m.width, m.height) < 1200 || Math.min(m.width, m.height) < 792) return false;
      const t = parseCommonsDay(m.dateOriginal);
      return !!t && t.y === y && t.m === mo && t.d === d;
    });
    if (!fit.length) continue;
    rows[v].mitBild++;
    const order: Tier[] = ["auto", "ccby4_regeln_erfuellt", "theoretisch", "keines"];
    const best = fit.map((m) => ({ m, t: tier(m, y, c.date) })).sort((a, b) => order.indexOf(a.t) - order.indexOf(b.t))[0];
    rows[v][best.t]++;
    licenses[best.m.license || "ohne"] = (licenses[best.m.license || "ohne"] ?? 0) + 1;
    if (best.t === "ccby4_regeln_erfuellt") examples.push(`${c.articleTitle} (${c.date}) – ${best.m.license}, ${best.m.artist.slice(0, 50)}`);
  }
}

const sum = (k: Tier | "n" | "mitBild") => Object.values(rows).reduce((a, r) => a + r[k], 0);
console.log("Suchweg        Kandidaten  passendes Foto  automatisch  CC-BY-4.0(Regeln erfüllt)  theoretisch  nicht nutzbar");
for (const [v, r] of Object.entries(rows)) console.log(`${v.padEnd(14)} ${String(r.n).padStart(10)} ${String(r.mitBild).padStart(15)} ${String(r.auto).padStart(12)} ${String(r.ccby4_regeln_erfuellt).padStart(25)} ${String(r.theoretisch).padStart(12)} ${String(r.keines).padStart(14)}`);
console.log(`${"Summe".padEnd(14)} ${String(sum("n")).padStart(10)} ${String(sum("mitBild")).padStart(15)} ${String(sum("auto")).padStart(12)} ${String(sum("ccby4_regeln_erfuellt")).padStart(25)} ${String(sum("theoretisch")).padStart(12)} ${String(sum("keines")).padStart(14)}`);
console.log("\nLizenzen der jeweils besten passenden Fotos:", licenses);
