import { Card } from "@/components/ui/card";
import { requireAdminPage } from "@/server/admin-session";
import { todayKey } from "@/server/clock";
import { getDb } from "@/server/db/client";
import { getMetrics } from "@/server/services/analytics";

export const metadata = { title: "Kennzahlen" };

const LABELS: Record<string, string> = {
  home_view: "Startseiten-Aufrufe",
  cta_click: "Klicks auf den Spielstart",
  landing: "Einstiege (Sitzungen)",
  game_start: "Gestartete Tagespartien",
  round_complete: "Abgeschlossene Runden",
  game_complete: "Abgeschlossene Tagespartien",
  archive_play: "Archiv-/Übungspartien",
  share: "Teilen-Aktionen",
};

export default async function MetricsAdmin() {
  await requireAdminPage();
  const m = await getMetrics(await getDb(), todayKey());
  const totals = new Map<string, number>();
  for (const c of m.counts) totals.set(c.name, (totals.get(c.name) ?? 0) + c.n);
  const rate = m.started ? Math.round((m.completed / m.started) * 100) : 0;
  const pct = (r: { eligible: number; returned: number }) => (r.eligible ? `${Math.round((r.returned / r.eligible) * 100)} % (${r.returned}/${r.eligible})` : "–");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Kennzahlen</h1>
        <p className="mt-1 text-ink-soft">Seit {m.from}. Datensparsam erhoben: keine Personen-IDs, keine IP-Adressen, keine Tracking-Cookies.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(LABELS).map(([k, l]) => (
          <Card key={k} className="p-4"><p className="text-sm text-ink-soft">{l}</p><p className="font-display text-3xl font-semibold tabular-nums">{totals.get(k) ?? 0}</p></Card>
        ))}
        <Card className="p-4"><p className="text-sm text-ink-soft">Partien mit mindestens einem Tipp</p><p className="font-display text-3xl font-semibold tabular-nums">{m.startedWithGuess}</p><p className="text-xs text-ink-soft">von {m.started} gestarteten offiziellen Partien</p></Card>
        <Card className="p-4"><p className="text-sm text-ink-soft">Abschlussquote (offiziell)</p><p className="font-display text-3xl font-semibold tabular-nums">{rate} %</p><p className="text-xs text-ink-soft">{m.completed} von {m.started}</p></Card>
      </div>
      <Card className="p-5">
        <h2 className="text-xl font-semibold">Startseite: Variante × Gerät</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-ink-soft"><tr><th scope="col" className="py-1">Variante</th><th scope="col">Gerät</th><th scope="col" className="text-right">Aufrufe</th><th scope="col" className="text-right">Spielstart-Klicks</th><th scope="col" className="text-right">Klickrate</th></tr></thead>
          <tbody>
            {m.homeByVariant.map((r) => (
              <tr key={r.variant + r.device} className="border-t border-line"><td className="py-1.5">{r.variant}</td><td>{r.device}</td><td className="text-right tabular-nums">{r.views}</td><td className="text-right tabular-nums">{r.clicks}</td><td className="text-right tabular-nums">{r.views ? Math.round((r.clicks / r.views) * 100) + " %" : "–"}</td></tr>
            ))}
            {m.homeByVariant.length === 0 && <tr><td colSpan={5} className="py-3 text-ink-soft">Noch keine Daten.</td></tr>}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-ink-soft">Erhoben ohne Cookies und Kennungen; die Klickrate ist nur bei ausreichend vielen Aufrufen aussagekräftig. Für einen A/B-Vergleich müssen mehrere Varianten in <code>src/lib/experiments.ts</code> angelegt werden.</p>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Wiederkehrende Spieler</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Nach 1 Tag</dt><dd className="tabular-nums">{pct(m.retention.d1)}</dd></div>
            <div className="flex justify-between"><dt>Nach 7 Tagen</dt><dd className="tabular-nums">{pct(m.retention.d7)}</dd></div>
            <div className="flex justify-between"><dt>Nach 30 Tagen</dt><dd className="tabular-nums">{pct(m.retention.d30)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-ink-soft">Anteil der Spieler mit offizieller Erstpartie, die ≥ N Tage später erneut offiziell gespielt haben (aus Spieldaten berechnet).</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Abbruchpunkte (unfertige Partien)</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {m.dropoff.map((d) => <li key={d.reached} className="flex justify-between"><span>Nach {d.reached} von 5 Runden</span><span className="tabular-nums">{d.n}</span></li>)}
            {m.dropoff.length === 0 && <li className="text-ink-soft">Keine offenen Partien.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Herkunft der Einstiege</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {m.channels.map((c) => <li key={c.channel} className="flex justify-between"><span>{c.channel}</span><span className="tabular-nums">{c.n}</span></li>)}
            {m.channels.length === 0 && <li className="text-ink-soft">Noch keine Daten.</li>}
          </ul>
          <h3 className="mt-4 text-sm font-semibold">Teilen nach Weg</h3>
          <ul className="mt-1 space-y-1 text-sm">{m.shares.map((s) => <li key={s.method} className="flex justify-between"><span>{s.method}</span><span className="tabular-nums">{s.n}</span></li>)}</ul>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-semibold">Ø Punkte je Ereignis (offiziell)</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {m.perEvent.map((e) => <li key={e.title} className="flex justify-between gap-4"><span>{e.title}</span><span className="tabular-nums">{e.avg} ({e.n})</span></li>)}
            {m.perEvent.length === 0 && <li className="text-ink-soft">Noch keine Daten.</li>}
          </ul>
          <p className="mt-2 text-xs text-ink-soft">Sehr niedrige/hohe Durchschnitte zeigen zu schwere oder zu leichte Aufgaben.</p>
        </Card>
      </div>
    </div>
  );
}
