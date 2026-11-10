// Erzeugt das Favicon-Set aus dem vorhandenen JAHRSAGER-Logo (Bildteil: Kalender mit „?“, Markenfarben unverändert).
//   node scripts/make-favicon-from-logo.mjs
// Quelle: public/brand/jahrsager-quiz-logo.png (1200 × 873, transparent). Ausgabe: public/favicon.png (96 × 96), favicon-48.png,
// favicon.ico (16/32/48), apple-touch-icon.png (180 × 180), dazu eine Vorschau der Lesbarkeit in 16/32 px auf hellem und dunklem Grund.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const NAVY = "#16283D"; // Mitternachtsblau der Marke
const SRC = "public/brand/jahrsager-quiz-logo.png";
// Ausschnitt: Kalenderblatt mit Ringen und „?“ (Koordinaten im 1200-px-Logo)
const CROP = { left: 420, top: 132, width: 352, height: 298 };

const calendar = await sharp(SRC).extract(CROP).toBuffer();

/** Quadratische Kachel: Marken-Navy (hoher Kontrast auf hellem und dunklem Grund), Kalender mittig und möglichst groß. */
async function tile(size, { round = true } = {}) {
  const pad = Math.round(size * 0.06);
  const inner = size - pad * 2;
  const cal = await sharp(calendar).resize({ width: inner, height: inner, fit: "cover", position: "centre", kernel: "lanczos3" }).toBuffer();
  const radius = round ? Math.round(size * 0.2) : 0;
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${NAVY}"/></svg>`);
  return sharp(bg).composite([{ input: cal, gravity: "center" }]).png({ compressionLevel: 9 }).toBuffer();
}

const out = (p, b) => writeFileSync(p, b);
out("public/favicon.png", await tile(96));
out("public/favicon-48.png", await tile(48));
out("public/favicon-96.png", await tile(96)); // alter Pfad bleibt gültig (gleiches Motiv)
out("public/apple-touch-icon.png", await tile(180, { round: false }));
out("public/brand/apple-touch-icon.png", await tile(180, { round: false }));

// ICO mit PNG-Einträgen 16/32/48
const sizes = [16, 32, 48];
const imgs = await Promise.all(sizes.map((s) => tile(s)));
const head = Buffer.alloc(6);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(imgs.length, 4);
let offset = 6 + 16 * imgs.length;
const dir = imgs.map((b, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0);
  e.writeUInt8(sizes[i], 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(b.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += b.length;
  return e;
});
out("public/favicon.ico", Buffer.concat([head, ...dir, ...imgs]));

// Vorschau (nicht ausgeliefert): 16/32 px, vierfach vergrößert, auf hellem und dunklem Grund
mkdirSync("tmp-preview", { recursive: true });
const cell = 4;
const parts = [];
let x = 0;
for (const bgc of ["#ffffff", "#202124"]) {
  for (const s of [16, 32, 96]) {
    const small = await sharp(await tile(s)).resize(s * cell, s * cell, { kernel: "nearest" }).toBuffer();
    parts.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s * cell + 20}" height="${96 * cell + 20}"><rect width="100%" height="100%" fill="${bgc}"/></svg>`), left: x, top: 0 });
    parts.push({ input: small, left: x + 10, top: 10 });
    x += s * cell + 20;
  }
}
await sharp({ create: { width: x, height: 96 * cell + 20, channels: 3, background: "#888" } }).composite(parts).png().toFile("tmp-preview/favicon-lesbarkeit.png");
console.log("Favicon-Set aus dem Logo erzeugt.");
