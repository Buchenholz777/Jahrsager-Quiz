"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/archiv", label: "Archiv" },
  { href: "/geschichte", label: "Geschichte" },
  { href: "/statistik", label: "Statistik" },
  { href: "/so-funktionierts", label: "So funktioniert’s" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/admin")) return null;
  // Während einer aktiven Partie stört kein zweiter „Spielen“-Button.
  const inGame = pathname === "/spielen" || /^\/archiv\/\d+/.test(pathname);
  // Auf der Startseite geht der Header nahtlos in den dunklen Hero über.
  const dark = pathname === "/";
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur",
        dark ? "border-paper/10 bg-ink/95 text-paper" : "border-line bg-paper/92 text-ink supports-[backdrop-filter]:bg-paper/80",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" className="rounded-xl py-0.5" onClick={() => setOpen(false)} aria-label="JAHRSAGER QUIZ – zur Startseite">
          <Logo priority className={inGame ? "h-12 md:h-14" : undefined} />
        </Link>
        <nav aria-label="Hauptnavigation" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2.5 text-[0.95rem] font-medium transition-colors duration-200",
                  dark
                    ? active
                      ? "bg-paper/15 text-paper"
                      : "text-paper/80 hover:bg-paper/10 hover:text-paper"
                    : active
                      ? "bg-ink text-paper"
                      : "text-ink-soft hover:bg-paper-2 hover:text-ink",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5">
          {!inGame && (
            <Link href="/spielen" className={buttonVariants({ size: "sm", variant: "sun" })}>
              Spielen
            </Link>
          )}
          <button
            type="button"
            className={cn("inline-flex size-11 items-center justify-center rounded-full md:hidden", dark ? "text-paper hover:bg-paper/10" : "text-ink hover:bg-paper-2")}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile Navigation" className={cn("animate-fade border-t md:hidden", dark ? "border-paper/10 bg-ink" : "border-line bg-paper")}>
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={cn("flex min-h-12 items-center border-b text-lg font-medium last:border-0", dark ? "border-paper/10" : "border-line")}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
