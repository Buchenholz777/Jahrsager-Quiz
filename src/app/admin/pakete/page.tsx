import { Badge, Card } from "@/components/ui/card";
import { formatDateDe, addDays } from "@/lib/time";
import { requireAdminPage } from "@/server/admin-session";
import { todayKey } from "@/server/clock";
import { getDb } from "@/server/db/client";
import { listEvents } from "@/server/services/events";
import { listPacks } from "@/server/services/packs";
import { Button } from "@/components/ui/button";
import { unscheduleAction } from "../actions";
import { ScheduleForm } from "./schedule-form";

export const metadata = { title: "Tagespakete" };

export default async function PacksAdmin() {
  await requireAdminPage();
  const db = await getDb();
  const today = todayKey();
  const [packs, free] = await Promise.all([listPacks(db), listEvents(db, "freigegeben")]);
  const used = new Set(packs.map((p) => p.pack_date));
  let next = addDays(today, 1);
  while (used.has(next)) next = addDays(next, 1);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold">Tagespakete</h1>
        <p className="mt-1 text-ink-soft">Ein Paket besteht aus fünf freigegebenen Ereignissen aus mindestens drei Themenfeldern. Wechsel täglich um 00:00 Uhr (Europe/Berlin).</p>
      </div>
      <Card className="p-5">
        <h2 className="text-xl font-semibold">Neues Paket planen</h2>
        {free.length < 5 ? (
          <p className="mt-2 text-sm text-ink-soft">Es sind nur {free.length} freigegebene Ereignisse verfügbar. Für ein Paket werden mindestens 5 benötigt.</p>
        ) : (
          <ScheduleForm minDate={today} defaultDate={next} events={free.map((e) => ({ id: e.id, label: `${e.neutral_title} · ${e.category} · Stufe ${e.difficulty} · ${e.correct_year}` }))} />
        )}
      </Card>
      <div>
        <h2 className="mb-3 text-xl font-semibold">Alle Pakete</h2>
        <div className="overflow-x-auto rounded-card border border-line bg-card shadow-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-paper-2/70 text-ink-soft">
              <tr><th scope="col" className="px-4 py-3">Nr.</th><th scope="col" className="px-4 py-3">Datum</th><th scope="col" className="px-4 py-3">Ereignisse</th><th scope="col" className="px-4 py-3">Partien</th><th scope="col" className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {packs.map((p) => (
                <tr key={p.id} className="border-t border-line align-top">
                  <td className="px-4 py-3 font-semibold">#{p.number}</td>
                  <td className="px-4 py-3">{formatDateDe(p.pack_date)} {p.pack_date === today && <Badge tone="good">heute</Badge>}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.titles.join(" · ")}</td>
                  <td className="px-4 py-3 tabular-nums">{p.games}</td>
                  <td className="px-4 py-3">
                    {p.pack_date > today && (
                      <form action={unscheduleAction}><input type="hidden" name="id" value={p.id} /><Button size="sm" variant="ghost" type="submit">Zurücknehmen</Button></form>
                    )}
                  </td>
                </tr>
              ))}
              {packs.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-ink-soft">Noch keine Pakete.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
