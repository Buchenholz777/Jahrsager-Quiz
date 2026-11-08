import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Container, PageHeader } from "@/components/page-header";
import { Badge, Card } from "@/components/ui/card";
import { CATEGORIES, type CategoryKey } from "@/lib/constants";
import { formatPoints } from "@/lib/scoring";
import { formatDateDe } from "@/lib/time";
import { getDb } from "@/server/db/client";
import { readPlayerId } from "@/server/http";
import { listArchivePacks } from "@/server/services/packs";

export const metadata: Metadata = {
  title: "Rätselarchiv – frühere Geschichtsrätsel nachspielen",
  description:
    "Alle vergangenen JAHRSAGER-Tagesrätsel als Übung nachspielen: fünf historische Fotos, fünf Jahre schätzen. Archivspiele verändern deine Tageswertung nicht.",
  alternates: { canonical: "/archiv" },
};

export const dynamic = "force-dynamic";

export default async function ArchivPage() {
  const db = await getDb();
  const player = await readPlayerId();
  const packs = await listArchivePacks(db);
  const ids = packs.map((p) => p.id);
  const events = ids.length
    ? await db.query<{ pack_id: string; category: string; image_id: string; position: number }>(
        "select pe.pack_id, e.category, e.image_id, pe.position from daily_pack_events pe join events e on e.id = pe.event_id where pe.pack_id = any($1::uuid[]) order by pe.position",
        [ids],
      )
    : [];
  const games = player
    ? await db.query<{ pack_id: string; status: string; total_points: number }>(
        "select pack_id, status, total_points from games where player_id = $1 and official",
        [player],
      )
    : [];

  return (
    <Container>
      <PageHeader
        eyebrow="Rätselarchiv"
        title="Frühere Rätsel nachspielen"
        lead="Alle bisherigen Tagesrätsel als Übung. Archivspiele verändern deine Tageswertung und Statistik nicht."
      />
      {packs.length === 0 ? (
        <Card className="max-w-xl p-8">
          <h2 className="text-2xl font-semibold">Noch ist das Archiv leer</h2>
          <p className="mt-2 text-ink-soft">Sobald das erste Tagesrätsel vorbei ist, erscheint es hier.</p>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {packs.map((p) => {
            const evs = events.filter((e) => e.pack_id === p.id);
            const g = games.find((x) => x.pack_id === p.id);
            const cats = [...new Set(evs.map((e) => CATEGORIES[e.category as CategoryKey] ?? e.category))];
            return (
              <li key={p.id}>
                <Link href={`/archiv/${p.number}`} className="group block rounded-card">
                  <Card className="p-5 transition-transform group-hover:-translate-y-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display text-2xl font-semibold">Tagesrätsel #{p.number}</p>
                      {g?.status === "abgeschlossen" ? (
                        <Badge tone="good">
                          <Check className="size-3.5" aria-hidden="true" /> {formatPoints(g.total_points)} Punkte
                        </Badge>
                      ) : g ? (
                        <Badge tone="warn">begonnen</Badge>
                      ) : (
                        <Badge>noch nicht gespielt</Badge>
                      )}
                    </div>
                    <p className="text-sm text-ink-soft">{formatDateDe(p.pack_date)}</p>
                    <div className="mt-4 flex gap-1.5" aria-hidden="true">
                      {evs.map((e) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={e.position} src={`/bild/${e.image_id}?w=480`} alt="" loading="lazy" className="h-16 min-w-0 flex-1 rounded-lg border border-line object-cover" />
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">Themen: {cats.join(", ")}</p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
