import Link from "next/link";
import { LogoLarge } from "./logo";
import { CLAIM } from "@/lib/constants";
import { ConsentLink } from "./analytics/consent-link";

const LINKS = [
  ["/archiv", "Archiv"],
  ["/geschichte", "Wissensarchiv"],
  ["/so-funktionierts", "Spielanleitung"],
  ["/impressum", "Impressum"],
  ["/datenschutz", "Datenschutz"],
];

/** Schlichter Footer: Marke, Slogan, wenige Links. */
export function SiteFooter() {
  return (
    <footer className="mt-20 bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <LogoLarge />
          <p className="mt-2 text-sm text-paper/80">{CLAIM}</p>
        </div>
        <nav aria-label="Footer" className="-mx-2">
          <ul className="flex flex-wrap gap-x-1 gap-y-0 text-sm text-paper/90">
            {LINKS.map(([h, l]) => (
              <li key={h}>
                <Link className="inline-flex min-h-11 items-center rounded-lg px-2 underline-offset-4 hover:text-sun hover:underline" href={h}>
                  {l}
                </Link>
              </li>
            ))}
            <li>
              <ConsentLink className="inline-flex min-h-11 items-center rounded-lg px-2 underline-offset-4 hover:text-sun hover:underline" />
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-paper/15 py-4 text-center text-xs text-paper/70">© JAHRSAGER · Das tägliche Geschichtsquiz</div>
    </footer>
  );
}
