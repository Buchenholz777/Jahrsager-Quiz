import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/constants";
import { requireAdminPage } from "@/server/admin-session";
import { getDb } from "@/server/db/client";
import { approveAllAction, approveQuickAction } from "../actions";
import { DeleteButton } from "./delete-button";
import type { AuditEntry, EventRow } from "@/server/types";
import { buildAttribution, missingRights, RIGHTS_STATUS_LABEL } from "@/lib/bildrechte";
import { checkSignificance, VERDICT_LABEL } from "@/lib/bedeutung";

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
        const bed = e.research?.bedeutung;
        const sig = bed ? checkSignificance(bed) : null;
        const rights = e.research?.bildrechte;
        const attribution = rights ? buildAttribution(rights) : null;
        const rightsAudit = audit.filter((a) => ["lizenz", "bearbeitung", "personenrechte", "rechtepruefung", "bildnachweis"].includes(a.step));
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
                <div className="rounded-card border border-line bg-paper p-3" data-testid="rechte-info">
                  <p><strong>Rechteprüfung:</strong> {rights ? RIGHTS_STATUS_LABEL[rights.status] : "keine automatisch erfasste Rechteprüfung"}{rights?.checkedBy === "auto" && " (automatisch vorbereitet)"}</p>
                  {rights && (
                    <ul className="mt-1 list-disc pl-5 text-ink-soft">
                      <li>Lizenz: {rights.license || "–"}{rights.licenseVersion && ` (Version ${rights.licenseVersion})`} · Prüfgrundlage: {rights.basis || "–"}</li>
                      <li>Geprüft am: {rights.rightsCheckedAt ? new Date(rights.rightsCheckedAt).toLocaleString("de-DE") : "–"} · Originaldatei: <a className="break-all underline" href={rights.originalFileUrl} target="_blank" rel="noopener noreferrer">{rights.originalFileUrl ? "Link" : "–"}</a></li>
                      <li>Bearbeitung: {rights.edits.licenseRelevant.length ? rights.edits.licenseRelevant.join("; ") : "nur technisch (Größe, Format, Metadaten)"}</li>
                      {rights.restrictions.length > 0 && <li>Einschränkungen: {rights.restrictions.join("; ")}</li>}
                    </ul>
                  )}
                  {attribution && attribution.missing.length > 0 && <p className="mt-1 font-semibold">Pflichtangaben fehlen: {attribution.missing.join(", ")}</p>}
                  {attribution && <p className="mt-1"><strong>Erzeugte Namensnennung:</strong> {attribution.full}</p>}
                  {rights && missingRights(rights).length === 0 && /cc[ -]by/i.test(rights.license) && <p className="mt-1 text-ink-soft">CC BY: Die Namensnennung wird beim Bild angezeigt; vor der Freigabe Herkunft (Uploader/Institution) kurz gegenprüfen.</p>}
                  {rightsAudit.length > 0 && (
                    <details className="mt-1"><summary className="cursor-pointer font-semibold">Prüfprotokoll Rechte ({rightsAudit.length})</summary>
                      <ul className="mt-1 list-disc pl-5">{rightsAudit.map((a, i) => <li key={i}><strong>{a.step}</strong> ({a.decision}): {a.rules.join(" ")}</li>)}</ul>
                    </details>
                  )}
                </div>
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
                <div className="rounded-card border border-line bg-paper p-3" data-testid="bedeutung-info">
                  <p><strong>Weltgeschichtliche Bedeutung:</strong> {bed ? VERDICT_LABEL[bed.verdict] : "noch nicht erfasst"}{bed?.checkedBy === "auto" && " (automatisch bewertet)"}</p>
                  {bed?.reason && <p className="mt-1">{bed.reason}</p>}
                  <ul className="mt-1 list-disc pl-5 text-ink-soft">
                    {bed?.sitelinks !== undefined && <li>Internationale Beachtung: {bed.sitelinks} Wikipedia-Sprachversionen</li>}
                    {bed?.imageSpecificity && <li>Bildbezug: {bed.imageSpecificity}</li>}
                    {bed?.yearUnambiguous !== undefined && <li>Jahr eindeutig belegt: {bed.yearUnambiguous ? "ja" : "nein"}</li>}
                  </ul>
                  {sig && sig.result !== "ok" && <ul className="mt-1 list-disc pl-5 font-semibold">{sig.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
                </div>
                <form action={approveQuickAction} className="space-y-3 border-t border-line pt-3">
                  <input type="hidden" name="id" value={e.id} />
                  <label className="block">
                    <span className="font-medium">Warum hat das Ereignis Weltgeschichte geschrieben? (ein konkreter Satz, Pflicht für die Freigabe)</span>
                    <textarea name="significance_reason" rows={2} defaultValue={bed?.reason ?? ""} className="mt-1 w-full rounded-lg border border-line bg-card p-2" />
                  </label>
                  <label className="block">
                    <span className="font-medium">Urteil</span>
                    <select name="significance_verdict" defaultValue={bed?.verdict === "nicht_weltgeschichtlich" ? "nicht_weltgeschichtlich" : "weltgeschichtlich"} className="mt-1 w-full rounded-lg border border-line bg-card p-2">
                      <option value="weltgeschichtlich">Weltgeschichtlich bedeutsam (Quellen geprüft)</option>
                      <option value="nicht_weltgeschichtlich">Nicht weltgeschichtlich (nicht freigeben)</option>
                    </select>
                  </label>
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
                    <DeleteButton />
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
