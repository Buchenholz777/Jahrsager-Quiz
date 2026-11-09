import { imageSrc, imageSrcSet } from "@/lib/images";
import { cn } from "@/lib/cn";
import type { ShowcaseEvent } from "@/server/services/showcase";

/** Positionen und Neigungen der vier Bildflächen (Prozentwerte, damit die Komposition mit der Breite skaliert). */
const TILES = [
  { box: "left-[2%] top-[1%] w-[56%] aspect-[4/5]", rot: "-rotate-[2deg]", z: "z-10" },
  { box: "right-0 top-[6%] w-[44%] aspect-[4/3]", rot: "rotate-[2deg]", z: "z-20" },
  { box: "right-[6%] bottom-[2%] w-[52%] aspect-[3/2]", rot: "-rotate-[1.5deg]", z: "z-30" },
  { box: "left-0 bottom-[10%] w-[33%] aspect-square", rot: "rotate-[3deg]", z: "z-20" },
] as const;

/**
 * Editorial-Collage aus authentischen historischen Fotografien (nur Ereignisse vergangener Tagesrätsel).
 * Rein dekorativ/atmosphärisch: keine Jahreszahlen, nicht interaktiv. Bildnachweise stehen darunter.
 */
export function HeroCollage({ events }: { events: ShowcaseEvent[] }) {
  if (events.length < 2) return null;
  return (
    <figure className="relative mx-auto w-full max-w-[34rem] lg:row-span-2 lg:col-start-2 lg:row-start-1">
      {/* Smartphone: kompakte Fotogruppe (ein großes, zwei kleine Bilder), damit Fotos und Startbutton ohne langes Scrollen sichtbar sind */}
      <div className="relative lg:hidden">
        <div className="grid grid-cols-[1.35fr_1fr] grid-rows-2 gap-2.5">
          {events.slice(0, 3).map((e, i) => (
            <div key={e.slug} className={cn("relative overflow-hidden rounded-xl border-2 border-paper/90 bg-ink-2 shadow-pop", i === 0 ? "row-span-2 aspect-[4/3.3] -rotate-[1.5deg]" : "aspect-[3/2]", i === 1 && "rotate-[1.5deg]", i === 2 && "-rotate-[1deg]")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc(e.image, e.image.ext === "svg" ? undefined : 800)} width={e.image.width} height={e.image.height} alt={e.alt} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" className="size-full object-cover" />
            </div>
          ))}
        </div>
        <span aria-hidden="true" className="absolute right-[3%] top-1/2 z-40 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-ink bg-sun font-display text-xl font-extrabold text-ink shadow-pop">?</span>
      </div>

      <div className="relative hidden aspect-[5/5.1] w-full lg:block">
        {/* dekorative Zeitleiste im Hintergrund (ohne Zahlen) */}
        <svg aria-hidden="true" viewBox="0 0 400 40" className="absolute inset-x-0 bottom-[-2%] h-auto w-full text-paper/25">
          <line x1="4" y1="20" x2="396" y2="20" stroke="currentColor" strokeWidth="2" />
          {Array.from({ length: 21 }, (_, i) => (
            <line key={i} x1={4 + i * 19.6} y1={i % 5 === 0 ? 10 : 15} x2={4 + i * 19.6} y2={i % 5 === 0 ? 30 : 25} stroke="currentColor" strokeWidth="2" />
          ))}
          <circle cx="260" cy="20" r="8" fill="var(--color-sun)" stroke="var(--color-ink)" strokeWidth="3" />
        </svg>

        {events.slice(0, 4).map((e, i) => {
          const t = TILES[i];
          return (
            <div key={e.slug} className={cn("absolute overflow-hidden rounded-2xl border-2 border-paper/90 bg-ink-2 shadow-pop", t.box, t.rot, t.z)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc(e.image, e.image.ext === "svg" ? undefined : 800)}
                srcSet={imageSrcSet({ ...e.image, placeholder: false })}
                sizes="(min-width: 1024px) 300px, 50vw"
                width={e.image.width}
                height={e.image.height}
                alt={e.alt}
                loading="lazy"
                fetchPriority="auto"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          );
        })}

        {/* Rätsel-Motiv: Fragezeichen-Marke (dekorativ) */}
        <span
          aria-hidden="true"
          className="absolute left-[44%] top-[44%] z-40 flex size-12 items-center justify-center rounded-full border-[3px] border-ink bg-sun font-display text-2xl font-extrabold text-ink shadow-pop sm:size-14 sm:text-3xl"
        >
          ?
        </span>
      </div>

      <details className="mt-4 text-xs text-paper/75">
        <summary className="inline-flex min-h-11 cursor-pointer items-center underline-offset-4 hover:text-paper hover:underline">Bildnachweise zur Komposition</summary>
        <ul className="mt-1 space-y-1">
          {events.slice(0, 4).map((e) => (
            <li key={e.slug}>
              {e.creditShort} ·{" "}
              {e.licenseUrl.startsWith("http") ? (
                <a href={e.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-paper">
                  {e.license}
                </a>
              ) : (
                e.license
              )}
            </li>
          ))}
        </ul>
      </details>
    </figure>
  );
}
