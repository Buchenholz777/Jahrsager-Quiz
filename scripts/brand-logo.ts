/**
 * Erzeugt das JAHRSAGER-QUIZ-Logo aus dem bereitgestellten Artwork:
 *  1. Der beige Hintergrund wird freigestellt (Regionenwachstum vom Rand aus, weiche Kante).
 *  2. Unter dem Banner wird ein „QUIZ“-Schild im Stil des Banners ergänzt (Umriss/Inhalt des Logos bleiben unverändert).
 *  3. Ausgabe: transparente Fassungen (WebP/PNG), Fassungen auf Cremeweiß/Mitternachtsblau, Open-Graph-Bild, Icons.
 * Aufruf: npx tsx scripts/brand-logo.ts
 */
import sharp from "sharp";
import fs from "node:fs";
import { ImageResponse } from "next/og";
import React from "react";

const SRC = "public/brand/jahrsager-logo-original.webp";
const OUT = "public/brand";
const TOL = Number(process.env.TOL ?? 9);

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const px = (i: number) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]] as const;
const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// 1) Hintergrund per Regionenwachstum: Nachbar gehört zum Hintergrund, wenn er dem bereits erkannten
//    Nachbarpixel farblich sehr ähnlich ist (weiche Verläufe/Vignette erlaubt, Kanten stoppen das Wachstum).
const bg = new Uint8Array(W * H);
const queue = new Int32Array(W * H);
let qh = 0;
let qt = 0;
const push = (i: number) => {
  if (!bg[i]) {
    bg[i] = 1;
    queue[qt++] = i;
  }
};
for (let x = 0; x < W; x++) {
  push(x);
  push((H - 1) * W + x);
}
for (let y = 0; y < H; y++) {
  push(y * W);
  push(y * W + W - 1);
}
while (qh < qt) {
  const i = queue[qh++];
  const x = i % W;
  const y = (i / W) | 0;
  const here = px(i);
  const n: number[] = [];
  if (x > 0) n.push(i - 1);
  if (x < W - 1) n.push(i + 1);
  if (y > 0) n.push(i - W);
  if (y < H - 1) n.push(i + W);
  for (const j of n) if (!bg[j] && dist(here, px(j)) <= TOL) push(j);
}

// 1b) Nur das größte zusammenhängende Objekt (das Logo) behalten – kleine Reste/Flecken des Hintergrunds entfernen
{
  const label = new Int32Array(W * H);
  let best = 0;
  let bestSize = 0;
  let next = 0;
  const stack = new Int32Array(W * H);
  for (let start = 0; start < W * H; start++) {
    if (bg[start] || label[start]) continue;
    next++;
    let sp = 0;
    let size = 0;
    stack[sp++] = start;
    label[start] = next;
    while (sp) {
      const i = stack[--sp];
      size++;
      const x = i % W;
      const y = (i / W) | 0;
      const ns = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
      for (const j of ns) if (j >= 0 && !bg[j] && !label[j]) { label[j] = next; stack[sp++] = j; }
    }
    if (size > bestSize) { bestSize = size; best = next; }
  }
  for (let i = 0; i < W * H; i++) if (!bg[i] && label[i] !== best) bg[i] = 1;
}

// 2) Alpha-Maske: Logo = 255, Hintergrund = 0; leicht verkleinern und weichzeichnen (saubere Kante ohne beigen Saum)
const alpha = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) alpha[i] = bg[i] ? 0 : 255;
const maskSoft = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } })
  .median(11) // kleine Löcher/Inseln entfernen
  .blur(1.1)
  .linear(1.6, -90) // Kontrast der Kante erhöhen (Schwelle leicht nach innen)
  .toColourspace("b-w")
  .extractChannel(0)
  .raw()
  .toBuffer();

const rgba = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  rgba[i * 4] = data[i * 3];
  rgba[i * 4 + 1] = data[i * 3 + 1];
  rgba[i * 4 + 2] = data[i * 3 + 2];
  rgba[i * 4 + 3] = maskSoft[i];
}
const cutout = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();

// 3) „QUIZ“-Schild im Stil des Banners (Outfit, extrafett, leicht geneigt, goldene Kante)
const font = fs.readFileSync("node_modules/@fontsource/outfit/files/outfit-latin-800-normal.woff");
const PILL_W = 520;
const PILL_H = 158;
const pillPng = Buffer.from(
  await new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: PILL_W,
          height: PILL_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #223b58 0%, #0f1c2c 100%)",
          border: "7px solid #e9a23b",
          borderRadius: 44,
          color: "#f4ecd9",
          fontFamily: "Outfit",
          fontSize: 118,
          fontWeight: 800,
          letterSpacing: 10,
          transform: "skewX(-6deg)",
        },
      },
      "QUIZ",
    ),
    { width: PILL_W, height: PILL_H, fonts: [{ name: "Outfit", data: font, weight: 800, style: "normal" }] },
  ).arrayBuffer(),
);

const EXTRA = 160; // Leinwand unten erweitern, damit das Schild unter dem Globus „hängt“
const canvasH = H + EXTRA;
const pillLeft = Math.round((W - PILL_W) / 2);
const pillTop = H - 64;
const logo = await sharp({ create: { width: W, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([
    { input: cutout, left: 0, top: 0 },
    { input: pillPng, left: pillLeft, top: pillTop },
  ])
  .png()
  .toBuffer();
fs.writeFileSync(`${OUT}/jahrsager-quiz-logo-full.png`, logo);

// 4) Ausgaben
const trim = await sharp(logo).trim({ threshold: 2 }).toBuffer({ resolveWithObject: true });
console.log("Zuschnitt:", trim.info.width, "x", trim.info.height);
const T = trim.data;
await sharp(T).resize({ width: 1200 }).webp({ quality: 90, alphaQuality: 95 }).toFile(`${OUT}/jahrsager-quiz-logo.webp`);
await sharp(T).resize({ width: 640 }).webp({ quality: 88, alphaQuality: 95 }).toFile(`${OUT}/jahrsager-quiz-logo-640.webp`);
await sharp(T).resize({ width: 1200 }).png().toFile(`${OUT}/jahrsager-quiz-logo.png`);

// Vorschau-Fassungen auf Cremeweiß und Mitternachtsblau (zur Kontrolle der Freistellung)
for (const [name, c] of [["paper", "#f7f5ef"], ["ink", "#16283d"]] as const) {
  await sharp({ create: { width: 1300, height: Math.round((1300 * trim.info.height) / trim.info.width) + 100, channels: 3, background: c } })
    .composite([{ input: await sharp(T).resize({ width: 1200 }).toBuffer(), gravity: "center" }])
    .jpeg({ quality: 90 })
    .toFile(`${OUT}/_preview-${name}.jpg`);
}

// Open-Graph-Fassung (Logo auf Cremeweiß) und App-Icons (Logo zentriert auf Cremeweiß)
await sharp(T).resize({ height: 440 }).flatten({ background: "#f7f5ef" }).jpeg({ quality: 90 }).toFile(`${OUT}/jahrsager-quiz-logo-og.jpg`);
for (const [name, size] of [["icon-512", 512], ["icon-192", 192], ["apple-touch-icon", 180], ["favicon-64", 64]] as const) {
  await sharp(T)
    .resize(size, size, { fit: "contain", background: { r: 247, g: 245, b: 239, alpha: 1 } })
    .flatten({ background: "#f7f5ef" })
    .png()
    .toFile(`${OUT}/${name}.png`);
}
console.log("Logo-Dateien erzeugt.");
