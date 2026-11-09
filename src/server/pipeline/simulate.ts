import { CATEGORIES, MAIN_CATEGORIES } from "@/lib/constants";
import { distribution, isSpace, packViolations, pickDiversePack, type Distribution, type SelEvent } from "./select";

/** Reproduzierbarer Zufall (nur für synthetische Tests). */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted<T>(rnd: () => number, items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of items) if ((r -= w) <= 0) return v;
  return items[items.length - 1][0];
}

/**
 * SYNTHETISCHE Metadaten ausschließlich für technische Tests der Auswahl – keine echten Ereignisse.
 * `skew`: true = realistisch einseitiger Pool (viel Raumfahrt/Technik, 1960er–1980er, Europa/USA).
 */
export function syntheticPool(n: number, seed = 1, skew = false): SelEvent[] {
  const rnd = mulberry32(seed);
  const out: SelEvent[] = [];
  for (let i = 0; i < n; i++) {
    const category = skew
      ? weighted<string>(rnd, [["raumfahrt", 25], ["technik", 20], ["wissenschaft", 15], ["politik", 14], ["sport", 5], ["gesellschaft", 5], ["musik", 3], ["film", 3], ["architektur", 3], ["natur", 3], ["wirtschaft", 2], ["entdeckung", 2]])
      : weighted<string>(rnd, MAIN_CATEGORIES.map((c) => [c as string, c === "raumfahrt" ? 0.6 : 1] as [string, number]));
    const decade = skew
      ? weighted<number>(rnd, [[1960, 25], [1970, 15], [1980, 25], [1990, 8], [2000, 15], [1900, 2], [1910, 2], [1920, 2], [1930, 2], [1940, 2], [1950, 2]])
      : 1900 + Math.floor(rnd() * 12) * 10;
    const region = weighted<string>(rnd, [["europa", 35], ["nordamerika", 25], ["asien", 15], ["afrika", 7], ["suedamerika", 7], ["ozeanien", 3], ["global", 8]]);
    const group = rnd() < 0.1 ? `serie-${Math.floor(rnd() * 12)}` : `synthetisch-${i}`; // 10 % gehören zu ähnlichen Serien
    out.push({
      id: `syn-${i}`,
      category,
      correct_year: Math.min(2020, decade + Math.floor(rnd() * 10)),
      difficulty: weighted<number>(rnd, [[1, 40], [2, 40], [3, 20]]),
      region,
      country: "",
      tags: [`kat-${category}`, `thema-${i}`],
      topic_key: group,
      image_width: 1200 + Math.floor(rnd() * 2400),
    });
  }
  return out;
}

export interface SimulationResult {
  packs: SelEvent[][];
  failed: number;
  violations: string[];
  warnings: number;
  dist: Distribution;
  perWindow: { days: number; space: number; categories: number; decades: number }[];
}

export function simulate(pool: SelEvent[], days: number, seed = 7): SimulationResult {
  const rnd = mulberry32(seed);
  const packs: SelEvent[][] = [];
  const history: SelEvent[] = [];
  let remaining = [...pool];
  let failed = 0;
  let warnings = 0;
  const violations: string[] = [];
  for (let d = 0; d < days; d++) {
    const r = pickDiversePack(remaining, history, rnd, 1500);
    if (!r.set) {
      failed++;
      continue;
    }
    warnings += r.warnings.length;
    const v = packViolations(r.set, history, r.warnings.length === 0);
    if (v.length) violations.push(`Tag ${d + 1}: ${v.join("; ")}`);
    packs.push(r.set);
    history.push(...r.set);
    remaining = remaining.filter((e) => !r.set!.includes(e));
  }
  const flat = packs.flat();
  const labels = CATEGORIES as unknown as Record<string, string>;
  const perWindow = [7, 14, 30].map((w) => {
    const ev = packs.slice(0, w).flat();
    return { days: w, space: ev.filter(isSpace).length, categories: new Set(ev.map((e) => e.category)).size, decades: new Set(ev.map((e) => Math.floor(e.correct_year / 10))).size };
  });
  return { packs, failed, violations, warnings, dist: distribution(flat, labels), perWindow };
}
