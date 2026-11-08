import fs from "node:fs/promises";
import path from "node:path";

/**
 * Bildspeicher. `local`: ./storage/images (Entwicklung). `supabase`: privater Supabase-Storage-Bucket
 * (Produktion auf Vercel, da dort das Dateisystem nicht beschreibbar ist).
 * Der Supabase-Treiber ist implementiert, aber bislang nicht gegen eine echte Instanz getestet.
 */
const LOCAL_DIR = path.join(process.cwd(), "storage", "images");
const driver = () => process.env.STORAGE_DRIVER ?? "local";

function supa() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "zeitspur-images";
  if (!url || !key) throw new Error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY sind erforderlich (STORAGE_DRIVER=supabase).");
  return { base: `${url.replace(/\/$/, "")}/storage/v1/object/${bucket}`, key };
}

export const CONTENT_TYPES: Record<string, string> = {
  svg: "image/svg+xml",
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
};

const safeName = (name: string) => {
  if (!/^[a-z0-9._-]+$/i.test(name) || name.includes("..")) throw new Error("Ungültiger Dateiname");
  return name;
};

export async function putImage(name: string, data: Buffer, contentType: string) {
  safeName(name);
  if (driver() === "supabase") {
    const { base, key } = supa();
    const res = await fetch(`${base}/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": contentType, "x-upsert": "true" },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Supabase-Upload fehlgeschlagen (${res.status})`);
    return;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, name), data);
}

export async function getImage(name: string): Promise<Buffer | null> {
  safeName(name);
  if (driver() === "supabase") {
    const { base, key } = supa();
    const res = await fetch(`${base}/${name}`, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  }
  try {
    return await fs.readFile(path.join(LOCAL_DIR, name));
  } catch {
    return null;
  }
}
