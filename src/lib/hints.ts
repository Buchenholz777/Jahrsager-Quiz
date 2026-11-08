/**
 * Erkennt zeitliche Hinweise in Texten, die VOR dem Tipp sichtbar sind
 * (Überschrift, Beschreibung, Alternativtext, Kurz-Bildnachweis).
 * Konzept 4: Keine Jahreszahlen, Daten, Jahrzehnte, Jubiläumszahlen oder rechnerischen Hinweise.
 * Die Prüfung ist eine Warnhilfe; die Freigabe erfolgt weiterhin durch einen Menschen.
 */
export type TimeHint = { kind: string; match: string };

const MONTHS = "Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember";
const NUMBER_WORDS =
  "ein|einem|einen|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig|hundert|einige|mehrere|wenige";

const RULES: { kind: string; re: RegExp }[] = [
  { kind: "Jahreszahl", re: /(?<![\d.,])(?:1[0-9]{3}|20[0-9]{2})(?![\d]|[.,]\d)/g },
  { kind: "Datum", re: new RegExp(`\\b\\d{1,2}\\.\\s*(?:${MONTHS})\\b`, "gi") },
  { kind: "Datum", re: /\b\d{1,2}\.\d{1,2}\.(?:\d{2,4})?(?!\d)/g },
  { kind: "Jahrzehnt", re: /\b\d{2,4}er[- ]?Jahre[n]?\b/gi },
  { kind: "Jahrzehnt", re: /\b(?:zwanziger|dreißiger|vierziger|fünfziger|sechziger|siebziger|achtziger|neunziger)\b/gi },
  { kind: "Zeitraum", re: /\bJahr(?:zehnt|hundert|tausend)\w*/gi },
  { kind: "Kurzjahr", re: /(?:^|\s)[’']\d{2}\b/g },
  { kind: "Jubiläum", re: /\b(?:Jahrestag|Jubiläum|Jubiläums)\w*/gi },
  { kind: "Altersangabe", re: /\b\d+[- ]jährig\w*/gi },
  { kind: "Rechnerischer Hinweis", re: /\b(?:vor|nach)\s+(?:\w+\s+){0,2}Jahren\b/gi },
  { kind: "Rechnerischer Hinweis", re: new RegExp(`\\b(?:${NUMBER_WORDS}|\\d+)\\s+Jahre\\b`, "gi") },
  { kind: "Rechnerischer Hinweis", re: /\bJahre?\s+(?:zuvor|davor|danach|später|früher)\b/gi },
];

export function findTimeHints(text: string): TimeHint[] {
  const out: TimeHint[] = [];
  for (const { kind, re } of RULES) {
    for (const m of text.matchAll(re)) out.push({ kind, match: m[0].trim() });
  }
  return out;
}

export function hasTimeHints(...texts: (string | null | undefined)[]): boolean {
  return texts.some((t) => t && findTimeHints(t).length > 0);
}
