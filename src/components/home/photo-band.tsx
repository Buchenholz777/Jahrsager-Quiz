import Link from "next/link";
import { imageSrc } from "@/lib/images";
import type { ShowcaseEvent } from "@/server/services/showcase";

const ratio = (e: ShowcaseEvent) => Math.min(1.6, Math.max(0.72, e.image.width / e.image.height));

/**
 * Bildband unter dem Hero: weitere authentische Fotografien als Neugier-Karten („Wann war das?“). Keine Jahreszahlen,
 * jede Karte führt zum Tagesrätsel. Jedes Foto behält sein Format (gleiche Höhe, unterschiedliche Breite); der Bildnachweis
 * steht direkt darunter.
 */
export function PhotoBand({ events }: { events: ShowcaseEvent[] }) {
  if (events.length < 3) return null;
  return (
    <section aria-labelledby="bildband" className="bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-2 sm:px-6">
        <h2 id="bildband" className="text-2xl font-extrabold sm:text-3xl">
          Kennst du diese Momente? <span className="text-sun">Wann waren sie?</span>
        </h2>
        <ul className="-mx-4 mt-6 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {events.slice(0, 8).map((e) => (
            <li key={e.slug} className="shrink-0 snap-start">
              <Link href="/spielen" className="group block focus-visible:outline-none">
                <div
                  className="relative h-56 overflow-hidden rounded-2xl border-[3px] border-paper bg-ink-2 shadow-[0_18px_40px_-14px_rgb(0_0_0/0.7)] transition duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_44px_-14px_rgb(0_0_0/0.8)] group-focus-visible:ring-4 group-focus-visible:ring-sun motion-reduce:transition-none motion-reduce:group-hover:transform-none sm:h-64"
                  style={{ aspectRatio: ratio(e) }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc(e.image, e.image.ext === "svg" ? undefined : 800)}
                    width={e.image.width}
                    height={e.image.height}
                    alt={e.alt}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent px-3 pb-2.5 pt-8 text-sm font-bold">Wann war das? →</span>
                </div>
              </Link>
              <p data-nosnippet className="mt-2 max-w-[16rem] text-xs text-paper/70">Foto: {e.creditShort}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
