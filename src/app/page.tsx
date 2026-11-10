import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock, Camera, SlidersHorizontal } from "lucide-react";
import { HeroCollage } from "@/components/home/hero-collage";
import { PhotoBand } from "@/components/home/photo-band";
import { ModeSelect } from "@/components/home/mode-select";
import { HomeCta } from "@/components/home/home-cta";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { CATEGORIES, type CategoryKey } from "@/lib/constants";
import { activeHeroVariant } from "@/lib/experiments";
import { imageSrc, imageSrcSet } from "@/lib/images";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import { getDb } from "@/server/db/client";
import { getShowcase } from "@/server/services/showcase";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

// Die Bildauswahl hängt vom aktuellen Tag ab (nur Ereignisse vergangener Rätsel) – daher dynamisch.
export const dynamic = "force-dynamic";

const STEPS = [
  { icon: Camera, title: "Bild entdecken", text: "Sieh dir ein historisches Ereignis an." },
  { icon: SlidersHorizontal, title: "Jahr schätzen", text: "Finde heraus, wann es stattgefunden hat." },
  { icon: BookOpen, title: "Geschichte erleben", text: "Sammle Punkte und erfahre, was damals geschah." },
];

export default async function HomePage() {
  const showcase = await getShowcase(await getDb()).catch(() => ({ hero: [], teaser: [], more: [] }));
  const variant = activeHeroVariant();

  return (
    <>
      <section className="hero-bg relative overflow-hidden text-paper" data-hero-variant={variant}>
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-6 px-4 pb-12 pt-6 sm:px-6 md:pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-x-10 lg:gap-y-0 lg:pb-20 lg:pt-14">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sun sm:text-sm">Das tägliche Geschichtsquiz</p>
            <h1 className="mt-3 text-[2.35rem] font-extrabold leading-[1.06] text-paper sm:text-5xl lg:text-[3.5rem]">
              <span className="sr-only">JAHRSAGER – </span>
              5 Bilder.
              <br />
              5 Ereignisse.
              <br />
              <span className="relative inline-block text-sun">
                Rate das Jahr.
                <svg aria-hidden="true" viewBox="0 0 200 8" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2 w-full">
                  <path d="M2 5 C 50 1, 150 1, 198 5" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-paper/90 sm:text-lg">
              JAHRSAGER ist das kostenlose tägliche Geschichtsquiz: Jeden Tag zeigen dir fünf historische Bilder große Momente der Weltgeschichte. Du schätzt die Jahreszahl, erfährst die Hintergründe und sammelst bis zu 5.000 Punkte – ohne Anmeldung.
            </p>
          </div>
          <HeroCollage events={showcase.hero} />
          <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
            <div className="mt-0 lg:mt-6">
              <HomeCta variant={variant} />
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-x-3 text-sm font-medium text-paper/80">
              <span>5 Ereignisse</span>
              <span aria-hidden="true" className="size-1 rounded-full bg-sun" />
              <span>Bis zu 5.000 Punkte</span>
            </p>
          </div>
        </div>
      </section>

      <PhotoBand events={showcase.more} />

      <ModeSelect />

      <section aria-labelledby="so-geht-es" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 id="so-geht-es" className="text-3xl font-bold sm:text-4xl">
          So funktioniert’s
        </h2>
        <ol className="mt-7 grid gap-3 md:grid-cols-3 md:gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Card className="flex h-full items-center gap-4 p-5 md:block md:p-6">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sun text-ink" aria-hidden="true">
                  <s.icon className="size-6" />
                </span>
                <div className="md:mt-4">
                  <h3 className="text-xl font-bold md:text-2xl">
                    <span className="mr-2 text-ink-soft">{i + 1}.</span>
                    {s.title}
                  </h3>
                  <p className="mt-1 text-ink-soft">{s.text}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
        <p className="mt-5">
          <Link href="/so-funktionierts" className="font-semibold text-ink underline decoration-sun decoration-[3px] underline-offset-4">
            Alle Regeln und die Punkteberechnung ansehen
          </Link>
        </p>
      </section>

      <section aria-labelledby="entdecken" className="border-y border-line bg-paper-2/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="entdecken" className="text-3xl font-bold sm:text-4xl">
              Weltgeschichte entdecken
            </h2>
            <Link href="/geschichte" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-ink underline decoration-sun decoration-[3px] underline-offset-4">
              Zum Wissensarchiv <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-2 max-w-xl text-ink-soft">Ausgewählte Ereignisse vergangener Rätsel – mit Hintergrund, Bedeutung und Quellen.</p>
          {showcase.teaser.length > 0 && (
            <ul className="mt-7 grid gap-4 md:grid-cols-3">
              {showcase.teaser.map((e) => (
                <li key={e.slug}>
                  <article className="group h-full overflow-hidden rounded-card border border-line bg-card shadow-card">
                    <Link href={`/geschichte/${e.slug}`} className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc(e.image, e.image.ext === "svg" ? undefined : 800)}
                        srcSet={imageSrcSet({ ...e.image, placeholder: false })}
                        sizes="(min-width: 768px) 360px, 100vw"
                        width={e.image.width}
                        height={e.image.height}
                        alt={e.alt}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="p-4">
                        <Badge>{CATEGORIES[e.category as CategoryKey]}</Badge>
                        <h3 className="mt-2 text-xl font-bold leading-snug">{e.title}</h3>
                      </div>
                    </Link>
                    <p className="px-4 pb-4 text-xs text-ink-soft">
                      {e.creditShort} ·{" "}
                      {e.licenseUrl.startsWith("http") ? (
                        <a href={e.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
                          {e.license}
                        </a>
                      ) : (
                        e.license
                      )}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="taeglich" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-5 rounded-card border border-line bg-card p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-sun" aria-hidden="true">
              <CalendarClock className="size-6" />
            </span>
            <div>
              <h2 id="taeglich" className="text-2xl font-bold sm:text-3xl">
                Täglich neu
              </h2>
              <p className="mt-1 max-w-xl text-ink-soft">Jeden Tag um 00:00 Uhr (Berliner Zeit) erscheinen fünf neue Ereignisse – für alle dieselben. Miss dich mit Freunden und baue deine Serie aus.</p>
            </div>
          </div>
          <Link href="/spielen" className={buttonVariants({ variant: "primary", size: "lg", className: "w-full shrink-0 sm:w-auto" })}>
            Zum Tagesrätsel <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
