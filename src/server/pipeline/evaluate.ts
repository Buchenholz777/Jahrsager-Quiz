import type { AuditEntry } from "../types";
import type { CardDraft } from "./ai";
import { validateDraft } from "./ai";
import { AUTO_TECHNICAL_EDITS, buildAttribution, classifyEdits, type ImageEdits, type ImageRights, type RightsStatus } from "@/lib/bildrechte";
import { auditEntry, evaluateLicense, parseCreativeCommons, type CommonsMeta, type LicenseDecision } from "./license";

export type PipelineDecision = "auto_approved" | "manual_review" | "rejected";

/** Die drei fachlichen Statuskategorien (siehe docs/LIZENZPOLITIK.md). */
export const DECISION_STATUS: Record<PipelineDecision, RightsStatus> = {
  auto_approved: "automatisch_freigabefaehig",
  manual_review: "rechtepruefung_erforderlich",
  rejected: "abgelehnt",
};

/** Baut die Rechtedaten eines Bildes aus den Commons-Metadaten und der Lizenzentscheidung (Status wird von assess() gesetzt). */
export function buildRights(meta: CommonsMeta, lic: LicenseDecision, edits: ImageEdits, checkedBy: "auto" | "admin"): ImageRights {
  const cc = parseCreativeCommons(meta.license, meta.licenseUrl);
  const notice = /(©|(c)s*d{4}|copyright)/i.test(meta.artist) ? meta.artist : "";
  return {
    workTitle: (meta.title ?? "").trim(),
    author: (meta.artist ?? "").trim(),
    rightsHolder: "",
    institution: /^(own work|eigenes werk)/i.test(meta.credit ?? "") ? "" : (meta.credit ?? "").length <= 100 && !/https?:|wayback/i.test(meta.credit ?? "") ? (meta.credit ?? "").trim() : "",
    originalSourceUrl: meta.pageUrl,
    originalFileUrl: meta.url,
    license: meta.license,
    licenseVersion: cc?.version ?? "",
    licenseUrl: meta.licenseUrl,
    copyrightNotice: notice,
    edits,
    rightsCheckedAt: new Date().toISOString(),
    status: lic.allowed ? "automatisch_freigabefaehig" : lic.manual ? "rechtepruefung_erforderlich" : "abgelehnt",
    basis: lic.basis ?? lic.reasons.join(" "),
    checkedBy,
    restrictions: meta.restrictions ? [meta.restrictions] : [],
  };
}

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
  /** Mindestzahl unabhängiger externer Quellen (verschiedene Institutionen/Domains); Standard 2 bzw. MIN_EXTERNAL_SOURCES */
  minExternal?: number;
  /** Bearbeitungsvermerke (Standard: technische Anpassung ohne Zuschnitt) */
  edits?: string[];
}
export interface Assessment {
  decision: PipelineDecision;
  reasons: string[];
  audit: AuditEntry[];
  /** Rechtedaten und Bildnachweis des geprüften Bildes */
  rights: ImageRights;
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
  const lic = evaluateLicense(i.meta, { eventYear: year, eventDate: i.eventDate });
  audit.push(auditEntry("lizenz", lic.allowed ? "ok" : lic.manual ? "manuell" : "abgelehnt", lic.reasons, { license: i.meta.license, licenseUrl: i.meta.licenseUrl, artist: i.meta.artist, credit: i.meta.credit, klasse: lic.licenseClass ?? null, grundlage: lic.basis ?? null }));
  if (!lic.allowed) (lic.manual ? manual : reject).push(...lic.reasons);

