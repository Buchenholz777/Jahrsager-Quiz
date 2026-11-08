import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { IMAGE_WIDTHS } from "@/lib/images";
import { putImage } from "./storage";
import { AppError } from "./types";

const MAX_BYTES = 12 * 1024 * 1024;

/**
 * Verarbeitet einen Upload: prüft das Format anhand des Inhalts, entfernt Metadaten,
 * erzeugt WebP-Varianten in mehreren Breiten. Die Kennung ist zufällig (nicht erratbar).
 */
export async function processUpload(data: Buffer, opts: { cropBottomPct?: number } = {}) {
  if (data.length > MAX_BYTES) throw new AppError("BILD_ZU_GROSS", "Das Bild ist größer als 12 MB.");
  let meta;
  try {
    meta = await sharp(data).metadata();
  } catch {
    throw new AppError("BILD_UNGUELTIG", "Die Datei ist kein lesbares Bild.");
  }
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) {
    throw new AppError("BILD_FORMAT", "Erlaubt sind JPEG, PNG und WebP.");
  }
  const id = "im" + randomBytes(12).toString("hex");
  let base = sharp(data).rotate();
  if (opts.cropBottomPct) {
    // z. B. Archivbeschriftung am unteren Rand entfernen, wenn sie Ereignis/Datum verrät
    const r = await base.toBuffer({ resolveWithObject: true });
    base = sharp(r.data).extract({ left: 0, top: 0, width: r.info.width, height: Math.floor(r.info.height * (1 - opts.cropBottomPct / 100)) });
  }
  const main = await base.clone().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  await putImage(`${id}.webp`, main.data, "image/webp");
  for (const w of IMAGE_WIDTHS) {
    if (w >= main.info.width && w !== IMAGE_WIDTHS[0]) continue;
    const v = await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    await putImage(`${id}-${w}.webp`, v, "image/webp");
  }
  return { id, ext: "webp", width: main.info.width, height: main.info.height };
}
