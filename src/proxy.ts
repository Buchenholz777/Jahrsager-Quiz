import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";
import { verifyAdminToken } from "@/server/auth";

/**
 * Schutz des Redaktionsbereichs: ohne gültige Admin-Sitzung wird auf die Anmeldung umgeleitet.
 * Zusätzlich prüft jede Seite und jede Server-Aktion die Sitzung erneut (Defense in Depth).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const ok = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };
