import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EVENT_STATUSES, EVENT_STATUS_LABELS } from "@/lib/constants";
import { formatDateDe } from "@/lib/time";
import { requireAdminPage } from "@/server/admin-session";
import { todayKey } from "@/server/clock";
import { getDb } from "@/server/db/client";
import { listPacks } from "@/server/services/packs";

export default async function AdminHome() {
  await requireAdminPage();
  const db = await getDb();
  const counts = await db.query<{ status: string; n: number }>("select status, count(*)::int as n from events where not is_demo group by status");
  const demo = (await db.one<{ n: number }>("select count(*)::int as n from events where is_demo"))!.n;
  const reports = (await db.one<{ n: number }>("select count(*)::int as n from error_reports where status = 'offen'"))!.n;
  const today = todayKey();
  const packs = (await listPacks(db)).filter((p) => p.pack_date >= today).reverse().slice(0, 7);
  const released = counts.find((c) => c.status === "freigegeben")?.n ?? 0;
  const live = (counts.find((c) => c.status === "eingeplant")?.n ?? 0) + (counts.find((c) => c.status === "veroeffentlicht")?.n ?? 0);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Übersicht</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {EVENT_STATUSES.map((s) => (
          <Link key={s} href={`/admin/ereignisse?status=${s}`}>
            <Card className="p-4">
              <p className="text-sm text-ink-soft">{EVENT_STATUS_LABELS[s]}</p>
              <p className="font-display text-4xl font-semibold tabular-nums">{counts.find((c) => c.status === s)?.n ?? 0}</p>
            </Card>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Produktionsinhalte: {counts.reduce((s, c) => s + c.n, 0)} Ereignisse (freigegeben: {released}, im Einsatz: {live}). Zusätzlich {demo} Demo-Ereignisse.
        Ziel Beta: 75 Ereignisse, Ziel Start: 175.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Kommende Tagespakete</h2>
          {packs.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Keine Pakete eingeplant. <Link className="text-ink underline" href="/admin/pakete">Paket planen</Link></p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {packs.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0">
                  <span>#{p.number} · {formatDateDe(p.pack_date)}</span>
                  <span className="text-ink-soft">{p.pack_date === today ? "heute" : "geplant"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Offene Aufgaben</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-ink underline" href="/admin/meldungen">{reports} offene Fehlermeldung(en)</Link></li>
            <li><Link className="text-ink underline" href="/admin/ereignisse?status=in_pruefung">Ereignisse in Prüfung ansehen</Link></li>
            <li><Link className="text-ink underline" href="/admin/ereignisse/neu">Neues Ereignis anlegen</Link></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
