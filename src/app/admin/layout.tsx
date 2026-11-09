import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/server/admin-session";
import { logoutAction } from "./actions";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: { default: "Redaktion", template: "%s · Redaktion · JAHRSAGER" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const LINKS = [
  ["/admin", "Übersicht"],
  ["/admin/ereignisse", "Ereignisse"],
  ["/admin/freigabe", "Freigabe"],
  ["/admin/automatik", "Automatik"],
  ["/admin/pakete", "Tagespakete"],
  ["/admin/meldungen", "Meldungen"],
  ["/admin/kennzahlen", "Kennzahlen"],
  ["/admin/seo", "SEO-Vorschau"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  return (
    <div className="min-h-[70vh]">
      <div className="border-b border-line bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/admin" className="text-paper"><Logo className="h-14 md:h-14" /></Link>
          <span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-semibold">Redaktion</span>
          {authed && (
            <nav aria-label="Redaktion" className="flex flex-1 flex-wrap items-center gap-1 text-sm">
              {LINKS.map(([h, l]) => (
                <Link key={h} href={h} className="rounded-full px-3 py-2 hover:bg-white/10">{l}</Link>
              ))}
            </nav>
          )}
          {authed && (
            <form action={logoutAction}>
              <button className="rounded-full border border-paper/40 px-4 py-2 text-sm hover:bg-white/10" type="submit">Abmelden</button>
            </form>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