  // 3a Bilddatei, Bearbeitung und Pflichtangaben des Bildnachweises
  const edits = classifyEdits(i.edits ?? AUTO_TECHNICAL_EDITS);
  const rights = buildRights(i.meta, lic, edits, "auto");
  audit.push(auditEntry("bilddatei", "info", ["Verwendete Bilddatei"], { datei: i.meta.file, dateiseite: i.meta.pageUrl, original: i.meta.url, groesse: `${i.meta.width}×${i.meta.height}`, format: i.meta.mime }));
  audit.push(auditEntry("bearbeitung", edits.licenseRelevant.length ? "manuell" : "ok", [edits.licenseRelevant.length ? `Lizenzrechtlich relevante Bearbeitung: ${edits.licenseRelevant.join("; ")}` : "Nur technische Anpassungen (kein Zuschnitt, keine inhaltliche Veränderung)."], { technisch: edits.technical, relevant: edits.licenseRelevant }));
  if (edits.licenseRelevant.length) manual.push("Bild wurde zugeschnitten oder inhaltlich bearbeitet: Kennzeichnung und Kontext prüfen.");
  const attribution = buildAttribution(rights);
  if (lic.allowed && attribution.missing.length) {
    manual.push(`Pflichtangaben für den Bildnachweis fehlen: ${attribution.missing.join(", ")}.`);
    audit.push(auditEntry("bildnachweis", "manuell", [`Unvollständig: ${attribution.missing.join(", ")}`]));
  } else {
    audit.push(auditEntry("bildnachweis", "ok", ["Bildnachweis vollständig erzeugt."], { nachweis: attribution.full }));
  }

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
  const longSide = Math.max(i.meta.width, i.meta.height);
  const shortSide = Math.min(i.meta.width, i.meta.height);
  const q = longSide >= minW && shortSide >= Math.round(minW * 0.66) && ["image/jpeg", "image/png", "image/webp"].includes(i.meta.mime);
  audit.push(auditEntry("bildqualitaet", q ? "ok" : "abgelehnt", [q ? `Bildgröße ${i.meta.width}×${i.meta.height}px ausreichend (lange Seite ≥ ${minW}px).` : `Bildgröße ${i.meta.width}×${i.meta.height}px zu klein (lange Seite ≥ ${minW}px, kurze ≥ ${Math.round(minW * 0.66)}px) oder Format ${i.meta.mime} ungeeignet.`]));
  if (!q) reject.push("Bildqualität nicht ausreichend.");

  // 6 Faktenquellen (≥ 2, davon mind. eine externe Institution)
  // Wikipedia/Wikidata zählen nicht als unabhängige Belege: nötig sind externe Institutionen (verschiedene Domains) auf der Allowlist.
  const needExt = i.minExternal ?? (Number(process.env.MIN_EXTERNAL_SOURCES) || 2);
  const hosts = new Set(i.externalSources.map((u) => { try { return new URL(u).hostname.replace(/^www./, "").split(".").slice(-2).join("."); } catch { return u; } }));
  const src = hosts.size >= needExt;
  audit.push(auditEntry("quellen", src ? "ok" : "manuell", [src ? `${hosts.size} unabhängige externe Quelle(n) (mind. ${needExt}).` : `Nur ${hosts.size} unabhängige externe Quelle(n) auf der Allowlist (mind. ${needExt}); Wikipedia/Wikidata gelten nicht als unabhängig.`], { wikipedia: i.wikipediaUrl, extern: i.externalSources }));
  if (!src) manual.push(`Weniger als ${needExt} unabhängige Faktenquellen.`);

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
    audit.push(auditEntry("personenrechte", c.persons_visible ? "manuell" : "ok", [c.persons_visible ? "Identifizierbare Personen erkennbar: Verwendung (Recht am eigenen Bild, §§ 22, 23 KUG) muss im redaktionellen Kontext vertretbar sein – keine automatische Freigabe." : "Keine identifizierbaren Personen erkannt (nur Veto-Funktion, kein Nachweis)."], { werblicheVerwendung: "Nicht für Startseite/Werbung ohne gesonderte Prüfung" }));
  }

  const decision: PipelineDecision = reject.length ? "rejected" : manual.length ? "manual_review" : "auto_approved";
  audit.push(auditEntry("entscheidung", decision === "auto_approved" ? "ok" : decision === "rejected" ? "abgelehnt" : "manuell", [...reject, ...manual, ...(decision === "auto_approved" ? ["Alle Auto-Freigabe-Regeln erfüllt."] : [])]));
  rights.status = DECISION_STATUS[decision];
  audit.push(auditEntry("rechtepruefung", decision === "auto_approved" ? "ok" : decision === "rejected" ? "abgelehnt" : "manuell", [`Status: ${DECISION_STATUS[decision]}`, `Grundlage: ${rights.basis || "–"}`], { geprueftAm: rights.rightsCheckedAt, lizenz: `${rights.license}`, version: rights.licenseVersion, quelle: rights.originalSourceUrl, nachweis: attribution.full }));
  return { decision, reasons: [...reject, ...manual], audit, rights };
}
