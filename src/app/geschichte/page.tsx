import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/page-header";
import { Badge, Card } from "@/components/ui/card";
import { CATEGORIES, type CategoryKey } from "@/lib/constants";
import { getDb } from "@/server/db/client";
import { listIndexableKnowledge, listKnowledge } from "@/server/services/knowledge";
import { KNOWLEDGE_MIN } from "@/server/services/knowledge-quality";
import { demoAllowed } from "@/server/services/packs";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const hasContent = (await listIndexableKnowledge(await getDb())).length >= KNOWLEDGE_MIN.listingMinPages;
  return {
    title: "Historische Ereignisse erklärt – das JAHRSAGER-Wissensarchiv",
    description:
      "Historische Ereignisse mit Foto, Jahr, Hintergrund und Quellen: Das Wissensarchiv zu den JAHRSAGER-Rätseln – ideal, um Geschichte spielerisch zu lernen.",
    alternates: { canonical: "/geschichte" },
    robots: hasContent ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function GeschichtePage() {
  const events = await listKnowledge(await getDb());
  return (
    <Container>
      <PageHeader
        eyebrow="Wissensarchiv"
        title="Historische Ereignisse erklärt"
        lead="Zu jedem Ereignis vergangener Tagesrätsel findest du hier Hintergrund, Bedeutung und Quellen. Ereignisse erscheinen erst, nachdem ihr Tagesrätsel vorbei ist."
      />
      {events.length === 0 ? (
        <Card className="max-w-xl p-8">
          <h2 className="text-2xl font-semibold">Noch keine Beiträge</h2>
          <p className="mt-2 text-ink-soft">Das Wissensarchiv füllt sich, sobald redaktionell geprüfte Tagesrätsel abgeschlossen sind.</p>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/geschichte/${e.slug}`} className="group block h-full rounded-card">
                <Card className="h-full overflow-hidden transition-transform group-hover:-translate-y-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/bild/${e.image_id}${e.image_ext === "svg" ? "" : "?w=800"}`}
                    alt={e.image_alt}
                    width={e.image_width ?? 1200}
                    height={e.image_height ?? 800}
                    loading="lazy"
                    className="aspect-[3/2] w-full object-cover"
                  />
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{e.correct_year}</Badge>
                      <Badge>{CATEGORIES[e.category as CategoryKey]}</Badge>
                      {e.is_demo && <Badge tone="warn">Demo</Badge>}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold">{e.public_title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{e.explanation_what}</p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {demoAllowed() && events.some((e) => e.is_demo) && (
        <p className="mt-8 text-sm text-ink-soft">Hinweis: Demo-Inhalte sind Platzhalter, ungeprüft und für Suchmaschinen gesperrt.</p>
      )}
    </Container>
  );
}
