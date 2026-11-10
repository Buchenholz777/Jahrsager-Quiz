import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/constants";
import { requireAdminPage } from "@/server/admin-session";
import { getDb } from "@/server/db/client";
import { approveAllAction, approveQuickAction } from "../actions";
import type { AuditEntry, EventRow } from "@/server/types";

export const metadata = { title: "Freigabe-Assistent" };
export const dynamic = "force-dynamic";

export default async function FreigabeAssistent({ searchParams }: { searchParams: Promise<{ fehler?: string; ok?: string }> }) {
  await requireAdminPage();
  const { fehler, ok } = await searchParams;
  const db = await getDb();
  const rows = await db.query<EventRow>(
    "select * from events where status = 'entwurf' and image_id is not null and not image_is_placeholder and not blocked and not is_demo order by created_at",
  );
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Freigabe-Assistent</h1>
        <p className="mt-2 max-w-3xl text-ink-soft">
          Ausnahmefälle auf einen Blick: Bild, Urheber, Lizenz, Quelle und die Gründe der automatischen Prüfung. Eine Freigabe bestätigt, dass <strong>Sie</strong> Bild, Rechte, Fakten und Datum selbst geprüft haben.
          Ereignisse für die Startseite können hier direkt markiert werden.
        </p>
      </div>
      {fehler && <p role="alert" className="rounded-card border-2 border-sun bg-card p-4 font-medium">{fehler}</p>}
      {ok && <p role="status" className="rounded-card border-2 border-good bg-card p-4 font-medium">{ok}</p>}
      {rows.length > 1 && (
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Alle {rows.length} Entwürfe mit Foto auf einmal freigeben</h2>
          <p className="mt-1 text-sm text-ink-soft">Nur Entwürfe mit echtem, gespeichertem Foto. Jedes Ereignis durchläuft trotzdem die Freigabeprüfung (Lizenz, Quelle, Texte); was sie nicht besteht, wird übersprungen und genannt. Prüfen Sie die Bilder unten vorher.</p>
          <form action={approveAllAction} className="mt-3 space-y-2 text-sm">
            <label className="flex items-start gap-2"><input type="checkbox" name="check_rights" required className="mt-1 size-5" /> <span>Urheber, Lizenz und Quelle aller Bilder habe ich geprüft; die Nutzung ist erlaubt.</span></label>
            <label className="flex items-start gap-2"><input type="checkbox" name="check_photo" required className="mt-1 size-5" /> <span>Jedes Foto zeigt sein Ereignis, das Aufnahmedatum passt.</span></label>
            <label className="flex items-start gap-2"><input type="checkbox" name="check_facts" required className="mt-1 size-5" /> <span>Ereignisjahre und Texte habe ich gegen die Quellen geprüft.</span></label>
            <button className={buttonVariants({ size: "sm" })}>Alle {rows.length} freigeben</button>
          </form>
        </Card>
      )}
      {rows.length === 0 && <Card className="p-5 text-ink-soft">Keine offenen Fälle.</Card>}
      {rows.map((e) => {
        const audit = (e.audit ?? []) as AuditEntry[];
        const reasons = audit.filter((a) => a.decision === "manuell" || a.decision === "abgelehnt").flatMap((a) => a.rules);
        const open = (e.research?.openPoints ?? []) as string[];
        return (
          <Card key={e.id} className="p-5">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/bild/${e.image_id}?w=800`} alt={e.image_alt || "Bild zur Prüfung"} className="w-full rounded-card border border-line bg-paper object-contain" />
              <div className="space-y-3 text-sm">
                <h2 className="text-xl font-semibold">{e.neutral_title}</h2>
                <p><strong>Lösung:</strong> {e.correct_year}{e.exact_date ? ` (${e.exact_date})` : ""} · {CATEGORIES[e.category as keyof typeof CATEGORIES] ?? e.category} · <span className="text-ink-soft">{e.public_title}</span></p>
                <p><strong>Urheber:</strong> {e.image_photographer || "–"} · <strong>Institution/Credit:</strong> {e.image_institution || "–"}</p>
                <p><strong>Lizenz:</strong> {e.image_license || "–"} {e.image_license_url && <a className="underline" href={e.image_license_url} target="_blank" rel="noopener noreferrer">Lizenztext</a>}</p>
                <p><strong>Bildquelle:</strong> <a className="break-all underline" href={e.image_source_url} target="_blank" rel="noopener noreferrer">{e.image_source_url}</a></p>
                <p><strong>Aufnahmedatum:</strong> {e.photo_date || "unbekannt"}</p>
                <p><strong>Nachweis:</strong> {e.image_credit_full}</p>
                <div>
                  <strong>Faktenquellen:</strong>
                  <ul className="list-disc pl-5">{e.sources.map((s) => <li key={s.url}>{s.url ? <a className="underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a> : s.label}</li>)}</ul>
                </div>
                {(reasons.length > 0 || open.length > 0) && (
                  <div className="rounded-card border-2 border-sun p-3">
                    <strong>Offene Punkte:</strong>
                    <ul className="list-disc pl-5">{[...reasons, ...open].map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                )}
                <form action={approveQuickAction} className="space-y-3 border-t border-line pt-3">
                  <input type="hidden" name="id" value={e.id} />
                  <label className="block">
                    <span className="font-medium">Alternativtext (am Bild geprüft, ohne Jahr/Namen)</span>
                    <textarea name="image_alt" required minLength={5} rows={2} defaultValue={e.image_alt} className="mt-1 w-full rounded-lg border border-line bg-card p-2" />
                  </label>
                  <label className="flex items-start gap-2"><input type="checkbox" name="check_rights" required className="mt-1 size-5" /> <span>Urheber, Lizenz und Quelle des Bildes habe ich geprüft; die Nutzung ist erlaubt.</span></label>
                  <label className="flex items-start gap-2"><input type="checkbox" name="check_photo" required className="mt-1 size-5" /> <span>Das Foto zeigt dieses Ereignis, das Aufnahmedatum passt.</span></label>
                  <label className="flex items-start gap-2"><input type="checkbox" name="check_facts" required className="mt-1 size-5" /> <span>Ereignisjahr und Texte habe ich gegen die Quellen geprüft.</span></label>
                  <label className="flex items-start gap-2"><input type="checkbox" name="homepage_showcase" className="mt-1 size-5" /> <span>Für die Startseite verwenden (dann nicht im Tagesrätsel).</span></label>
                  <div className="flex flex-wrap gap-3">
                    <button className={buttonVariants({ size: "sm" })}>Freigeben</button>
                    <Link href={`/admin/ereignisse/${e.id}`} className={buttonVariants({ size: "sm", variant: "quiet" })}>Bearbeiten</Link>
                  </div>
                </form>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
