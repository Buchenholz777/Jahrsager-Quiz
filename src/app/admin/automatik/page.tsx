import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateDe } from "@/lib/time";
import { requireAdminPage } from "@/server/admin-session";
import { getDb } from "@/server/db/client";
import { diversityStats, pipelineStats } from "@/server/pipeline/admin";
import { blockEventAction, unblockEventAction } from "../actions";

export const metadata = { title: "Automatik" };
export const dynamic = "force-dynamic";

type Row = { id: string; slug: string; neutral_title: string; correct_year: number; pipeline_state: string | null; blocked_reason: string; created_at: string };

function BlockForm({ id }: { id: string }) {
  return (
    <form action={blockEventAction} className="flex gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="reason" required minLength={3} placeholder="Sperrgrund" className="h-9 w-40 rounded-lg border border-line bg-card px-2 text-sm" />
      <button className={buttonVariants({ size: "sm", variant: "secondary" })}>Sperren</button>
    </form>
  );
}

export default async function AutomatikAdmin() {
  await requireAdminPage();
  const db = await getDb();
  const s = await pipelineStats(db);
  const dv = await diversityStats(db);
  const pct = (x: number) => `${(x * 100).toFixed(0)} %`;
  const q = (where: string) =>
    db.query<Row>(`select id, slug, neutral_title, correct_year, pipeline_state, blocked_reason, created_at::text as created_at from events where ${where} order by created_at desc limit 30`);
  const manual = await q("pipeline_state = 'manual_review' and not blocked");
  const auto = await q("pipeline_state = 'auto_approved' and not blocked");
  const blocked = await q("blocked");
  const seen = await db.query<{ source_id: string; decision: string; reason: string; seen_at: string }>(
    "select source_id, decision, reason, seen_at::text as seen_at from pipeline_seen where decision in ('rejected', 'manual_review') and reason <> '' order by seen_at desc limit 40",
  );
  const tile = (label: string, value: number | string, warn = false) => (
    <Card className={`p-4 ${warn ? "border-2 border-sun" : ""}`}>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="font-display text-4xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Automatik</h1>
      <p role={s.lowStock ? "alert" : "status"} className={`rounded-card border-2 bg-card p-4 font-medium ${s.lowStock ? "border-sun" : "border-line"}`}>
        Vorrat: {s.levelMessage} {s.lowStock && "Neue Recherche läuft täglich (nur mit KI-Schlüssel); sonst Ereignisse im Freigabe-Assistenten freigeben."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tile("Freigegebener Vorrat (ungenutzt)", s.stock, s.lowStock)}
        {tile("Vorrat in Tagen", s.stockDays, s.lowStock)}
        {tile("Neu recherchiert (7 Tage)", s.candidatesWeek)}
        {tile("Automatisch freigegeben", s.autoApproved)}
        {tile("Manuelle Prüfung nötig", s.manualReview, s.manualReview > 0)}
        {tile("Abgelehnt (Kandidaten)", s.rejected)}
        {tile("Gesperrt", s.blocked)}
        {tile("Fehlgeschlagene Läufe (letzte 10)", s.lastErrors, s.lastErrors > 0)}
      </div>
      <p className="text-sm text-ink-soft">Ziel: {s.target} Ereignisse im Vorrat.</p>

      <Card className="p-5">
        <h2 className="text-xl font-semibold">Zuletzt abgelehnt oder zurückgestellt (mit Grund)</h2>
        <p className="mt-1 text-sm text-ink-soft">Kandidaten, die die Relevanz-, Jahres-, Bild-, Quellen- oder Rechteprüfung nicht bestanden haben. „Abgelehnt“ wird nicht angelegt, „Zurückgestellt“ liegt im Freigabe-Assistenten.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {seen.map((r) => (
            <li key={r.source_id} className="rounded-card border border-line p-3">
              <p><strong>{r.decision === "rejected" ? "Abgelehnt" : r.decision === "manual_review" ? "Zurückgestellt" : r.decision}</strong> · <a className="underline" href={`https://www.wikidata.org/wiki/${r.source_id}`} target="_blank" rel="noopener noreferrer">{r.source_id}</a> · {formatDateDe(r.seen_at.slice(0, 10))}</p>
              <p className="mt-1 text-ink-soft">{r.reason.split(" | ").join(" · ")}</p>
            </li>
          ))}
          {seen.length === 0 && <li className="text-ink-soft">Noch keine Einträge.</li>}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-semibold">Themenvielfalt</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Raumfahrt: {pct(dv.all.spaceShare)} des Bestands (Ziel höchstens ca. 5 %), {pct(dv.last30.spaceShare)} der letzten 30 Tage · Wissenschaft + Technik: {pct(dv.all.sciTechShare)}.
          {dv.unclassified > 0 && ` ${dv.unclassified} Ereignis(se) ohne Region.`}
        </p>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="font-semibold">Themenfelder (Bestand / 30 Tage)</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {dv.all.byCategory.map((c, i) => (
                <li key={c.key} className="flex justify-between gap-2"><span>{c.label}</span><span className="tabular-nums text-ink-soft">{c.n} ({pct(c.share)}) / {dv.last30.byCategory[i].n}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Regionen (Bestand / 30 Tage)</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {dv.all.byRegion.map((c) => (
                <li key={c.key} className="flex justify-between gap-2"><span>{c.label}</span><span className="tabular-nums text-ink-soft">{c.n} ({pct(c.share)}) / {dv.last30.byRegion.find((x) => x.key === c.key)?.n ?? 0}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Jahrzehnte (Bestand / 30 Tage)</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {dv.all.byDecade.map((c) => (
                <li key={c.decade} className="flex justify-between gap-2"><span>{c.decade}er</span><span className="tabular-nums text-ink-soft">{c.n} ({pct(c.share)}) / {dv.last30.byDecade.find((x) => x.decade === c.decade)?.n ?? 0}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <h3 className="mt-5 font-semibold">Thematisch ähnliche Ereignisse</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {dv.similar.map((g) => (
            <li key={g.topic}><strong>{g.topic}</strong> <span className="text-ink-soft">· {g.titles.join(" · ")}</span></li>
          ))}
          {dv.similar.length === 0 && <li className="text-ink-soft">Keine.</li>}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-semibold">Nächste Tagesrätsel</h2>
        {s.nextPacks.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Keine Pakete geplant.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {s.nextPacks.map((p) => (
              <li key={p.pack_date} className="border-b border-line pb-2 last:border-0">
                <strong>{formatDateDe(p.pack_date)}</strong> <span className="text-ink-soft">· {p.titles.join(" · ")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-semibold">Manuelle Prüfung ({manual.length})</h2>
        <p className="mt-1 text-sm text-ink-soft">Ausnahmefälle (z. B. Personen im Bild, unklare Datierung, Lizenz nicht in der Allowlist). Die Gründe stehen im Prüfprotokoll des Ereignisses.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {manual.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
              <Link className="underline" href={`/admin/ereignisse/${e.id}`}>{e.neutral_title}</Link>
              <BlockForm id={e.id} />
            </li>
          ))}
          {manual.length === 0 && <li className="text-ink-soft">Keine offenen Fälle.</li>}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-semibold">Zuletzt automatisch freigegeben ({auto.length})</h2>
        <p className="mt-1 text-sm text-ink-soft">Bei Fehlern sofort sperren: Das Ereignis verlässt Vorrat, Startseite und Wissensseite, künftige Pakete werden zurückgenommen, das Bild wird nicht mehr ausgeliefert.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {auto.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
              <Link className="underline" href={`/admin/ereignisse/${e.id}`}>{e.neutral_title}</Link>
              <BlockForm id={e.id} />
            </li>
          ))}
          {auto.length === 0 && <li className="text-ink-soft">Noch keine.</li>}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-semibold">Gesperrt ({blocked.length})</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {blocked.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
              <span>{e.neutral_title} <span className="text-ink-soft">· {e.blocked_reason}</span></span>
              <form action={unblockEventAction}>
                <input type="hidden" name="id" value={e.id} />
                <button className={buttonVariants({ size: "sm", variant: "quiet" })}>Sperre aufheben</button>
              </form>
            </li>
          ))}
          {blocked.length === 0 && <li className="text-ink-soft">Keine gesperrten Ereignisse.</li>}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-semibold">Letzte Läufe</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {s.runs.map((r) => (
            <li key={r.id} className="border-b border-line pb-2 last:border-0">
              <strong>{r.kind}</strong> · {r.started_at.slice(0, 16).replace("T", " ")} · {r.ok === null ? "läuft/abgebrochen" : r.ok ? "ok" : `FEHLER: ${r.error}`}
              <div className="text-ink-soft">{JSON.stringify(r.summary).slice(0, 200)}</div>
            </li>
          ))}
          {s.runs.length === 0 && <li className="text-ink-soft">Noch kein Lauf. Der Zeitplan läuft über GitHub Actions.</li>}
        </ul>
      </Card>
    </div>
  );
}
