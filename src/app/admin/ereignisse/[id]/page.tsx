import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui/card";
import { EVENT_STATUS_LABELS } from "@/lib/constants";
import { requireAdminPage } from "@/server/admin-session";
import { getDb } from "@/server/db/client";
import { eventProblems, getEvent, listRevisions } from "@/server/services/events";
import { isUuid } from "@/server/services/games";
import { EventForm } from "../event-form";
import { ImportButton } from "../import-button";
import { IMAGE_STATUS_LABELS } from "@/server/types";

export const metadata = { title: "Ereignis bearbeiten" };

export default async function EditEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ gespeichert?: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const db = await getDb();
  const e = await getEvent(db, id);
  if (!e) notFound();
  const approval = eventProblems(e, "approval");
  const revisions = await listRevisions(db, id);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{e.neutral_title}</h1>
        <Badge tone="accent">{EVENT_STATUS_LABELS[e.status]}</Badge>
        {e.is_demo && <Badge tone="warn">Demo</Badge>}
        <Link href={`/admin/vorschau/${e.id}`} className="ml-auto text-sm font-medium text-ink underline">Vorschau testen</Link>
      </div>
      {sp.gespeichert && <p role="status" className="mb-4 rounded-xl bg-good-soft p-3 text-sm font-medium text-good">Ereignis angelegt.</p>}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <EventForm event={e} />
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-4">
            <h2 className="text-lg font-semibold">Freigabeprüfung</h2>
            {approval.length === 0 ? (
              <p className="mt-2 text-sm font-medium text-good">Alle Kriterien erfüllt.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                {approval.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold">Bildrecherche</h2>
            <p className="mt-1 text-sm"><strong>Bildstatus:</strong> {IMAGE_STATUS_LABELS[e.image_status]}</p>
            {e.research?.image ? (
              <div className="mt-3 space-y-1.5 text-sm text-ink-soft">
                <p><strong className="text-ink">Kandidat:</strong> <a className="text-ink underline" href={e.research.image.commonsUrl} target="_blank" rel="noopener noreferrer">{e.research.image.commonsFile}</a></p>
                <p><strong className="text-ink">Original:</strong> <a className="text-ink underline" href={e.research.image.originalUrl} target="_blank" rel="noopener noreferrer">Archivseite</a>{!e.research.image.originalReadable && " (bei der Recherche nicht lesbar)"}</p>
                <p><strong className="text-ink">Urheber:</strong> {e.research.image.author}{e.research.image.authorNote && ` – ${e.research.image.authorNote}`}</p>
                <p><strong className="text-ink">Lizenz:</strong> {e.research.image.license}</p>
                <p><strong className="text-ink">Aufnahme:</strong> {e.research.image.photoDate}</p>
                <p><strong className="text-ink">Größe:</strong> {e.research.image.width} × {e.research.image.height}</p>
                {e.research.image.risks.length > 0 && (
                  <ul className="list-disc pl-5">{e.research.image.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                )}
                {e.image_is_placeholder && <ImportButton id={e.id} />}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">Kein Kandidat hinterlegt.</p>
            )}
            {e.research?.openPoints && e.research.openPoints.length > 0 && (
              <>
                <h3 className="mt-4 text-sm font-semibold">Offene Prüfpunkte</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-soft">{e.research.openPoints.map((o, i) => <li key={i}>{o}</li>)}</ul>
              </>
            )}
            {e.research?.factsStatus === "teilweise_hilfsquellen" && (
              <p className="mt-3 rounded-xl bg-sun-soft p-2 text-xs text-ink">Fakten stützen sich teilweise auf Hilfsquellen (Wikipedia) – Primärquellen ergänzen.</p>
            )}
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold">Versionen</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {revisions.map((r) => (
                <li key={r.version} className="flex justify-between gap-2">
                  <span>v{r.version} · {r.note}</span>
                  <span className="text-ink-soft">{new Date(r.created_at).toLocaleDateString("de-DE")}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
