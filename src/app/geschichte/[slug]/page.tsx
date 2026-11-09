import type { Metadata } from "next";
import { PageEvent } from "@/components/analytics/page-event";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/page-header";
import { JsonLd } from "@/components/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card, Eyebrow } from "@/components/ui/card";
import { CATEGORIES, type CategoryKey } from "@/lib/constants";
import { absoluteUrl } from "@/lib/site";
import { formatDateDe } from "@/lib/time";
import { getDb } from "@/server/db/client";
import { getKnowledge, relatedKnowledge } from "@/server/services/knowledge";
import { knowledgeQuality } from "@/server/services/knowledge-quality";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ev = await getKnowledge(await getDb(), slug);
  if (!ev) return { title: "Nicht gefunden", robots: { index: false } };
  const desc = `${ev.explanation_what} ${ev.explanation_why}`.slice(0, 158).trim();
  return {
    title: `${ev.public_title} (${ev.correct_year}) – Hintergrund und Bedeutung`,
    description: desc,
    alternates: { canonical: `/geschichte/${ev.slug}` },
    // Nur Seiten mit eigenständigem Informationswert und vollständigen Nachweisen werden indexiert (siehe knowledge-quality.ts).
    robots: ev.is_demo
      ? { index: false, follow: false }
      : knowledgeQuality(ev).indexable
        ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
        : { index: false, follow: true },
    openGraph: { type: "article", title: ev.public_title, description: desc, images: [absoluteUrl(`/bild/${ev.image_id}${ev.image_ext === "svg" ? "" : "?w=1200"}`)] },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const db = await getDb();
  const ev = await getKnowledge(db, slug);
  if (!ev) notFound();
  const related = await relatedKnowledge(db, ev);
  const imgSrc = `/bild/${ev.image_id}${ev.image_ext === "svg" ? "" : "?w=1600"}`;
  const url = absoluteUrl(`/geschichte/${ev.slug}`);

  return (
    <Container>
      <PageEvent name="history_article_view" params={{ page_type: "history_article", event_category: ev.category }} />
      {!ev.is_demo && knowledgeQuality(ev).indexable && (
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: ev.public_title,
              inLanguage: "de-DE",
              image: [absoluteUrl(imgSrc)],
              datePublished: ev.first_date,
              dateModified: new Date(ev.updated_at).toISOString(),
              mainEntityOfPage: url,
              author: { "@type": "Organization", name: "JAHRSAGER Redaktion" },
              publisher: { "@type": "Organization", name: "JAHRSAGER", logo: { "@type": "ImageObject", url: absoluteUrl("/brand/icon-512.png") } },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "JAHRSAGER", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Geschichte", item: absoluteUrl("/geschichte") },
                { "@type": "ListItem", position: 3, name: ev.public_title, item: url },
              ],
            },
          ]}
        />
      )}
      <nav aria-label="Brotkrümel" className="mb-6 text-sm text-ink-soft">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link className="hover:underline" href="/">JAHRSAGER</Link> ›</li>
          <li><Link className="hover:underline" href="/geschichte">Geschichte</Link> ›</li>
          <li aria-current="page" className="text-ink">{ev.public_title}</li>
        </ol>
      </nav>

      <article className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Eyebrow>{CATEGORIES[ev.category as CategoryKey]}</Eyebrow>
            {ev.is_demo && <Badge tone="warn">Demo-Inhalt · nicht indexiert</Badge>}
          </div>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{ev.public_title}</h1>
          <p className="mt-3 font-display text-2xl text-ink">
            {ev.correct_year}
            {ev.exact_date && <span className="ml-3 text-base text-ink-soft">{formatDateDe(ev.exact_date)}</span>}
          </p>

          <div className="prose-zs mt-6">
            <h2>Was geschah?</h2>
            <p>{ev.explanation_what}</p>
            {ev.background && (
              <>
                <h2>Historischer Hintergrund</h2>
                <p>{ev.background}</p>
              </>
            )}
            <h2>Warum war das Ereignis bedeutsam?</h2>
            <p>{ev.explanation_why}</p>
            <h2>Ein Detail zum Bild</h2>
            <p>{ev.explanation_detail}</p>
            <h2>Quellen und weiterführende Informationen</h2>
            <ul>
              {ev.sources.map((s, i) => (
                <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a> : s.label}</li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <figure className="m-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc} alt={ev.image_alt} width={ev.image_width ?? 1200} height={ev.image_height ?? 800} className="h-auto w-full rounded-card border border-line shadow-card" />
            <figcaption className="mt-2 text-xs text-ink-soft">
              Bildnachweis: {ev.image_credit_full}
              {ev.image_license && <> · Lizenz: {ev.image_license_url ? <a className="underline" href={ev.image_license_url} target="_blank" rel="noopener noreferrer">{ev.image_license}</a> : ev.image_license}</>}
            </figcaption>
          </figure>
          <Card className="p-5">
            <h2 className="text-xl font-semibold">Kennst du dich aus?</h2>
            <p className="mt-2 text-sm text-ink-soft">Teste dein Gefühl für Geschichte: jeden Tag fünf neue Ereignisse, kostenlos und ohne Anmeldung.</p>
            <Link href="/spielen" className={buttonVariants({ className: "mt-4 w-full" })}>
              Jetzt Tagesrätsel spielen <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Card>
        </aside>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="verwandt" className="mt-16">
          <h2 id="verwandt" className="text-2xl font-semibold">Verwandte historische Ereignisse</h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/geschichte/${r.slug}`} className="group block h-full rounded-card">
                  <Card className="h-full p-5 transition-transform group-hover:-translate-y-0.5">
                    <Badge tone="accent">{r.correct_year}</Badge>
                    <p className="mt-3 font-display text-lg font-semibold">{r.public_title}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
