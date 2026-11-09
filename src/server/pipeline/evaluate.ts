import type { AuditEntry } from "../types";
import type { CardDraft } from "./ai";
import { validateDraft } from "./ai";
import { auditEntry, evaluateLicense, type CommonsMeta } from "./license";

export type PipelineDecision = "auto_approved" | "manual_review" | "rejected";

const MONTHS: Record<string, number> = {
  january: 1, januar: 1, february: 2, februar: 2, march: 3, märz: 3, april: 4, may: 5, mai: 5, june: 6, juni: 6, july: 7, juli: 7,
  august: 8, september: 9, october: 10, oktober: 10, november: 11, december: 12, dezember: 12,
};

/** Liest ein (ggf. nur teilweise angegebenes) Aufnahmedatum aus den Commons-Metadaten. */
export function parseCommonsDay(s: string): { y: number; m?: number; d?: number } | null {
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return { y: +iso[1], m: +iso[2], d: +iso[3] };
  const dmy = /(\d{1,2})\.?\s+([A-Za-zä]+)\s+(\d{4})/.exec(s);
  if (dmy && MONTHS[dmy[2].toLowerCase()]) return { y: +dmy[3], m: MONTHS[dmy[2].toLowerCase()], d: +dmy[1] };
  const my = /([A-Za-zä]+)\s+(\d{4})/.exec(s);
  if (my && MONTHS[my[1].toLowerCase()]) return { y: +my[2], m: MONTHS[my[1].toLowerCase()] };
  const y = /\b(19\d{2}|20[01]\d|2020)\b/.exec(s);
  return y ? { y: +y[1] } : null;
}

export interface AssessInput {
  eventDate: string; // YYYY-MM-DD (Wikidata)
  meta: CommonsMeta;
  wikipediaUrl: string;
  /** erreichbare Faktenquellen außerhalb von Wikipedia/Wikidata auf der Allowlist */
  externalSources: string[];
  draft: CardDraft | null;
  duplicate: string | null;
  minWidth?: number;
}
export interface Assessment {
  decision: PipelineDecision;
  reasons: string[];
  audit: AuditEntry[];
}

/**
 * Regelbasierte Entscheidung. Eine KI-Bewertung kann nur DOWNGRADEN (Veto), nie fehlende Nachweise ersetzen:
 * Auto-Freigabe verlangt, dass ALLE Regeln erfüllt sind. Bei fehlenden Informationen: keine Auto-Freigabe.
 */
