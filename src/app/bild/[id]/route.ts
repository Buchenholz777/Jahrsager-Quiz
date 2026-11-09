import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/constants";
import { IMAGE_WIDTHS } from "@/lib/images";
import { verifyAdminToken } from "@/server/auth";
import { todayKey } from "@/server/clock";
import { getDb } from "@/server/db/client";
import { demoAllowed, publishDuePacks } from "@/server/services/packs";
import { CONTENT_TYPES, getImage } from "@/server/storage";

export const dynamic = "force-dynamic";

/**
 * Bildauslieferung. Bilder sind nur abrufbar, wenn ihr Tagespaket erreicht ist
 * (oder für angemeldete Redakteure). Dateinamen sind zufällig und nicht erratbar.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9]{6,40}$/.test(id)) return new Response("Nicht gefunden", { status: 404 });
  const db = await getDb();
  const today = todayKey();
  await publishDuePacks(db, today);

  const ev = await db.one<{ image_ext: string | null; is_demo: boolean }>(
    `select image_ext, is_demo from events e where image_id = $1 and not blocked and exists (
       select 1 from daily_pack_events pe join daily_packs p on p.id = pe.pack_id where pe.event_id = e.id and p.pack_date <= $2)`,
    [id, today],
  );
  const isPublic = !!ev && (demoAllowed() || !ev.is_demo);
  let ext = ev?.image_ext ?? null;
  if (!isPublic) {
    const admin = await verifyAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
    if (!admin) return new Response("Nicht gefunden", { status: 404 });
    ext = (await db.one<{ image_ext: string | null }>("select image_ext from events where image_id = $1", [id]))?.image_ext ?? null;
  }
  if (!ext) return new Response("Nicht gefunden", { status: 404 });

  const w = Number(new URL(req.url).searchParams.get("w"));
  let file = `${id}.${ext}`;
  let data: Buffer | null = null;
  if (ext !== "svg" && IMAGE_WIDTHS.includes(w as never)) data = await getImage(`${id}-${w}.${ext}`);
  if (!data) data = await getImage(file);
  else file = `${id}-${w}.${ext}`;
  if (!data) return new Response("Nicht gefunden", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
