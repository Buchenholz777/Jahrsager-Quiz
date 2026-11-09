import { imageSrc, imageSrcSet } from "@/lib/images";
import { cn } from "@/lib/cn";
import type { ShowcaseEvent } from "@/server/services/showcase";

const frame = "overflow-hidden rounded-2xl border-[3px] border-paper bg-ink-2 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.65)]";
/** Seitenverhältnis des Fotos; nur extreme Formate werden begrenzt, damit praktisch nichts abgeschnitten wird. */
const ratio = (e: ShowcaseEvent) => Math.min(1.6, Math.max(0.72, e.image.width / e.image.height));
const ROT = ["-rotate-[2deg]", "rotate-[2deg]", "rotate-[1.5deg]", "-rotate-[1.5deg]"];

/** Verteilt die Fotos so auf zwei Spalten, dass beide ungefähr gleich hoch werden (Foto behält sein eigenes Format). */
function columns(events: ShowcaseEvent[]) {
  const cols: { e: ShowcaseEvent; i: number }[][] = [[], []];
  const h = [0, 0];
  events.forEach((e, i) => {
    const c = h[0] <= h[1] ? 0 : 1;
    cols[c].push({ e, i });
    h[c] += 1 / ratio(e);
  });
  return cols;
}

/**
 * Editorial-Collage aus authentischen historischen Fotografien (nur ausdrücklich freigegebene Ereignisse).
 * Rein dekorativ/atmosphärisch: keine Jahreszahlen, nicht interaktiv. Bildnachweise stehen darunter.
 */
export function HeroCollage({ events }: { events: ShowcaseEvent[] }) {
  if (events.length < 2) return null;
  const four = events.slice(0, 4);
  const [left, right] = columns(four);
  return (
    <figure className="relative mx-auto w-full max-w-[24rem] sm:max-w-[34rem] lg:row-span-2 lg:col-start-2 lg:row-start-1 lg:max-w-[31rem]">
      {/* Leuchtfläche hinter den Fotos */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-[10%] rounded-full bg-[radial-gradient(closest-side,rgb(255_179_77/0.2),transparent_70%)]" />

      {/* Smartphone: Fotoreihe in einheitlicher Höhe (jedes Foto in seinem Format), seitlich wischbar */}
      <div className="relative lg:hidden">
        <ul className="-mx-4 flex snap-x snap-mandatory items-center gap-3 overflow-x-auto px-4 py-3 sm:mx-0 sm:px-0">
          {four.slice(0, 3).map((e, i) => (
            <li key={e.slug} className={cn("relative h-44 shrink-0 snap-start sm:h-56", frame, ROT[i])} style={{ aspectRatio: ratio(e) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc(e.image, e.image.ext === "svg" ? undefined : 800)} width={e.image.width} height={e.image.height} alt={e.alt} loading="eager" fetchPriority={i === 0 ? "high" : "auto"} decoding="async" className="size-full object-cover" />
              {i === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-ink/85 px-3 py-1 text-xs font-bold text-paper backdrop-blur">Wann war das?</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop: zwei Spalten, jedes Foto im eigenen Format, leicht geneigt und versetzt */}
      <div className="relative hidden grid-cols-2 items-start gap-5 lg:grid">
        {[left, right].map((col, c) => (
          <div key={c} className={cn("flex flex-col gap-5", c === 1 && "mt-12")}>
            {col.map(({ e, i }) => (
              <div
                key={e.slug}
                className={cn("relative transition-transform duration-300 ease-out hover:z-10 hover:-translate-y-1 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:transform-none", frame, ROT[i])}
                style={{ aspectRatio: ratio(e) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc(e.image, e.image.ext === "svg" ? undefined : 1200)}
                  srcSet={imageSrcSet({ ...e.image, placeholder: false })}
                  sizes="(min-width: 1024px) 300px, 50vw"
                  width={e.image.width}
                  height={e.image.height}
                  alt={e.alt}
                  loading="eager"
                  fetchPriority={i === 0 ? "high" : "auto"}
                  decoding="async"
                  className="size-full object-cover"
                />
                {i === 0 && <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-4 py-1.5 text-sm font-bold text-paper backdrop-blur">Wann war das?</span>}
              </div>
            ))}
          </div>
        ))}
        {/* Rätsel-Motiv: Fragezeichen-Marke (dekorativ) */}
        <span aria-hidden="true" className="absolute left-1/2 top-[48%] z-20 flex size-16 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-ink bg-sun font-display text-4xl font-extrabold text-ink shadow-pop">
          ?
        </span>
      </div>

      {/* dekorative Zeitleiste (ohne Zahlen) */}
      <svg aria-hidden="true" viewBox="0 0 400 40" className="relative mt-5 hidden h-auto w-full text-paper/25 lg:block">
        <line x1="4" y1="20" x2="396" y2="20" stroke="currentColor" strokeWidth="2" />
        {Array.from({ length: 21 }, (_, i) => (
          <line key={i} x1={4 + i * 19.6} y1={i % 5 === 0 ? 10 : 15} x2={4 + i * 19.6} y2={i % 5 === 0 ? 30 : 25} stroke="currentColor" strokeWidth="2" />
        ))}
        <circle cx="260" cy="20" r="8" fill="var(--color-sun)" stroke="var(--color-ink)" strokeWidth="3" />
      </svg>

      <details className="relative mt-3 text-xs text-paper/75">
        <summary className="inline-flex min-h-11 cursor-pointer items-center underline-offset-4 hover:text-paper hover:underline">Bildnachweise zur Komposition</summary>
        <ul className="mt-1 space-y-1">
          {four.map((e) => (
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
