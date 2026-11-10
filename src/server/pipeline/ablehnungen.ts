import type { Queryable } from "../db/client";

/** Ablehnungs- bzw. Prüfgründe der automatischen Ereignisproduktion, gruppiert nach den fachlichen Kategorien. */
export const REASON_CATEGORIES = {
  cc_by: "CC BY bisher nicht zugelassen",
  cc_by_sa: "CC BY-SA bisher nicht zugelassen",
  lizenz: "Ungeeignete oder unbekannte Lizenz",
  urheber: "Fehlende Urheberangabe",
  rechtekette: "Unklare Rechtekette",
  aufnahmedatum: "Fehlendes oder unklar dokumentiertes Aufnahmedatum",
  bild: "Ungeeignetes historisches Bild",
  quellen: "Fehlende historische Faktenquellen",
  dublette: "Doppeltes Ereignis",
  sonstige: "Sonstige Qualitätsprobleme",
} as const;
export type ReasonCategory = keyof typeof REASON_CATEGORIES;

/** Ordnet einen einzelnen Grund (wie von assess() und der Pipeline protokolliert, auch ältere Formulierungen) einer Kategorie zu. */
export function classifyReason(reason: string): ReasonCategory {
  const r = reason.trim();
  if (/dublette|bereits bekannt/i.test(r)) return "dublette";
  if (/kein identifizierbarer urheber|fehlende urheber|keine urheber/i.test(r)) return "urheber";
  if (/(CC[ -]BY[ -]SA)/i.test(r) && !/NC|ND/i.test(r.replace(/CC BY-SA/gi, ""))) return "cc_by_sa";
  if (/CC[ -]BY[ -]?(NC|ND)|nicht freie lizenz|keine lizenzangabe|fair use|keine freie lizenz/i.test(r)) return "lizenz";
  if (/(CC[ -]BY)/i.test(r)) return /Regeln nicht vollständig|Herkunft|Berechtigung|Agentur|Einschränkung|Widersprüchlich/i.test(r) ? "rechtekette" : "cc_by";
  if (/urheberrechtlich geschützt|nicht in der allowlist|lizenz .* nicht|ist nicht in der allowlist|lizenzvariante/i.test(r)) return "lizenz";
  if (/copyright-hinweis|agentur|public domain ohne nachweis|zusätzliche einschränkung|rechtekette|berechtigung|persönlichkeitsrecht|personen erkennbar/i.test(r)) return "rechtekette";
  if (/aufnahmedatum|aufnahme \(|kein aufnahmedatum|stammt nicht aus dem ereignisjahr|datierung/i.test(r)) return "aufnahmedatum";
  if (/bildqualität|bildkontrolle|zeigt das ereignis nicht|beschriftung\/datum|qualität zweifelhaft|bildgröße|format .* ungeeignet/i.test(r)) return "bild";
  if (/faktenquellen|unabhängige.*quelle|keine quelle/i.test(r)) return "quellen";
  return "sonstige";
}

export interface RejectionRow {
  decision: string;
  reason: string;
}

export interface RejectionReport {
  total: number;
  byDecision: Record<string, number>;
  /** Kandidaten, die mindestens einen Grund dieser Kategorie hatten */
  anyReason: Record<ReasonCategory, number>;
  /** Kandidaten, bei denen diese Kategorie der EINZIGE Grund war (Entfernen der Hürde würde sie freigeben) */
  soleReason: Record<ReasonCategory, number>;
  /** nur theoretisch zusätzlich nutzbar, wenn CC BY/BY-SA zugelassen würden (alle Gründe sind Lizenzgründe dieser Art) */
  licenseOnlyTheoretical: number;
  topCombos: { combo: string; n: number }[];
}

const empty = (): Record<ReasonCategory, number> => Object.fromEntries(Object.keys(REASON_CATEGORIES).map((k) => [k, 0])) as Record<ReasonCategory, number>;

export function analyseRejections(rows: RejectionRow[]): RejectionReport {
  const anyReason = empty();
  const soleReason = empty();
  const byDecision: Record<string, number> = {};
  const combos = new Map<string, number>();
  let licenseOnly = 0;
  for (const row of rows) {
    byDecision[row.decision] = (byDecision[row.decision] ?? 0) + 1;
    const cats = [...new Set(row.reason.split(" | ").filter(Boolean).map(classifyReason))];
    if (!cats.length) cats.push("sonstige");
    for (const c of cats) anyReason[c]++;
    if (cats.length === 1) soleReason[cats[0]]++;
    if (cats.every((c) => c === "cc_by" || c === "cc_by_sa")) licenseOnly++;
    const key = cats.map((c) => REASON_CATEGORIES[c]).sort().join(" + ");
    combos.set(key, (combos.get(key) ?? 0) + 1);
  }
  return {
    total: rows.length,
    byDecision,
    anyReason,
    soleReason,
    licenseOnlyTheoretical: licenseOnly,
    topCombos: [...combos].map(([combo, n]) => ({ combo, n })).sort((a, b) => b.n - a.n).slice(0, 8),
  };
}

export async function loadRejections(db: Queryable): Promise<RejectionRow[]> {
  return db.query<RejectionRow>("select decision, reason from pipeline_seen where decision in ('rejected', 'manual_review', 'error')");
}

export function formatRejections(r: RejectionReport): string {
  const lines = [`Abgelehnte/zurückgestellte Kandidaten: ${r.total} (${Object.entries(r.byDecision).map(([k, v]) => `${k}: ${v}`).join(", ")})`, "", "Grund (mind. ein Grund) | allein ausschlaggebend"];
  for (const k of Object.keys(REASON_CATEGORIES) as ReasonCategory[]) lines.push(`  ${REASON_CATEGORIES[k]}: ${r.anyReason[k]} | ${r.soleReason[k]}`);
  lines.push("", `Nur theoretisch zusätzlich nutzbar, wenn CC BY/BY-SA zugelassen würden (nur Lizenzgründe): ${r.licenseOnlyTheoretical}`);
  lines.push("Hinweis: „theoretisch“ ≠ freigabefähig. Tatsächlich freigabefähig sind nur Kandidaten, die zusätzlich Herkunftsregeln, Aufnahmedatum, Bildqualität, Quellen und Personenrechte bestehen.");
  lines.push("", "Häufigste Kombinationen:", ...r.topCombos.map((c) => `  ${c.n}× ${c.combo}`));
  return lines.join("\n");
}
