import { createHash } from "node:crypto";

/**
 * Erzeugt ein deutlich gekennzeichnetes PLATZHALTER-Bild (SVG). Es ist kein historisches Foto
 * und enthält keine Hinweise auf das Ereignisjahr.
 */
export function placeholderId(slug: string) {
  return "ph" + createHash("sha1").update(`zeitspur:${slug}`).digest("hex").slice(0, 14);
}

function rnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function placeholderSvg(slug: string, w: number, h: number): string {
  const seed = parseInt(createHash("sha1").update(slug).digest("hex").slice(0, 8), 16);
  const r = rnd(seed);
  const shapes: string[] = [];
  const tones = ["#16283d", "#223b58", "#526175", "#ffb34d", "#c4c2b8"];
  for (let i = 0; i < 7; i++) {
    const t = tones[Math.floor(r() * tones.length)];
    const kind = r();
    const x = Math.round(r() * w);
    const y = Math.round(h * (0.35 + r() * 0.6));
    const size = Math.round(Math.min(w, h) * (0.12 + r() * 0.3));
    if (kind < 0.4) shapes.push(`<circle cx="${x}" cy="${y}" r="${size / 2}" fill="${t}" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`);
    else if (kind < 0.75)
      shapes.push(`<rect x="${x - size / 2}" y="${y - size}" width="${size}" height="${size * 1.6}" fill="${t}" opacity="${(0.3 + r() * 0.4).toFixed(2)}"/>`);
    else shapes.push(`<polygon points="${x},${y - size} ${x + size},${y + size / 2} ${x - size},${y + size / 2}" fill="${t}" opacity="${(0.3 + r() * 0.4).toFixed(2)}"/>`);
  }
  const fs = Math.round(Math.min(w, h) * 0.07);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f5ef"/><stop offset="1" stop-color="#e4e3dd"/></linearGradient>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed % 100}"/><feColorMatrix values="0 0 0 0 0.09  0 0 0 0 0.16  0 0 0 0 0.24  0 0 0 0.08 0"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
${shapes.join("\n")}
<rect width="${w}" height="${h}" filter="url(#n)"/>
<rect x="${w * 0.04}" y="${h * 0.04}" width="${w * 0.92}" height="${h * 0.92}" fill="none" stroke="#16283d" stroke-width="${Math.max(2, w / 400)}" stroke-dasharray="${w / 60} ${w / 80}" opacity=".55"/>
<g font-family="Arial, Helvetica, sans-serif" text-anchor="middle" fill="#16283d">
<rect x="${w * 0.16}" y="${h * 0.4}" width="${w * 0.68}" height="${fs * 3.6}" rx="${fs * 0.3}" fill="#F7F5EF" opacity=".92"/>
<text x="${w / 2}" y="${h * 0.4 + fs * 1.45}" font-size="${fs * 1.25}" font-weight="700" letter-spacing="${fs * 0.15}">PLATZHALTER</text>
<text x="${w / 2}" y="${h * 0.4 + fs * 2.75}" font-size="${fs * 0.6}">Demo-Inhalt · kein historisches Foto</text>
</g>
</svg>`;
}
