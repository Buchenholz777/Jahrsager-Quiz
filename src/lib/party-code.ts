/** Ohne verwechselbare Zeichen (0/O, 1/I/L): leicht abzutippen und vorzulesen. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

/** Entfernt Leerzeichen, Bindestriche und Sonderzeichen, unabhängig von Groß-/Kleinschreibung. */
export function normalizeCode(raw: unknown): string {
  return String(raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidCodeFormat(code: string): boolean {
  return code.length === CODE_LENGTH && [...code].every((c) => CODE_ALPHABET.includes(c));
}

export function generateCode(rnd: () => number = Math.random): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(rnd() * CODE_ALPHABET.length)]).join("");
}

/** Einladungstext für WhatsApp & Co. (Link und Code, keine Lösungen). */
export function inviteText(code: string, url: string): string {
  return `Spiel mit mir bei JAHRSAGER, dem Geschichtsquiz! Wir schätzen dieselben fünf Jahreszahlen.\nParty-Code: ${code}\nHier mitspielen: ${url}`;
}
