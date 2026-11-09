import Link from "next/link";
import { imageSrc } from "@/lib/images";
import type { ShowcaseEvent } from "@/server/services/showcase";

/**
 * Bildband unter dem Hero: weitere authentische Fotografien als Neugier-Karten („Wann war das?“). Keine Jahreszahlen,
 * jede Karte führt zum Tagesrätsel. Der Bildnachweis steht direkt unter jedem Foto.
 */
export function PhotoBand({ events }: { events: ShowcaseEvent[] }) {
  if (events.length < 2) return null;
  return (
    <section aria-labelledby="bildband" className="bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-2 sm:px-6">
        <h2 id="bildband" className="text-2xl font-extrabold sm:text-3xl">
          Kennst du diese Momente? <span className="text-sun">Wann waren sie?</span>
        </h2>
        <ul className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {events.slice(0, 8).map((e) => (
            <li key={e.slug} className="w-[68%] shrink-0 snap-start sm:w-auto">
              <Link href="/spielen" className="group block focus-visible:outline-none">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border-[3px] border-paper bg-ink-2 shadow-[0_18px_40px_-14px_rgb(0_0_0/0.7)] transition duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_44px_-14px_rgb(0_0_0/0.8)] group-focus-visible:ring-4 group-focus-visible:ring-sun motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc(e.image, e.image.ext === "svg" ? undefined : 800)}
                    width={e.image.width}
                    height={e.image.height}
                    alt={e.alt}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent px-3 pb-3 pt-10 text-sm font-bold">Wann war das? →</span>
                </div>
              </Link>
              <p className="mt-2 text-xs text-paper/70">
                Foto: {e.creditShort}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
