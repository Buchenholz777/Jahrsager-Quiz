import { parseCommonsDay } from "./evaluate";
import { licenseUsable, type CommonsMeta } from "./license";
import { categoryImages, type Candidate } from "./sources";

/**
 * Bildsuche je Ereignis: Sucht in der Commons-Kategorie des Ereignisses nach einem Foto, das ALLE harten Kriterien erfüllt
 * (Lizenz-Allowlist, Aufnahmedatum = Ereignistag, ausreichende Größe). Ist keines vorhanden, bleibt das Bild aus Wikidata (P18).
 * Das gewählte Bild wird später wie jedes andere von der Pipeline vollständig geprüft.
 */
export async function findEventImage(c: Candidate, load: (cat: string) => Promise<CommonsMeta[]> = categoryImages): Promise<CommonsMeta | null> {
  if (!c.commonsCategory) return null;
  const [ey, em, ed] = c.date.split("-").map(Number);
  const ok = (await load(c.commonsCategory)).filter((m) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(m.mime)) return false;
    if (Math.max(m.width, m.height) < 1200 || Math.min(m.width, m.height) < 792) return false;
    const d = parseCommonsDay(m.dateOriginal);
    if (!d || d.y !== ey || d.m !== em || d.d !== ed) return false;
    return licenseUsable(m, ey); // auch CC BY 4.0 mit erfüllten Herkunftsregeln (Freigabe wird danach vollständig geprüft)
  });
  ok.sort((a, b) => b.width * b.height - a.width * a.height);
  return ok[0] ?? null;
}
