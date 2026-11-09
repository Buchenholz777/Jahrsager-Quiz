import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/json-ld";
import { Badge, Card } from "@/components/ui/card";
import { CATEGORIES, type CategoryKey } from "@/lib/constants";
import { absoluteUrl } from "@/lib/site";
import { getDb } from "@/server/db/client";
import { categoriesWithOverview, listIndexableKnowledge } from "@/server/services/knowledge";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ kategorie: string }> };

/** Eigenständige Themenübersicht – nur, wenn mindestens drei qualitätsgeprüfte Wissensseiten dazu existieren (sonst 404). */
async function load(kategorie: string) {
  if (!(kategorie in CATEGORIES)) return null;
  const all = await listIndexableKnowledge(await getDb());
  if (!categoriesWithOverview(all).includes(kategorie)) return null;
  return all.filter((e) => e.category === kategorie);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategorie } = await params;
  const events = await load(kategorie);
  if (!events) return { title: "Nicht gefunden", robots: { index: false } };
  const label = CATEGORIES[kategorie as CategoryKey];
  return {
    title: `${label}: Ereignisse der Weltgeschichte`,
    description: `${events.length} historische Ereignisse aus dem Bereich ${label} mit Foto, Jahr, Hintergrund und Quellen – aus den JAHRSAGER-Rätseln.`,
    alternates: { canonical: `/geschichte/thema/${kategorie}` },
    robots: { index: true, follow: true },
  };
}

export default async function ThemaPage({ params }: Props) {
  const { kategorie } = await params;
  const events = await load(kategorie);
  if (!events) notFound();
  const label = CATEGORIES[kategorie as CategoryKey];
  return (
    <Container>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "JAHRSAGER", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Geschichte", item: absoluteUrl("/geschichte") },
            { "@type": "ListItem", position: 3, name: label, item: absoluteUrl(`/geschichte/thema/${kategorie}`) },
          ],
        }}
      />
      <PageHeader eyebrow="Wissensarchiv" title={`${label}: historische Ereignisse erklärt`} lead={`Ereignisse aus dem Bereich ${label}, die in JAHRSAGER-Rätseln vorkamen – jeweils mit Hintergrund, Bedeutung und Quellen.`} />
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <li key={e.id}>
            <Link href={`/geschichte/${e.slug}`} className="group block h-full rounded-card">
              <Card className="h-full p-5 transition-transform group-hover:-translate-y-0.5">
                <Badge tone="accent">{e.correct_year}</Badge>
                <h2 className="mt-3 text-xl font-semibold">{e.public_title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{e.explanation_what}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8">
        <Link href="/geschichte" className="underline">
          Alle Ereignisse im Wissensarchiv
        </Link>
      </p>
    </Container>
  );
}
