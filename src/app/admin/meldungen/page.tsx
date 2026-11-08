import Link from "next/link";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/server/admin-session";
import { getDb } from "@/server/db/client";
import { listReports } from "@/server/services/reports";
import { resolveReportAction } from "../actions";

export const metadata = { title: "Fehlermeldungen" };

export default async function ReportsAdmin() {
  await requireAdminPage();
  const reports = await listReports(await getDb());
  return (
    <div>
      <h1 className="text-3xl font-semibold">Gemeldete Fehler</h1>
      <p className="mt-1 text-ink-soft">Bestätigte Fehler werden am Ereignis korrigiert (mit Änderungsnotiz, neue Version) und transparent dokumentiert.</p>
      <ul className="mt-6 space-y-4">
        {reports.map((r) => (
          <li key={r.id}>
            <Card className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={r.status === "offen" ? "warn" : "neutral"}>{r.status}</Badge>
                {r.event_id && <Link className="font-medium text-ink underline" href={`/admin/ereignisse/${r.event_id}`}>{r.neutral_title}</Link>}
                <span className="ml-auto text-xs text-ink-soft">{new Date(r.created_at).toLocaleString("de-DE")}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap">{r.message}</p>
              {r.status === "offen" ? (
                <form action={resolveReportAction} className="mt-4 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <label className="min-w-60 flex-1 text-sm">
                    <span className="font-medium">Notiz</span>
                    <input name="note" className="mt-1 w-full rounded-xl border-2 border-line bg-card px-3 py-2" />
                  </label>
                  <Button size="sm" type="submit" name="status" value="bearbeitet">Bearbeitet</Button>
                  <Button size="sm" variant="ghost" type="submit" name="status" value="verworfen">Verwerfen</Button>
                </form>
              ) : r.resolution_note ? <p className="mt-2 text-sm text-ink-soft">Notiz: {r.resolution_note}</p> : null}
            </Card>
          </li>
        ))}
        {reports.length === 0 && <li className="text-ink-soft">Keine Meldungen.</li>}
      </ul>
    </div>
  );
}
