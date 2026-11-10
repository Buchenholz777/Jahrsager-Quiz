import type { AuditEntry } from "../types";

/** Metadaten einer Commons-Datei (aus der Commons-API, `extmetadata`). */
export interface CommonsMeta {
  file: string;
  pageUrl: string;
  url: string;
  width: number;
  height: number;
  mime: string;
  license: string;
  licenseUrl: string;
  artist: string;
  credit: string;
  dateOriginal: string;
  copyrighted: boolean | null;
  restrictions: string;
  categories: string[];
  /** Werktitel (Commons ObjectName), soweit vorhanden */
  title?: string;
  /** Von der Quelle vorgegebener Attributionstext (Commons Attribution) */
  attribution?: string;
  attributionRequired?: boolean | null;
}

export type LicenseClass = "cc0" | "pd-usgov" | "cc-by-4.0" | "cc-by-3.0" | "cc-by-2.0" | "cc-by-sa-4.0" | "cc-by-sa-3.0";

export interface LicenseDecision {
  /** true = darf nach den geprüften Regeln unbeaufsichtigt freigegeben werden; false + manual = zusätzliche Rechteprüfung; false + !manual = abgelehnt */
  allowed: boolean;
  manual: boolean;
  licenseClass?: LicenseClass;
  /** Alle Automatikregeln der Lizenzklasse sind erfüllt (auch wenn die Klasse noch nicht für die unbeaufsichtigte Freigabe geschaltet ist). */
  rulesMet?: boolean;
  /** Grundlage der Rechteprüfung, z. B. institutionelle Herkunft */
  basis?: string;
  reasons: string[];
}

/**
 * Lizenzen, die erkannt, aber (noch) nicht unbeaufsichtigt freigegeben werden dürfen: Ihre Anforderungen
 * (Titel, ShareAlike bei Bearbeitung, Versionsunterschiede) sind noch nicht vollständig umgesetzt und getestet.
 */
const PREPARED: LicenseClass[] = ["cc-by-3.0", "cc-by-2.0", "cc-by-sa-4.0", "cc-by-sa-3.0"];

/**
 * Unbeaufsichtigt freigegebene Lizenzklassen. CC BY 4.0 ist grundsätzlich zugelassen, wird aber erst nach fachlicher Freigabe der Regeln
 * (docs/LIZENZPOLITIK.md) mit AUTO_APPROVE_CC_BY_4=true für die automatische Veröffentlichung geschaltet. Bis dahin: „Zusätzliche Rechteprüfung“.
 */
export function autoLicenseClasses(env: Record<string, string | undefined> = process.env): LicenseClass[] {
  return env.AUTO_APPROVE_CC_BY_4 === "true" ? ["cc0", "pd-usgov", "cc-by-4.0"] : ["cc0", "pd-usgov"];
}

/** Erkennt Creative-Commons-Familie und Version aus Kurzbezeichnung und Lizenz-URL. */
export function parseCreativeCommons(license: string, licenseUrl = ""): { family: "by" | "by-sa" | "other"; version: string } | null {
  const url = /creativecommons\.org\/licenses\/(by-sa|by)\/(\d\.\d)/i.exec(licenseUrl);
  if (url) return { family: url[1].toLowerCase() === "by-sa" ? "by-sa" : "by", version: url[2] };
  const l = license.trim();
  if (!/^cc[ -]by/i.test(l)) return null;
  const family = /^cc[ -]by[ -]sa/i.test(l) ? "by-sa" : "by";
  const ver = /(\d\.\d)/.exec(l)?.[1];
  return ver ? { family, version: ver } : { family: "other", version: "" };
}

/**
 * STRIKTE ALLOWLIST für die automatische Freigabe (fachlich festgelegt, siehe docs/AUTOMATISIERUNG.md und docs/LIZENZPOLITIK.md):
 *  - CC0 (ausdrücklicher Verzicht),
 *  - „Public domain“ NUR mit Nachweis eines Werks der US-Bundesregierung (NASA, National Archives, White House Photo Office,
 *    US-Streitkräfte, USIA) im Credit/Urheber/Kategorien – eine bloße Commons-Angabe „Public domain“ reicht nicht,
 *  - CC BY 4.0 nur mit vollständigen Herkunfts- und Pflichtangaben (ccByProvenance) und nur, wenn die Klasse geschaltet ist.
 * CC BY 2.0/3.0 und CC BY-SA sind vorbereitet (werden zusätzlich manuell geprüft). NC/ND bleiben ausgeschlossen.
 */
