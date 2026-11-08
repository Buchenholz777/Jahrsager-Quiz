import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { Container, PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MAX_POINTS_PER_GAME } from "@/lib/constants";
import { formatPoints } from "@/lib/scoring";
import { formatDateShortDe } from "@/lib/time";
import { todayKey } from "@/server/clock";
import { getDb } from "@/server/db/client";
import { readPlayerId } from "@/server/http";
import { getPlayerStats } from "@/server/services/stats";

export const metadata: Metadata = {
  title: "Meine Statistik",
  description: "Deine persönliche JAHRSAGER-Statistik: gespielte Tage, Durchschnittspunkte, exakte Treffer und Teilnahmeserie.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function StatistikPage() {
  const player = await readPlayerId();
  const stats = player ? await getPlayerStats(await getDb(), player, todayKey()) : null;
  const empty = !stats || stats.completed === 0;

  return (
    <Container>
      <PageHeader eyebrow="Persönlich" title="Meine Statistik" lead="Zählt nur deine offiziellen Tageswertungen – Übungsrunden verändern sie nicht." />

      {empty ? (
        <Card className="max-w-xl p-8">
          <h2 className="text-2xl font-semibold">Noch keine abgeschlossene Tagespartie</h2>
          <p className="mt-2 text-ink-soft">Spiele das heutige Tagesrätsel zu Ende, dann erscheinen hier deine Zahlen.</p>
          <Link href="/spielen" className={buttonVariants({ className: "mt-5" })}>
            Jetzt Tagesrätsel spielen
          </Link>
        </Card>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6" data-testid="stats">
            <Tile label="Abgeschlossene Tagespartien" value={`${stats.completed}`} />
            <Tile label="Exakt getroffene Jahre" value={`${stats.exactHits}`} sub={`von ${stats.roundsPlayed} Ereignissen`} />
            <Tile label="Ø Punkte pro Partie" value={stats.averagePoints === null ? "–" : formatPoints(stats.averagePoints)} sub={`von ${formatPoints(MAX_POINTS_PER_GAME)}`} />
            <Tile label="Aktuelle Serie" value={`${stats.currentStreak}`} sub={stats.currentStreak === 1 ? "Tag in Folge" : "Tage in Folge"} />
            <Tile label="Längste Serie" value={`${stats.longestStreak}`} sub={stats.longestStreak === 1 ? "Tag" : "Tage"} />
            <Tile label="Bestes Ergebnis" value={stats.bestPoints === null ? "–" : formatPoints(stats.bestPoints)} />
          </dl>
          <p className="mt-3 text-sm text-ink-soft">
            Deine Serie zählt Tage, an denen du das Tagesrätsel abgeschlossen hast – eine perfekte Punktzahl ist nicht nötig. Mit {stats.practiceGames}{" "}
            abgeschlossenen Übungsrunden.
          </p>

          <h2 className="mb-4 mt-12 text-2xl font-semibold">Bisherige Ergebnisse</h2>
          <ul className="space-y-3 md:hidden">
            {stats.history.map((h) => (
              <li key={h.gameId} className="rounded-2xl border border-line bg-card p-4 shadow-card">
                <div className="flex items-baseline justify-between gap-3">
                  <Link className="font-display text-xl font-bold underline decoration-sun decoration-[3px] underline-offset-4" href={`/ergebnis?spiel=${h.gameId}`}>
                    Tagesrätsel #{h.number}
                  </Link>
                  <span className="font-display text-2xl font-extrabold tabular-nums">{formatPoints(h.points)}</span>
                </div>
                <p className="text-sm text-ink-soft">{formatDateShortDe(h.date)}</p>
                <p className="mt-1 text-sm tabular-nums">Abweichungen: {h.deviations.map((d) => (d === null ? "–" : d)).join(" · ")} Jahre</p>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block rounded-card border border-line bg-card shadow-card">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">Deine letzten Tagesergebnisse</caption>
              <thead className="bg-paper-2/70 text-ink-soft">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Rätsel</th>
                  <th scope="col" className="px-4 py-3 font-medium">Datum</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Punkte</th>
                  <th scope="col" className="px-4 py-3 font-medium">Abweichungen (Jahre)</th>
                </tr>
              </thead>
              <tbody>
                {stats.history.map((h) => (
                  <tr key={h.gameId} className="border-t border-line">
                    <td className="px-4 py-3 font-medium">
                      <Link className="text-ink underline underline-offset-2" href={`/ergebnis?spiel=${h.gameId}`}>
                        #{h.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatDateShortDe(h.date)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPoints(h.points)}</td>
                    <td className="px-4 py-3 tabular-nums">{h.deviations.map((d) => (d === null ? "–" : d)).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <aside className="mt-12 flex max-w-2xl items-start gap-3 rounded-2xl bg-paper-2/70 p-4 text-sm text-ink-soft">
        <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          Ohne Anmeldung werden deine Daten mit einer zufälligen Kennung in einem Cookie in <em>diesem</em> Browser verknüpft. Wechselst du das Gerät oder löschst du
          Browserdaten, kann dein Spielstand und deine Statistik verloren gehen.
        </p>
      </aside>
    </Container>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className="mt-2 font-display text-4xl font-semibold tabular-nums">{value}</dd>
      {sub && <dd className="mt-0.5 text-xs text-ink-soft">{sub}</dd>}
    </Card>
  );
}
