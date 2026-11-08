import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PLAYER_COOKIE } from "@/lib/constants";
import { rateLimit } from "./auth";
import { ensurePlayer, isUuid } from "./services/games";
import type { Db } from "./db/client";
import { AppError } from "./types";

export function jsonError(e: unknown) {
  if (e instanceof AppError) return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status });
  if (e instanceof ZodError) {
    return NextResponse.json({ error: { code: "UNGUELTIGE_EINGABE", message: "Die Eingabe ist ungültig." } }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json({ error: { code: "SERVERFEHLER", message: "Es ist ein Fehler aufgetreten. Bitte versuche es erneut." } }, { status: 500 });
}

/** Schutz vor Cross-Site-Requests: Origin muss, falls vorhanden, zum Host passen. */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let ok = false;
  try {
    ok = new URL(origin).host === host;
  } catch {
    ok = false;
  }
  if (!ok) throw new AppError("ORIGIN", "Anfrage von unzulässiger Herkunft.", 403);
}

export function clientKey(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "lokal";
}

export function limit(req: Request, bucket: string, max: number, windowMs = 60_000) {
  if (!rateLimit(`${bucket}:${clientKey(req)}`, max, windowMs)) {
    throw new AppError("ZU_VIELE_ANFRAGEN", "Zu viele Anfragen. Bitte warte einen Moment.", 429);
  }
}

export async function readPlayerId(): Promise<string | null> {
  const v = (await cookies()).get(PLAYER_COOKIE)?.value;
  return isUuid(v) ? v : null;
}

/** Liefert die Spieler-ID und legt bei Bedarf eine neue pseudonyme Kennung an (Cookie, 400 Tage). */
export async function requirePlayer(db: Db): Promise<string> {
  const existing = await readPlayerId();
  const id = await ensurePlayer(db, existing);
  if (id !== existing) {
    (await cookies()).set(PLAYER_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
  }
  return id;
}
