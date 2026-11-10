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
        {/* Smartphone: Kopfzeile (Logo, Abmelden) und darunter eine waagerecht wischbare Navigationsleiste; ab md in einer Zeile */}
        <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-2 sm:px-6 md:flex md:flex-wrap md:gap-x-6 md:py-3">
          <Link href="/admin" className="text-paper"><Logo className="h-10 md:h-14" /></Link>
          <span className="justify-self-start rounded-full bg-sun px-2.5 py-0.5 text-xs font-semibold">Redaktion</span>
          {authed && (
            <form action={logoutAction} className="md:order-last">
              <button className="min-h-11 rounded-full border border-paper/40 px-4 text-sm hover:bg-white/10" type="submit">Abmelden</button>
            </form>
          )}
          {authed && (
            <nav aria-label="Redaktion" className="-mx-4 col-span-3 flex gap-1 overflow-x-auto px-4 pb-1 text-sm [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:flex-1 md:flex-wrap md:overflow-visible md:p-0 [&::-webkit-scrollbar]:hidden">
              {LINKS.map(([h, l]) => (
                <Link key={h} href={h} className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 hover:bg-white/10">{l}</Link>
              ))}
            </nav>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
