/**
 * Zentrale Bildnachweis-Komponente: erzeugt aus den gespeicherten Lizenzinformationen die erforderliche Namensnennung
 * und prüft, ob alle Pflichtangaben vorliegen. Reine Funktionen ohne Server-Abhängigkeiten (auch im Browser nutzbar).
 */

export type RightsStatus = "automatisch_freigabefaehig" | "rechtepruefung_erforderlich" | "abgelehnt" | "manuell_geprueft";

export interface ImageEdits {
  /** Größenanpassung, Formatwandlung, Entfernen von Metadaten – lizenzrechtlich ohne Bearbeitungsvermerk */
  technical: string[];
  /** Zuschnitt, Retusche, Kombination – muss ausgewiesen werden (bei CC BY-SA zusätzlich ShareAlike) */
  licenseRelevant: string[];
}

export interface ImageRights {
  workTitle: string;
  author: string;
  /** nur, wenn vom Urheber abweichend */
  rightsHolder: string;
  institution: string;
  originalSourceUrl: string;
  originalFileUrl: string;
  /** z. B. „CC BY 4.0“ */
  license: string;
  /** exakte Version, z. B. „4.0“ (leer bei CC0/PD) */
  licenseVersion: string;
  licenseUrl: string;
  /** z. B. „© 2004 Max Muster“, soweit angegeben */
  copyrightNotice: string;
  edits: ImageEdits;
  /** ISO-Zeitpunkt der Rechteprüfung */
  rightsCheckedAt: string;
  status: RightsStatus;
  /** Prüfgrundlage, z. B. „Institutionelle Herkunft: Wellcome Collection“ */
  basis: string;
  /** Wer/was hat geprüft: „auto“ oder „admin“ */
  checkedBy: "auto" | "admin";
  /** Hinweise auf weitere Einschränkungen (z. B. Personen, Persönlichkeitsrechte) */
  restrictions: string[];
}

export const RIGHTS_STATUS_LABEL: Record<RightsStatus, string> = {
  automatisch_freigabefaehig: "Freigabefähig nach geprüften Automatikregeln",
  rechtepruefung_erforderlich: "Zusätzliche Rechteprüfung erforderlich",
  abgelehnt: "Abgelehnt",
  manuell_geprueft: "Vom Admin geprüft und freigegeben",
};

const needsAttribution = (license: string) => /^cc[ -]by/i.test(license.trim());

/** Pflichtangaben je Lizenz. Fehlt eine, darf das Bild nicht automatisch veröffentlicht werden. */
export function missingRights(r: Partial<ImageRights> | null | undefined): string[] {
  const m: string[] = [];
  if (!r) return ["Keine Rechtedaten gespeichert."];
  if (!(r.license ?? "").trim()) m.push("Lizenz");
  if (!(r.originalSourceUrl ?? "").trim()) m.push("Originalquelle");
  if (!(r.originalFileUrl ?? "").trim()) m.push("Original-Datei-URL");
  if (!(r.rightsCheckedAt ?? "").trim()) m.push("Datum der Rechteprüfung");
  if (!(r.basis ?? "").trim()) m.push("Prüfgrundlage");
  if (needsAttribution(r.license ?? "")) {
    if (!(r.author ?? "").trim()) m.push("Urheber");
    if (!(r.licenseVersion ?? "").trim()) m.push("Lizenzversion");
    if (!(r.licenseUrl ?? "").trim()) m.push("Link zum Lizenztext");
  }
  return m;
}

export interface Attribution {
  /** kurze Zeile direkt am Bild */
  short: string;
  /** vollständiger Nachweis */
  full: string;
  /** Pflichtangaben, die fehlen */
  missing: string[];
}

/** Erzeugt die Namensnennung aus den gespeicherten Angaben (TASL: Title, Author, Source, License). */
export function buildAttribution(r: Partial<ImageRights>, opts: { shortMax?: number } = {}): Attribution {
  const missing = missingRights(r);
  const author = (r.author ?? "").trim();
  const holder = (r.rightsHolder ?? "").trim();
  const license = (r.license ?? "").trim();
  const by = author && holder && holder.toLowerCase() !== author.toLowerCase() ? `${author} (Rechteinhaber: ${holder})` : author || holder;
  const title = (r.workTitle ?? "").trim();
  const edits = (r.edits?.licenseRelevant ?? []).filter(Boolean);

  const parts: string[] = [];
  if (title) parts.push(`„${title}“`);
  if (by) parts.push(title ? `von ${by}` : by);
  if (r.institution && !by.toLowerCase().includes(r.institution.toLowerCase())) parts.push(`(${r.institution})`);
  const lead = parts.join(" ");
  const tail: string[] = [];
  if (r.originalSourceUrl) tail.push(`Quelle: ${r.originalSourceUrl}`);
  if (license) tail.push(`Lizenz: ${license}${r.licenseUrl ? ` (${r.licenseUrl})` : ""}`);
  if (r.copyrightNotice) tail.push(r.copyrightNotice.trim());
  if (edits.length) tail.push(`Bearbeitung: ${edits.join("; ")}`);
  const full = [lead, ...tail].filter(Boolean).join(". ").replace(/\.\./g, ".");

  const max = opts.shortMax ?? 80;
  const shortBase = [by || r.institution || "", license].filter(Boolean).join(" · ") || "Wikimedia Commons";
  const short = shortBase.length > max ? shortBase.slice(0, max - 1) + "…" : shortBase;
  return { short, full, missing };
}

/** Unterscheidet technische Anpassungen von lizenzrechtlich relevanten Bearbeitungen. */
export function classifyEdits(notes: string[]): ImageEdits {
  const relevant = /(zuschnitt|abgeschnitten|beschnitten|crop|retusch|montage|kombin|ausschnitt|aufgehellt)/i;
  const edits: ImageEdits = { technical: [], licenseRelevant: [] };
  for (const n of notes.filter(Boolean)) (relevant.test(n) ? edits.licenseRelevant : edits.technical).push(n);
  return edits;
}

/** Technische Standardbearbeitung der automatischen Aufnahme (ohne Zuschnitt). */
export const AUTO_TECHNICAL_EDITS = ["Auf maximal 2000 px Breite skaliert, in WebP konvertiert, Metadaten entfernt (rein technische Anpassung, Bildinhalt unverändert)."];
