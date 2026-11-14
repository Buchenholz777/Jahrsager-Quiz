import { assess } from "../src/server/pipeline/evaluate";
import { classifyReason, REASON_CATEGORIES } from "../src/server/pipeline/ablehnungen";
import { findEventImage } from "../src/server/pipeline/imagesearch";
import { britannicaUrl, commonsMeta, findCandidates, pickExternalSources, reachable, wikipediaInfo, type Candidate } from "../src/server/pipeline/sources";

/**
 * Engpass-Messung (nur Lesen, ohne KI und ohne Datenbank): Welche Regel hält Kandidaten bei der automatischen Ereignisproduktion auf?
 *   PIPELINE_CONTACT=https://www.jahrsagerquiz.de npx tsx scripts/engpass.ts [Kandidaten je Suchweg, Standard 15]
 * Jeder Kandidat durchläuft die Bildsuche und die Regelprüfung (assess) ohne Textentwurf. „Bestanden“ = keine harte Ablehnung und nur die
 * fehlenden Textentwurf-/KI-Prüfungen offen.
 */
const per = Number(process.argv[2]) || 15;
const variants = ["breit", "us", "sport", "kultur", "gesellschaft"] as const;
const hist: Record<string, number> = {};
const outcome = { n: 0, ohneBild: 0, abgelehnt: 0, manuell: 0, bestanden: 0 };
const good: string[] = [];

for (const v of variants) {
  let cands: Candidate[] = [];
  try {
    const maxOff = v === "breit" ? 120 : v === "us" ? 60 : 30;
    cands = await findCandidates(per, Math.floor(Math.random() * maxOff), { variant: v });
    if (!cands.length) cands = await findCandidates(per, 0, { variant: v });
  } catch (e) {
    console.error(`${v}: ${(e as Error).message}`);
  }
  for (const c of cands) {
    outcome.n++;
    try {
      const better = await findEventImage(c).catch(() => null);
      const meta = better ?? (await commonsMeta(c.commonsFile));
      const wiki = await wikipediaInfo(c.articleUrl);
      if (!meta || !wiki) { outcome.ohneBild++; hist["Daten nicht abrufbar"] = (hist["Daten nicht abrufbar"] ?? 0) + 1; continue; }
      const en = c.enArticleUrl ? await wikipediaInfo(c.enArticleUrl).catch(() => null) : null;
      const external = await pickExternalSources([...wiki.externalLinks, ...(en?.externalLinks ?? []), ...(britannicaUrl(c) ? [britannicaUrl(c)!] : [])], reachable, 2);
      const a = assess({ eventDate: c.date, meta, wikipediaUrl: c.articleUrl, externalSources: external, draft: null, duplicate: null, sitelinks: c.sitelinks });
      const reasons = a.reasons.filter((r) => !/Textentwurf/i.test(r));
      for (const r of reasons) { const k = REASON_CATEGORIES[classifyReason(r)]; hist[k] = (hist[k] ?? 0) + 1; }
      if (a.decision === "rejected") outcome.abgelehnt++;
      else if (reasons.length) outcome.manuell++;
      else { outcome.bestanden++; good.push(`${c.articleTitle} (${c.date}) · ${meta.license} · ${c.sitelinks} Sprachen`); }
    } catch {
      /* nächster Kandidat */
    }
  }
}
console.log(outcome);
console.log("Gründe (ein Kandidat kann mehrere haben):", hist);
console.log("Bestanden:\n  " + (good.join("\n  ") || "keine"));