const USGOV = /\b(NASA|National Aeronautics and Space Administration|National Archives and Records Administration|U\.?S\.? National Archives|White House Photo Office|U\.?S\.? Air Force|U\.?S\.? Army|U\.?S\.? Navy|U\.?S\.? Marine Corps|United States Information Agency|U.?S.? Geological Survey|USGS)\b/i;
const NONFREE = /(non-?free|fair use|all rights reserved|no derivatives|\bnd\b|\bnc\b|non-?commercial)/i;
export const AGENCY = /(getty|alamy|reuters|associated press|\bap photo\b|\bdpa\b|ullstein|imago|keystone)/i;
const COPYRIGHT_HINT = /(©|\bcopyright\b|\(c\)\s*\d{4}|getty|alamy|reuters|associated press|\bap photo\b|\bdpa\b|ullstein)/i;
const UNKNOWN_AUTHOR = /^(unknown|unbekannt|anonymous|anonym|n\/a|none|keine angabe|various|verschiedene|\?+|-+)(\b.*)?$/i;

/** Institutionen, deren Commons-Veröffentlichungen unter CC BY auf institutioneller Berechtigung beruhen. Bewusst konservativ. */
const INSTITUTIONS =
  /(wellcome collection|te papa|museum of new zealand|museovirasto|finnish heritage agency|riksantikvarie|swedish national heritage board|nationaal archief|rijksmuseum|national library of (norway|australia|new zealand)|nasjonalbiblioteket|europeana|smithsonian|metropolitan museum|archives new zealand|alexander turnbull library|state library (of|victoria)|deutsche fotothek)/i;
const OWN_WORK = /(own work|eigenes werk|selbst fotografiert|self-photographed)/i;

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may|mai", "jun", "jul", "aug", "sep", "oct|okt", "nov", "dec|dez"];

/** Prüft, ob ein Commons-Datumstext genau den ISO-Tag (YYYY-MM-DD) benennt (ISO-Form oder „20 July 1969“ / „20. Juli 1969“). */
export function sameDay(text: string, iso: string): boolean {
  const [y, mo, d] = iso.slice(0, 10).split("-").map(Number);
  if (text.includes(iso.slice(0, 10))) return true;
  const re = new RegExp(`(^|\\D)0?${d}\\.?\\s+(${MONTH_NAMES[mo - 1]})[a-zä]*\\.?,?\\s+${y}(\\D|$)`, "i");
  return re.test(text);
}

export interface Provenance {
  ok: boolean;
  basis: string;
  problems: string[];
  /** unabhängige Bestätigungen der Herkunft (neben der Grundlage) */
  signals: string[];
}

export interface ProvenanceCtx {
  eventYear?: number;
  /** YYYY-MM-DD des belegten Ereignisses */
  eventDate?: string;
}

/** Mindestzahl unabhängiger Bestätigungen zusätzlich zur Grundlage (Institution bzw. eigenes Werk). */
export const MIN_CORROBORATION = 2;

/**
 * Herkunftsprüfung für CC BY 4.0. Eine bloße Lizenzmarkierung genügt nicht, und auch die Grundlage allein (bekannte Institution oder „Eigenes Werk“)
 * reicht nicht: Neben Urheber, Originalquelle, exakter Lizenz mit Link und einer Grundlage der Berechtigung müssen mindestens ${MIN_CORROBORATION}
 * unabhängige Bestätigungen vorliegen (tagesgenaues Aufnahmedatum, ausdrückliche Namensnennungs-Angabe der Quelle, Institution in Urheber- und Credit-Feld,
 * Urheber mit vollständigem Namen). „Eigenes Werk“ zählt nur bei Ereignissen ab 1995 mit Aufnahme am Ereignistag.
 */
