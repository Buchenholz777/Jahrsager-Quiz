import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { assertSameOrigin, jsonError, limit } from "@/server/http";
import { ANALYTICS_EVENTS, track } from "@/server/services/analytics";
import { todayKey } from "@/server/clock";

export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  props: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

/** Datensparsame Messung: keine Cookies, keine Kennungen, keine IP-Speicherung. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    limit(req, "messung", 60);
    if (req.headers.get("sec-gpc") === "1" || req.headers.get("dnt") === "1") return new NextResponse(null, { status: 204 });
    const body = Body.parse(await req.json().catch(() => null));
    await track(await getDb(), todayKey(), body.name, body.props);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return jsonError(e);
  }
}
