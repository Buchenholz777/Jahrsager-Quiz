import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORIES, DIFFICULTY_LABELS, EVENT_STATUSES, EVENT_STATUS_LABELS, type CategoryKey, type EventStatus } from "@/lib/constants";
import { requireAdminPage } from "@/server/admin-session";
import { getDb } from "@/server/db/client";
import { listEvents, listEventsWithoutPhoto } from "@/server/services/events";

export const metadata = { title: "Ereignisse" };

export default async function EventsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; foto?: string }> }) {
  await requireAdminPage();
  const { status, foto } = await searchParams;
  const noPhoto = foto === "fehlt";
  const filter = EVENT_STATUSES.includes(status as EventStatus) ? (status as EventStatus) : undefined;
  const events = noPhoto ? await listEventsWithoutPhoto(await getDb()) : await listEvents(await getDb(), filter);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Ereignisse</h1>
        <Link href="/admin/ereignisse/neu" className={buttonVariants({ size: "sm" })}>Neues Ereignis</Link>
      </div>
      <nav aria-label="Statusfilter" className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/ereignisse" className={buttonVariants({ size: "sm", variant: filter ? "quiet" : "secondary" })}>Alle</Link>
        {EVENT_STATUSES.map((s) => (
          <Link key={s} href={`/admin/ereignisse?status=${s}`} className={buttonVariants({ size: "sm", variant: filter === s ? "secondary" : "quiet" })}>
            {EVENT_STATUS_LABELS[s]}
          </Link>
        ))}
        <Link href="/admin/ereignisse?foto=fehlt" className={buttonVariants({ size: "sm", variant: noPhoto ? "secondary" : "quiet" })}>Ohne Foto</Link>
      </nav>
      {noPhoto && <p className="mt-3 max-w-3xl text-sm text-ink-soft">Diese Einträge haben (noch) kein Foto. Sie können nicht geprüft, freigegeben oder eingeplant werden, bevor ein passendes, rechtlich geprüftes Foto hinterlegt ist.</p>}
      <div className="mt-6 overflow-x-auto rounded-card border border-line bg-card shadow-card">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-paper-2/70 text-ink-soft">
            <tr>
              <th scope="col" className="px-4 py-3">Titel</th>
              <th scope="col" className="px-4 py-3">Jahr</th>
              <th scope="col" className="px-4 py-3">Thema</th>
              <th scope="col" className="px-4 py-3">Stufe</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Version</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">
                  <Link className="text-ink underline underline-offset-2" href={`/admin/ereignisse/${e.id}`}>{e.neutral_title}</Link>
                  {e.is_demo && <Badge tone="warn" className="ml-2">Demo</Badge>}
                  {!e.image_id && <Badge tone="warn" className="ml-2">Kein Foto</Badge>}
                </td>
                <td className="px-4 py-3 tabular-nums">{e.correct_year}</td>
                <td className="px-4 py-3">{CATEGORIES[e.category as CategoryKey]}</td>
                <td className="px-4 py-3">{DIFFICULTY_LABELS[e.difficulty]}</td>
                <td className="px-4 py-3"><Badge tone={e.status === "veroeffentlicht" ? "good" : e.status === "freigegeben" || e.status === "eingeplant" ? "accent" : "neutral"}>{EVENT_STATUS_LABELS[e.status]}</Badge></td>
                <td className="px-4 py-3 tabular-nums">v{e.version}</td>
              </tr>
            ))}
            {events.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-ink-soft">Keine Ereignisse.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