export function ccByProvenance(m: CommonsMeta, ctx: number | ProvenanceCtx = {}): Provenance {
  const c: ProvenanceCtx = typeof ctx === "number" ? { eventYear: ctx } : ctx;
  const problems: string[] = [];
  const signals: string[] = [];
  const author = (m.artist || "").trim();
  const authorOk = !!author && author.length >= 3 && !UNKNOWN_AUTHOR.test(author);
  if (!authorOk) problems.push("Kein identifizierbarer Urheber bzw. Rechteinhaber.");
  if (!/^https?:\/\/commons\.wikimedia\.org\/wiki\/File:/i.test(m.pageUrl || "")) problems.push("Keine konkrete Originalquelle (Dateiseite) vorhanden.");
  if (!/^https?:\/\//i.test(m.url || "")) problems.push("Keine Original-Datei-URL.");
  if (!(m.credit || "").trim() && !author) problems.push("Keine Quellenangabe (Credit).");
  const cc = parseCreativeCommons(m.license, m.licenseUrl);
  if (!cc || cc.family !== "by" || cc.version !== "4.0") problems.push("Lizenzbezeichnung/-version nicht eindeutig CC BY 4.0.");
  if (!/^https?:\/\/creativecommons\.org\/licenses\/by\/4\.0/i.test(m.licenseUrl || "")) problems.push("Kein Link zum Lizenztext (CC BY 4.0).");
  if ((m.restrictions || "").trim()) problems.push(`Zusätzliche Einschränkung laut Commons: ${m.restrictions.trim()}`);
  if (AGENCY.test(`${m.artist} ${m.credit}`)) problems.push("Agentur-/Bildarchiv-Angabe: Berechtigung zur Lizenzvergabe nicht nachvollziehbar.");
  if (m.copyrighted === false) problems.push("Widersprüchliche Rechteinformation: Commons führt das Werk als nicht urheberrechtlich geschützt, aber unter CC BY lizenziert.");

  // Bestätigungen (unabhängig von der Grundlage)
  const dayMatch = !!c.eventDate && sameDay(m.dateOriginal || "", c.eventDate);
  if (dayMatch) signals.push("Aufnahmedatum entspricht dem Ereignistag");
  if (m.attributionRequired === true && (m.attribution || "").trim()) signals.push("Quelle verlangt ausdrücklich Namensnennung (Attribution angegeben)");
  const instArtist = INSTITUTIONS.exec(m.artist || "")?.[0];
  const instCredit = INSTITUTIONS.exec(m.credit || "")?.[0];
  if (instArtist && instCredit) signals.push("Institution in Urheber- und Credit-Feld genannt");
  if (authorOk && /^\p{L}[\p{L}.'’-]+(\s+\p{L}[\p{L}.'’-]+)+/u.test(author)) signals.push("Urheber mit vollständigem Namen");

  const hay = `${m.artist} ${m.credit}`;
  const inst = INSTITUTIONS.exec(hay)?.[0];
  let basis = "";
  if (inst) basis = `Institutionelle Herkunft: ${inst}`;
  else if (OWN_WORK.test(m.credit || "")) {
    if (c.eventYear !== undefined && c.eventYear >= 1995 && dayMatch && authorOk) basis = "Eigenes Werk des genannten Urhebers (Aufnahme am Ereignistag, Ereignis ab 1995)";
    else problems.push("„Eigenes Werk“ nur bei Ereignissen ab 1995 mit Aufnahme am Ereignistag und benanntem Urheber: Berechtigung des Uploaders sonst nicht nachvollziehbar.");
  } else {
    problems.push("Herkunft/Berechtigung zur Lizenzvergabe nicht nachvollziehbar (weder bekannte Institution noch eigenes Werk).");
  }
  if (basis && signals.length < MIN_CORROBORATION) problems.push(`Grundlage allein genügt nicht: nur ${signals.length} von mindestens ${MIN_CORROBORATION} unabhängigen Bestätigungen (${signals.join("; ") || "keine"}).`);
  return { ok: problems.length === 0 && !!basis, basis, problems, signals };
}

