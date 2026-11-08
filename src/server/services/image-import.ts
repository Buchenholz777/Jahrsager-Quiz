import { processUpload } from "../images";
import type { Queryable } from "../db/client";
import { AppError, type EventInput, type EventRow } from "../types";
import { getEvent, preTipHints, updateEvent } from "./events";

const UA = "JAHRSAGER/0.1 (Redaktions-Import; Kontakt über den Betreiber der Website)";
const ALLOWED_HOSTS = new Set(["upload.wikimedia.org", "thumb.wikimedia.org"]);
const MAX_BYTES = 20 * 1024 * 1024;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]/g, "");

async function politeFetch(url: string | URL, tries = 4): Promise<Response> {
  let res: Response | null = null;
  for (let i = 0; i < tries; i++) {
    res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status !== 429 && res.status < 500) return res;
    const wait = Number(res.headers.get("retry-after")) || 5 * (i + 1);
    await new Promise((r) => setTimeout(r, Math.min(wait, 60) * 1000));
  }
  return res!;
}

export const editsText = (crop?: number) =>
  "Automatischer Import: skaliert auf max. 2000 px Breite, in WebP konvertiert, Metadaten entfernt." +
  (crop ? " Unterer Bildrand mit Archivbeschriftung abgeschnitten (die Beschriftung nennt Ereignis und Datum)." : "");

type CommonsInfo = { url: string; thumburl?: string; extmetadata?: Record<string, { value?: string }> };

/**
 * Lädt das recherchierte Kandidatenbild (Wikimedia Commons) herunter, verarbeitet es (Metadaten entfernt,
 * WebP-Varianten) und trägt Nachweis, Lizenz und Quelle am Ereignis ein.
 * WICHTIG: Der Import gibt das Bild NICHT frei. Bildstatus wird "zu_pruefen", alle Prüfbestätigungen
 * werden zurückgesetzt; ein Mensch muss Bild, Urheber, Lizenz und Datum am Original prüfen.
 * Sicherheit: nur https://upload.wikimedia.org und thumb.wikimedia.org, Größenlimit, Lizenzvergleich mit der Recherche.
 */
export async function importCandidateImage(db: Queryable, eventId: string): Promise<EventRow> {
  const ev = await getEvent(db, eventId);
  if (!ev) throw new AppError("NICHT_GEFUNDEN", "Ereignis nicht gefunden", 404);
  const c = ev.research?.image;
  if (!c) throw new AppError("KEIN_KANDIDAT", "Für dieses Ereignis ist kein Bildkandidat hinterlegt.", 422);

  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query",
    titles: `File:${c.commonsFile}`,
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "2400",
    format: "json",
    formatversion: "2",
  }).toString();
  const meta = await politeFetch(api);
  if (!meta.ok) throw new AppError("COMMONS_FEHLER", `Commons-API nicht erreichbar (${meta.status}).`, 502);
  const json = (await meta.json()) as { query?: { pages?: { missing?: boolean; imageinfo?: CommonsInfo[] }[] } };
  const info = json.query?.pages?.[0]?.imageinfo?.[0];
  if (!info) throw new AppError("DATEI_FEHLT", "Die Datei existiert auf Commons nicht (mehr).", 404);

  const licenseNow = info.extmetadata?.LicenseShortName?.value ?? "";
  const a = norm(licenseNow);
  const b = norm(c.license);
  const licenseMatch = !!a && (a.startsWith(b) || b.startsWith(a));
  if (!licenseMatch) {
    throw new AppError("LIZENZ_ABWEICHUNG", `Die Lizenz auf Commons („${licenseNow}“) weicht von der Recherche („${c.license}“) ab. Bitte manuell prüfen.`, 409);
  }

  const src = new URL(info.thumburl ?? info.url);
  if (src.protocol !== "https:" || !ALLOWED_HOSTS.has(src.hostname)) {
    throw new AppError("QUELLE_UNZULAESSIG", `Download nur von https://upload.wikimedia.org und https://thumb.wikimedia.org erlaubt (gefunden: ${src.protocol}//${src.hostname}).`, 400);
  }
  const res = await politeFetch(src);
  if (!res.ok) throw new AppError("DOWNLOAD_FEHLER", `Bild-Download fehlgeschlagen (${res.status}).`, 502);
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) throw new AppError("BILD_ZU_GROSS", "Das Bild ist größer als 20 MB.", 413);
  const data = Buffer.from(await res.arrayBuffer());
  if (data.length > MAX_BYTES) throw new AppError("BILD_ZU_GROSS", "Das Bild ist größer als 20 MB.", 413);
  const up = await processUpload(data, { cropBottomPct: c.cropBottomPct });

  const next: EventInput = {
    ...ev,
    image_id: up.id,
    image_ext: up.ext,
    image_width: up.width,
    image_height: up.height,
    image_is_placeholder: false,
    image_alt: c.altDraft,
    image_credit_short: c.creditShort,
    image_credit_full: c.creditFull,
    image_license: c.license,
    image_license_url: c.licenseUrl,
    image_photographer: c.author,
    image_source_url: c.originalReadable ? c.originalUrl : c.commonsUrl,
    photo_date: c.photoDate,
    image_edits: editsText(c.cropBottomPct),
    image_status: "zu_pruefen",
    checks: { rights: false, facts: false, photoMatchesEvent: false },
  } as EventInput;
  const hints = preTipHints({ ...next } as never);
  if (hints.length) throw new AppError("ZEITHINWEIS", `Der Bildnachweis enthält Zeitangaben: ${hints.join("; ")}`, 422);
  return updateEvent(db, ev.id, next, "Kandidatenbild importiert (noch ungeprüft)");
}

/** Wendet einen nachträglich festgelegten Zuschnitt (cropBottomPct) auf ein bereits importiertes Bild an. */
export async function recropImported(db: Queryable, eventId: string): Promise<EventRow | null> {
  const { getImage } = await import("../storage");
  const ev = await getEvent(db, eventId);
  const crop = ev?.research?.image?.cropBottomPct;
  if (!ev || !crop || ev.image_is_placeholder || !ev.image_id || (ev.image_edits ?? "").includes("abgeschnitten")) return null;
  const data = await getImage(`${ev.image_id}.${ev.image_ext}`);
  if (!data) throw new AppError("BILD_FEHLT", "Gespeichertes Bild nicht gefunden.", 404);
  const up = await processUpload(data, { cropBottomPct: crop });
  return updateEvent(
    db,
    ev.id,
    { ...ev, image_id: up.id, image_ext: up.ext, image_width: up.width, image_height: up.height, image_edits: editsText(crop) } as EventInput,
    "Bildzuschnitt: verräterische Beschriftung am unteren Rand entfernt",
  );
}
