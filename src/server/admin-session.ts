import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "@/lib/constants";
import { AppError } from "./types";
import { verifyAdminToken } from "./auth";

export async function isAdmin(): Promise<boolean> {
  return verifyAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** Für Seiten: leitet ohne Sitzung zur Anmeldung um. */
export async function requireAdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Für Server-Aktionen und Routen: wirft bei fehlender Berechtigung. */
export async function requireAdminAction() {
  if (!(await isAdmin())) throw new AppError("NICHT_ANGEMELDET", "Nicht angemeldet.", 401);
}
