import { CATEGORY_GROUP, MAIN_CATEGORIES, REGIONS, ROUNDS_PER_GAME, type CategoryKey } from "@/lib/constants";

/** Schmale Sicht auf ein Ereignis für die Auswahl (aus der Datenbank oder – in Tests – synthetisch). */
export interface SelEvent {
  id: string;
  category: string;
  correct_year: number;
  difficulty: number;
  region: string;
  country: string;
  tags: string[];
  topic_key: string;
  image_width?: number | null;
}

/** Zielanteile (langfristig). Raumfahrt höchstens etwa 5 %, Wissenschaft + Technik zusammen höchstens 25 %. */
export const TARGETS = {
  space: 0.05,
  scienceTechMax: 0.25,
  region: { europa: 0.3, nordamerika: 0.2, asien: 0.2, afrika: 0.1, suedamerika: 0.1, ozeanien: 0.05, global: 0.05 } as Record<string, number>,
};
export const SPACE_WINDOW = 20; // Raumfahrt höchstens einmal innerhalb von 20 Ereignissen
export const TOPIC_WINDOW = 10; // dasselbe Thema nicht innerhalb der letzten 10 Ereignisse

const group = (e: SelEvent): CategoryKey => CATEGORY_GROUP[e.category as CategoryKey] ?? (e.category as CategoryKey);
export const decadeOf = (y: number) => Math.floor(y / 10) * 10;
export const isSpace = (e: SelEvent) => group(e) === "raumfahrt" || e.tags.includes("raumfahrt");

function similar(a: SelEvent, b: SelEvent): boolean {
  if (a.topic_key && a.topic_key === b.topic_key) return true;
  const shared = a.tags.filter((t) => b.tags.includes(t));
  return shared.length >= 2;
}

/** Harte Regeln für ein Tagesrätsel. Gibt Verstöße zurück (leer = zulässig). `history` ist chronologisch (alt → neu). */
export function packViolations(set: SelEvent[], history: SelEvent[], strictDifficulty = true): string[] {
  const v: string[] = [];
  const counts = new Map<string, number>();
  for (const e of set) counts.set(group(e), (counts.get(group(e)) ?? 0) + 1);
  if (counts.size < 4) v.push(`Nur ${counts.size} Themenfelder (mind. 4).`);
  for (const [c, n] of counts) if (n > 2) v.push(`${n} Ereignisse im Themenfeld ${c} (höchstens 2).`);
  const decades = new Set(set.map((e) => decadeOf(e.correct_year)));
  if (decades.size < 3) v.push(`Nur ${decades.size} Jahrzehnte (mind. 3).`);
  const regions = new Map<string, number>();
  for (const e of set) if (e.region && e.region !== "global") regions.set(e.region, (regions.get(e.region) ?? 0) + 1);
  for (const [r, n] of regions) if (n >= 3) v.push(`${n} Ereignisse aus der Region ${r} (überwiegend dieselbe Region).`);
  for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) if (similar(set[i], set[j])) v.push(`Ähnliche Ereignisse im Paket (${set[i].topic_key || set[i].tags.join("/")}).`);
  if (set.filter(isSpace).length > 1) v.push("Mehr als ein Raumfahrtereignis im Paket.");
  const recent = history.slice(-(SPACE_WINDOW - 1));
  if (set.some(isSpace) && recent.some(isSpace)) v.push(`Raumfahrt innerhalb der letzten ${SPACE_WINDOW} Ereignisse bereits vorgekommen.`);
  const topics = history.slice(-TOPIC_WINDOW);
  for (const e of set) if (topics.some((h) => similar(h, e))) v.push(`Thema kürzlich schon behandelt (${e.topic_key || e.tags.join("/")}).`);
  const d = [1, 2, 3].map((k) => set.filter((e) => e.difficulty === k).length);
  if (strictDifficulty && (d[0] !== 2 || d[1] !== 2 || d[2] !== 1)) v.push(`Schwierigkeitsmix ${d.join("/")} statt 2/2/1.`);
  if (!strictDifficulty && (d[0] < 2 || d[2] > 1)) v.push(`Schwierigkeitsmix ${d.join("/")}: mind. 2 leichte, höchstens 1 schwere.`);
  return v;
}

function shares<T extends string>(items: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
  const n = items.length || 1;
  for (const [k, c] of m) m.set(k, c / n);
  return m;
}

/** Qualitative Bewertung (kleiner = besser): bevorzugt unterrepräsentierte Themen, Regionen und Jahrzehnte sowie gute Bilder. */
export function scoreSet(set: SelEvent[], history: SelEvent[]): number {
  const h = history.slice(-60);
  const catShare = shares(h.map((e) => group(e)));
  const regShare = shares(h.filter((e) => e.region).map((e) => e.region));
  const decShare = shares(h.map((e) => String(decadeOf(e.correct_year))));
  const equal = 1 / MAIN_CATEGORIES.length;
  let s = 0;
  for (const e of set) {
    const c = group(e);
    const target = c === "raumfahrt" ? TARGETS.space : equal;
    s += (catShare.get(c) ?? 0) - target; // schon häufig → schlechter
    if (e.region) s += ((regShare.get(e.region) ?? 0) - (TARGETS.region[e.region] ?? 0.1)) * 0.6;
    s += ((decShare.get(String(decadeOf(e.correct_year))) ?? 0) - 1 / 12) * 0.5;
    s -= Math.min(e.image_width ?? 2000, 3000) / 3000 * 0.05; // Bildqualität (leichter Bonus)
  }
  const sciTech = (catShare.get("wissenschaft") ?? 0) + (catShare.get("technik") ?? 0);
  const inSet = set.filter((e) => ["wissenschaft", "technik"].includes(group(e))).length;
  if (sciTech > TARGETS.scienceTechMax && inSet) s += inSet * 0.3;
  return s;
}

