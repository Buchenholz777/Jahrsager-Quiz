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
}

export type LicenseClass = "cc0" | "pd-usgov";
export interface LicenseDecision {
  /** true = darf automatisch freigegeben werden; false + manual = Prüfung durch Menschen; false + !manual = abgelehnt */
  allowed: boolean;
  manual: boolean;
  licenseClass?: LicenseClass;
  reasons: string[];
}

/**
 * STRIKTE ALLOWLIST für die automatische Freigabe (fachlich festgelegt, siehe docs/AUTOMATISIERUNG.md):
 *  - CC0 (ausdrücklicher Verzicht),
 *  - „Public domain“ NUR mit Nachweis eines Werks der US-Bundesregierung (NASA, National Archives, White House Photo Office,
 *    US-Streitkräfte, USIA) im Credit/Urheber/Kategorien – eine bloße Commons-Angabe „Public domain“ reicht nicht.
 * Alles andere (CC BY, CC BY-SA, nur „PD-old“, Library of Congress mit Drittrechten, unbekannt) bleibt manuell bzw. wird abgelehnt.
 */
const USGOV = /\b(NASA|National Aeronautics and Space Administration|National Archives and Records Administration|U\.?S\.? National Archives|White House Photo Office|U\.?S\.? Air Force|U\.?S\.? Army|U\.?S\.? Navy|U\.?S\.? Marine Corps|United States Information Agency|U.?S.? Geological Survey|USGS)\b/i;
const NONFREE = /(non-?free|fair use|all rights reserved|no derivatives|\bnd\b|\bnc\b|non-?commercial)/i;
const COPYRIGHT_HINT = /(©|\bcopyright\b|\(c\)\s*\d{4}|getty|alamy|reuters|associated press|\bap photo\b|dpa|ullstein)/i;

export function evaluateLicense(m: CommonsMeta): LicenseDecision {
  const reasons: string[] = [];
  const lic = (m.license || "").trim();
  if (!lic) return { allowed: false, manual: false, reasons: ["Keine Lizenzangabe."] };
  if (NONFREE.test(lic)) return { allowed: false, manual: false, reasons: [`Nicht freie Lizenz: ${lic}`] };
  if (m.copyrighted === true && !/^cc0/i.test(lic)) {
    return { allowed: false, manual: /^cc[ -]by/i.test(lic), reasons: [`Urheberrechtlich geschützt (${lic}); nicht in der Auto-Allowlist.`] };
  }
  if (m.restrictions.trim()) reasons.push(`Zusätzliche Einschränkung laut Commons: ${m.restrictions.trim()}`);
  if (COPYRIGHT_HINT.test(`${m.artist} ${m.credit}`)) reasons.push("Urheber-/Credit-Angabe enthält Copyright-Hinweis oder Agentur.");
  if (reasons.length) return { allowed: false, manual: true, reasons };

  if (/^cc0/i.test(lic)) return { allowed: true, manual: false, licenseClass: "cc0", reasons: ["CC0 (Allowlist)."] };
  if (/^(public domain|pd[- ])/i.test(lic)) {
    const hay = `${m.artist} ${m.credit} ${m.categories.join(" ")}`;
    if (USGOV.test(hay) && m.copyrighted !== true) {
      return { allowed: true, manual: false, licenseClass: "pd-usgov", reasons: ["Public domain mit Nachweis eines Werks der US-Bundesregierung (Allowlist)."] };
    }
    return { allowed: false, manual: true, reasons: ["Public domain ohne Nachweis eines Regierungswerks: Rechtsgrundlage (z. B. Alter nach Landesrecht) manuell prüfen."] };
  }
  return { allowed: false, manual: true, reasons: [`Lizenz „${lic}“ ist nicht in der Allowlist für automatische Freigabe.`] };
}

export const auditEntry = (step: string, decision: AuditEntry["decision"], rules: string[], evidence?: Record<string, unknown>, actor = "auto"): AuditEntry => ({
  at: new Date().toISOString(),
  actor,
  step,
  decision,
  rules,
  evidence,
});
