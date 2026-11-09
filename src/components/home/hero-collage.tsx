import { imageSrc, imageSrcSet } from "@/lib/images";
import { cn } from "@/lib/cn";
import type { ShowcaseEvent } from "@/server/services/showcase";

/** Positionen und Neigungen der Bildflächen (Prozentwerte, damit die Komposition mit der Breite skaliert). */
const TILES = [
  { box: "left-[1%] top-[0%] w-[62%] aspect-[4/5]", rot: "-rotate-[2.5deg]", z: "z-10" },
  { box: "right-[0%] top-[3%] w-[44%] aspect-[4/3]", rot: "rotate-[2.5deg]", z: "z-20" },
  { box: "right-[3%] bottom-[5%] w-[50%] aspect-[3/2]", rot: "-rotate-[1.5deg]", z: "z-30" },
  { box: "left-[0%] bottom-[8%] w-[34%] aspect-[4/5]", rot: "rotate-[3deg]", z: "z-20" },
] as const;

const frame = "overflow-hidden rounded-2xl border-[3px] border-paper bg-ink-2 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.65)]";

/**
 * Editorial-Collage aus authentischen historischen Fotografien (nur ausdrücklich freigegebene Ereignisse).
 * Rein dekorativ/atmosphärisch: keine Jahreszahlen, nicht interaktiv. Bildnachweise stehen darunter.
 */
export function HeroCollage({ events }: { events: ShowcaseEvent[] }) {
  if (events.length < 2) return null;
  return (
    <figure className="relative mx-auto w-full max-w-[24rem] sm:max-w-[30rem] lg:row-span-2 lg:col-start-2 lg:row-start-1 lg:max-w-[40rem]">
      {/* Leuchtfläche hinter den Fotos */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-[12%] -z-0 rounded-full bg-[radial-gradient(closest-side,rgb(255_179_77/0.22),transparent_70%)]" />

      {/* Smartphone: kompakte Fotogruppe (ein großes, zwei kleine Bilder), damit Fotos und Startbutton ohne langes Scrollen sichtbar sind */}
      <div className="relative lg:hidden">
        <div className="grid grid-cols-[1.35fr_1fr] grid-rows-2 gap-3">
          {events.slice(0, 3).map((e, i) => (
            <div key={e.slug} className={cn("relative", frame, i === 0 ? "row-span-2 aspect-[4/4.1] -rotate-[1.5deg]" : "aspect-[3/2]", i === 1 && "rotate-[1.5deg]", i === 2 && "-rotate-[1deg]")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc(e.image, e.image.ext === "svg" ? undefined : 800)} width={e.image.width} height={e.image.height} alt={e.alt} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" className="size-full object-cover" />
              {i === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-ink/85 px-3 py-1 text-xs font-bold text-paper backdrop-blur">Wann war das?</span>}
            </div>
          ))}
        </div>
        <span aria-hidden="true" className="absolute right-[2%] top-1/2 z-40 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-ink bg-sun font-display text-xl font-extrabold text-ink shadow-pop">?</span>
      </div>

      <div className="relative hidden aspect-[5/5.5] w-full lg:block">
        {/* dekorative Zeitleiste im Hintergrund (ohne Zahlen) */}
        <svg aria-hidden="true" viewBox="0 0 400 40" className="absolute inset-x-0 bottom-[-4%] h-auto w-full text-paper/25">
          <line x1="4" y1="20" x2="396" y2="20" stroke="currentColor" strokeWidth="2" />
          {Array.from({ length: 21 }, (_, i) => (
            <line key={i} x1={4 + i * 19.6} y1={i % 5 === 0 ? 10 : 15} x2={4 + i * 19.6} y2={i % 5 === 0 ? 30 : 25} stroke="currentColor" strokeWidth="2" />
          ))}
          <circle cx="260" cy="20" r="8" fill="var(--color-sun)" stroke="var(--color-ink)" strokeWidth="3" />
        </svg>

        {events.slice(0, 4).map((e, i) => {
          const t = TILES[i];
          return (
            <div key={e.slug} className={cn("group absolute transition-transform duration-300 ease-out hover:z-50 hover:-translate-y-1 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:transform-none", frame, t.box, t.rot, t.z)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc(e.image, e.image.ext === "svg" ? undefined : 1200)}
                srcSet={imageSrcSet({ ...e.image, placeholder: false })}
                sizes="(min-width: 1024px) 420px, 50vw"
                width={e.image.width}
                height={e.image.height}
                alt={e.alt}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                className="size-full object-cover"
              />
              {i === 0 && <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-4 py-1.5 text-sm font-bold text-paper backdrop-blur">Wann war das?</span>}
            </div>
          );
        })}

        {/* Rätsel-Motiv: Fragezeichen-Marke (dekorativ) */}
        <span aria-hidden="true" className="absolute left-[50%] top-[46%] z-40 flex size-16 items-center justify-center rounded-full border-[3px] border-ink bg-sun font-display text-4xl font-extrabold text-ink shadow-pop">
          ?
        </span>
      </div>

      <details className="relative mt-4 text-xs text-paper/75">
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