export interface PickResult {
  set: SelEvent[] | null;
  warnings: string[];
  reasons: string[];
}

/** Wählt fünf Ereignisse: harte Regeln zuerst, dann beste Bewertung. Lässt sich keine zulässige Auswahl finden, wird nichts veröffentlicht. */
export function pickDiversePack(pool: SelEvent[], history: SelEvent[], rnd: () => number = Math.random, trials = 3000): PickResult {
  if (pool.length < ROUNDS_PER_GAME) return { set: null, warnings: [], reasons: [`Pool zu klein (${pool.length} Ereignisse).`] };
  for (const strict of [true, false]) {
    let best: { set: SelEvent[]; score: number } | null = null;
    for (let t = 0; t < trials; t++) {
      const idx = new Set<number>();
      while (idx.size < ROUNDS_PER_GAME) idx.add(Math.floor(rnd() * pool.length));
      const set = [...idx].map((i) => pool[i]);
      if (packViolations(set, history, strict).length) continue;
      const score = scoreSet(set, history) + rnd() * 0.02; // minimale Streuung
      if (!best || score < best.score) best = { set, score };
    }
    if (best) return { set: best.set, warnings: strict ? [] : ["Schwierigkeitsmix 2/2/1 nicht erreichbar; gelockert (mind. 2 leichte, höchstens 1 schwere)."], reasons: [] };
  }
  return { set: null, warnings: [], reasons: diagnose(pool, history) };
}

function diagnose(pool: SelEvent[], history: SelEvent[]): string[] {
  const r: string[] = [];
  const cats = new Set(pool.map((e) => group(e)));
  if (cats.size < 4) r.push(`Der Pool enthält nur ${cats.size} Themenfelder (mind. 4 nötig).`);
  const decades = new Set(pool.map((e) => decadeOf(e.correct_year)));
  if (decades.size < 3) r.push(`Der Pool enthält nur ${decades.size} Jahrzehnte (mind. 3 nötig).`);
  const nonSpace = pool.filter((e) => !isSpace(e)).length;
  if (nonSpace < ROUNDS_PER_GAME - 1) r.push("Zu wenige Nicht-Raumfahrt-Ereignisse im Pool.");
  if (history.slice(-(SPACE_WINDOW - 1)).some(isSpace) && nonSpace < ROUNDS_PER_GAME) r.push("Raumfahrt wurde kürzlich verwendet; zu wenige andere Themen im Pool.");
  if (!r.length) r.push("Keine Kombination erfüllt alle Regeln (Themen, Regionen, Jahrzehnte, Ähnlichkeit, Schwierigkeit).");
  return r;
}

export interface Distribution {
  total: number;
  byCategory: { key: string; label: string; n: number; share: number }[];
  byRegion: { key: string; label: string; n: number; share: number }[];
  byDecade: { decade: number; n: number; share: number }[];
  spaceShare: number;
  sciTechShare: number;
  similarGroups: { topic: string; n: number }[];
}

/** Verteilung über eine Menge von Ereignissen (für Dashboard, Simulation und Protokoll). */
export function distribution(events: SelEvent[], labels: Record<string, string>): Distribution {
  const n = events.length || 1;
  const cat = new Map<string, number>(), reg = new Map<string, number>(), dec = new Map<number, number>(), topic = new Map<string, number>();
  for (const e of events) {
    cat.set(group(e), (cat.get(group(e)) ?? 0) + 1);
    reg.set(e.region || "unbekannt", (reg.get(e.region || "unbekannt") ?? 0) + 1);
    dec.set(decadeOf(e.correct_year), (dec.get(decadeOf(e.correct_year)) ?? 0) + 1);
    if (e.topic_key) topic.set(e.topic_key, (topic.get(e.topic_key) ?? 0) + 1);
  }
  const rl: Record<string, string> = { ...REGIONS, unbekannt: "unbekannt" };
  return {
    total: events.length,
    byCategory: MAIN_CATEGORIES.map((k) => ({ key: k, label: labels[k] ?? k, n: cat.get(k) ?? 0, share: (cat.get(k) ?? 0) / n })),
    byRegion: [...reg].map(([key, c]) => ({ key, label: rl[key] ?? key, n: c, share: c / n })).sort((a, b) => b.n - a.n),
    byDecade: [...dec].map(([decade, c]) => ({ decade, n: c, share: c / n })).sort((a, b) => a.decade - b.decade),
    spaceShare: events.filter(isSpace).length / n,
    sciTechShare: events.filter((e) => ["wissenschaft", "technik"].includes(group(e))).length / n,
    similarGroups: [...topic].filter(([, c]) => c > 1).map(([t, c]) => ({ topic: t, n: c })).sort((a, b) => b.n - a.n),
  };
}
