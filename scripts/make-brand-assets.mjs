// Erzeugt die statischen Marken-Dateien (Favicon-Set und Open-Graph-Bild). Einmalig ausführen, Ergebnis wird eingecheckt:
//   node scripts/make-brand-assets.mjs
// Das Favicon ist bewusst vereinfacht (hoher Kontrast, ein großes „?“), damit es bei 16/32 px lesbar bleibt.
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const NAVY = "#16283D";
const YELLOW = "#FFB34D";
const CREAM = "#F7F5EF";

const mark = (bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  ${bg ? `<rect width="100" height="100" rx="${bg === "round" ? 22 : 0}" fill="${NAVY}"/>` : ""}
  <circle cx="50" cy="50" r="40" fill="${YELLOW}"/>
  <path d="M37 41 C37 33 43 29 50 29 C58 29 63 34 63 40 C63 47 56 49 52 53 C50 55 50 58 50 61" fill="none" stroke="${NAVY}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="50" cy="73" r="6.5" fill="${NAVY}"/>
</svg>`;

const png = (svg, size) => sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png().toBuffer();

// PNG-Dateien
writeFileSync("public/favicon-48.png", await png(mark("round"), 48));
writeFileSync("public/favicon-96.png", await png(mark("round"), 96));
writeFileSync("public/apple-touch-icon.png", await png(mark("square"), 180)); // deckender Hintergrund, iOS rundet selbst

// ICO mit PNG-Einträgen 16/32/48
const sizes = [16, 32, 48];
const imgs = await Promise.all(sizes.map((s) => png(mark("round"), s)));
const head = Buffer.alloc(6);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
let offset = 6 + 16 * imgs.length;
const dir = imgs.map((b, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0); e.writeUInt8(sizes[i], 1); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(b.length, 8); e.writeUInt32LE(offset, 12);
  offset += b.length;
  return e;
});
writeFileSync("public/favicon.ico", Buffer.concat([head, ...dir, ...imgs]));

// Open-Graph-Bild 1200×630: nur Marke (Symbol + Wortmarke), keine historischen Fotos
const icon = await png(mark("round"), 240);
const text = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${NAVY}"/>
  <rect x="0" y="0" width="1200" height="14" fill="${YELLOW}"/>
  <text x="600" y="395" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="120" letter-spacing="6" fill="${CREAM}">JAHRSAGER</text>
  <text x="600" y="470" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="50" fill="${YELLOW}">Das tägliche Geschichtsquiz</text>
  <text x="600" y="535" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#C9D3DE">5 historische Bilder · 5 Jahreszahlen · jeden Tag neu</text>
  <text x="600" y="595" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="24" letter-spacing="3" fill="#7FC8C0">WWW.JAHRSAGERQUIZ.DE</text>
</svg>`;
await sharp(Buffer.from(text))
  .composite([{ input: icon, left: 480, top: 60 }])
  .png({ compressionLevel: 9 })
  .toFile("public/brand/og-jahrsager-1200x630.png");

console.log("Marken-Dateien erzeugt.");