export function assess(i: AssessInput): Assessment {
  const audit: AuditEntry[] = [];
  const reject: string[] = [];
  const manual: string[] = [];
  const year = +i.eventDate.slice(0, 4);

  // 1 Zeitraum
  if (year < 1900 || year > 2020) reject.push(`Ereignisjahr ${year} außerhalb 1900–2020.`);

  // 2 Dublette
  if (i.duplicate) reject.push(`Dublette: ${i.duplicate}`);

  // 3 Lizenz (strikte Allowlist)
  const lic = evaluateLicense(i.meta);
  audit.push(auditEntry("lizenz", lic.allowed ? "ok" : lic.manual ? "manuell" : "abgelehnt", lic.reasons, { license: i.meta.license, licenseUrl: i.meta.licenseUrl, artist: i.meta.artist, credit: i.meta.credit, klasse: lic.licenseClass ?? null }));
  if (!lic.allowed) (lic.manual ? manual : reject).push(...lic.reasons);

  // 4 Datierung: Aufnahmedatum muss zum Ereignis passen
  const taken = parseCommonsDay(i.meta.dateOriginal);
  const [ey, em, ed] = i.eventDate.split("-").map(Number);
  let dateRule: string;
  if (!taken) {
    dateRule = "Kein Aufnahmedatum in den Commons-Metadaten.";
    manual.push(dateRule);
  } else if (taken.y !== ey) {
    dateRule = `Aufnahme (${taken.y}) stammt nicht aus dem Ereignisjahr (${ey}).`;
    reject.push(dateRule);
  } else if (taken.m === em && taken.d === ed) {
    dateRule = "Aufnahmedatum entspricht dem belegten Ereignistag.";
  } else {
    dateRule = "Aufnahmedatum nur jahres-/monatsgenau oder abweichender Tag: Zuordnung unbestätigt.";
    manual.push(dateRule);
  }
  audit.push(auditEntry("datierung", /entspricht/.test(dateRule) ? "ok" : /nicht aus dem/.test(dateRule) ? "abgelehnt" : "manuell", [dateRule], { aufnahme: i.meta.dateOriginal, ereignis: i.eventDate }));

  // 5 Bildqualität
  const minW = i.minWidth ?? 1200;
  const q = i.meta.width >= minW && ["image/jpeg", "image/png", "image/webp"].includes(i.meta.mime);
  audit.push(auditEntry("bildqualitaet", q ? "ok" : "abgelehnt", [q ? `Breite ${i.meta.width}px ≥ ${minW}px.` : `Breite ${i.meta.width}px (< ${minW}px) oder Format ${i.meta.mime} ungeeignet.`]));
  if (!q) reject.push("Bildqualität nicht ausreichend.");

  // 6 Faktenquellen (≥ 2, davon mind. eine externe Institution)
  const src = i.externalSources.length >= 1;
  audit.push(auditEntry("quellen", src ? "ok" : "manuell", [src ? `Wikipedia + ${i.externalSources.length} externe Quelle(n).` : "Keine erreichbare Quelle auf der Allowlist außer Wikipedia."], { wikipedia: i.wikipediaUrl, extern: i.externalSources }));
  if (!src) manual.push("Weniger als zwei geeignete Faktenquellen.");

  // 7 Inhalte (KI-Entwurf formal prüfen, Bild-Veto)
  if (!i.draft) {
    manual.push("Kein Textentwurf vorhanden.");
    audit.push(auditEntry("inhalt", "manuell", ["Kein Textentwurf."]));
  } else {
    const probs = i.draft.insufficient ? ["Wikipedia-Auszug reicht für die Texte nicht aus."] : validateDraft(i.draft, year);
    audit.push(auditEntry("inhalt", probs.length ? "manuell" : "ok", probs.length ? probs : ["Formale Prüfung bestanden (Wortzahlen, keine Zeitspoiler)."]));
    manual.push(...probs);
    const c = i.draft.image_check;
    const v: string[] = [];
    if (c.matches_event === "no") reject.push("Bildkontrolle: Foto zeigt das Ereignis nicht.");
    else if (c.matches_event !== "yes") v.push("Bildkontrolle: Zuordnung zum Ereignis unklar.");
    if (c.persons_visible) v.push("Personen erkennbar (Persönlichkeitsrechte): manuelle Prüfung.");
    if (c.caption_or_date_visible) v.push("Beschriftung/Datum im Bild könnte das Jahr verraten.");
    if (!c.quality_ok) v.push("Bildkontrolle: Qualität zweifelhaft.");
    audit.push(auditEntry("bildkontrolle", c.matches_event === "no" ? "abgelehnt" : v.length ? "manuell" : "ok", v.length ? v : ["Bildkontrolle ohne Beanstandung (nur Veto-Funktion, kein Nachweis)."], { note: c.note }));
    manual.push(...v);
  }

  const decision: PipelineDecision = reject.length ? "rejected" : manual.length ? "manual_review" : "auto_approved";
  audit.push(auditEntry("entscheidung", decision === "auto_approved" ? "ok" : decision === "rejected" ? "abgelehnt" : "manuell", [...reject, ...manual, ...(decision === "auto_approved" ? ["Alle Auto-Freigabe-Regeln erfüllt."] : [])]));
  return { decision, reasons: [...reject, ...manual], audit };
}