export function evaluateLicense(m: CommonsMeta, ctx: { eventYear?: number; eventDate?: string; auto?: LicenseClass[] } = {}): LicenseDecision {
  const reasons: string[] = [];
  const auto = ctx.auto ?? autoLicenseClasses();
  const lic = (m.license || "").trim();
  if (!lic) return { allowed: false, manual: false, reasons: ["Keine Lizenzangabe."] };
  if (NONFREE.test(lic)) return { allowed: false, manual: false, reasons: [`Nicht freie Lizenz: ${lic}`] };

  const cc = parseCreativeCommons(lic, m.licenseUrl);
  const isCc0 = /^cc0/i.test(lic);
  if (m.copyrighted === true && !isCc0 && !cc) {
    return { allowed: false, manual: false, reasons: [`Urheberrechtlich geschützt (${lic}); keine freie Lizenz erkannt.`] };
  }

  // Creative Commons mit Namensnennung (kommerzielle Nutzung erlaubt)
  if (cc && cc.family !== "other") {
    const klass = `cc-${cc.family}-${cc.version}` as LicenseClass;
    if (cc.family === "by" && cc.version === "4.0") {
      const prov = ccByProvenance(m, { eventYear: ctx.eventYear, eventDate: ctx.eventDate });
      if (!prov.ok) return { allowed: false, manual: true, licenseClass: klass, rulesMet: false, reasons: [`CC BY 4.0: Regeln nicht vollständig erfüllt: ${prov.problems.join(" ")}`] };
      if (auto.includes("cc-by-4.0")) return { allowed: true, manual: false, licenseClass: klass, rulesMet: true, basis: `${prov.basis}; Bestätigungen: ${prov.signals.join("; ")}`, reasons: [`CC BY 4.0: alle Automatikregeln erfüllt. ${prov.basis}.`] };
      return {
        allowed: false,
        manual: true,
        licenseClass: klass,
        rulesMet: true,
        basis: `${prov.basis}; Bestätigungen: ${prov.signals.join("; ")}`,
        reasons: [`CC BY 4.0: Automatikregeln erfüllt (${prov.basis}); unbeaufsichtigte Freigabe noch nicht geschaltet – zusätzliche Rechteprüfung.`],
      };
    }
    if (PREPARED.includes(klass)) {
      return { allowed: false, manual: true, licenseClass: klass, rulesMet: false, reasons: [`Lizenz ${lic}: erkannt, aber noch nicht für die unbeaufsichtigte Freigabe vorbereitet (Anforderungen werden manuell geprüft).`] };
    }
    return { allowed: false, manual: true, reasons: [`Lizenzvariante ${lic} ist nicht in der Allowlist.`] };
  }

  if ((m.restrictions || "").trim()) reasons.push(`Zusätzliche Einschränkung laut Commons: ${m.restrictions.trim()}`);
  if (COPYRIGHT_HINT.test(`${m.artist} ${m.credit}`)) reasons.push("Urheber-/Credit-Angabe enthält Copyright-Hinweis oder Agentur.");
  if (reasons.length) return { allowed: false, manual: true, reasons };

  if (isCc0) return { allowed: true, manual: false, licenseClass: "cc0", rulesMet: true, reasons: ["CC0 (Allowlist)."] };
  if (/^(public domain|pd[- ])/i.test(lic)) {
    const hay = `${m.artist} ${m.credit} ${m.categories.join(" ")}`;
    if (USGOV.test(hay) && m.copyrighted !== true) {
      return { allowed: true, manual: false, licenseClass: "pd-usgov", rulesMet: true, reasons: ["Public domain mit Nachweis eines Werks der US-Bundesregierung (Allowlist)."] };
    }
    return {
      allowed: false,
      manual: true,
      reasons: ["Public domain ohne Nachweis eines Regierungswerks: Rechtsgrundlage (z. B. Alter nach Landesrecht) manuell prüfen. Unklare Public-Domain-Kennzeichnungen gelten nicht als Nachweis."],
    };
  }
  return { allowed: false, manual: true, reasons: [`Lizenz „${lic}“ ist nicht in der Allowlist für automatische Freigabe.`] };
}

/** Für die Bildsuche: Die Lizenz ist nach allen Regeln nutzbar (auch wenn die Freigabe noch eine Prüfung braucht). */
export const licenseUsable = (m: CommonsMeta, eventYear?: number, eventDate?: string) => {
  const d = evaluateLicense(m, { eventYear, eventDate });
  return d.allowed || (d.manual && d.rulesMet === true);
};

export const auditEntry = (step: string, decision: AuditEntry["decision"], rules: string[], evidence?: Record<string, unknown>, actor = "auto"): AuditEntry => ({
  at: new Date().toISOString(),
  actor,
  step,
  decision,
  rules,
  evidence,
});
