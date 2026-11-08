import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, Bookmark, CalendarClock, Flame, RotateCcw, Target } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { Container } from "@/components/page-header";
import { ResultChart } from "@/components/result/result-chart";
import { ShareBox } from "@/components/result/share-box";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { MAX_POINTS_PER_GAME } from "@/lib/constants";
import { buildShareText } from "@/lib/share";
import { absoluteUrl } from "@/lib/site";
import { formatPoints } from "@/lib/scoring";
import { formatDateDe } from "@/lib/time";
import { todayKey } from "@/server/clock";
import { getDb } from "@/server/db/client";
import { readPlayerId } from "@/server/http";
import { getGameState, isUuid } from "@/server/services/games";
import { getPlayerStats } from "@/server/services/stats";

export const metadata: Metadata = {
  title: "Dein Ergebnis",
  robots: { index: false, follow: false },
};

function summary(points: number, exact: number) {
  const base =
    points >= 4500
      ? "Hervorragend – du kennst dich in der Geschichte richtig gut aus."
      : points >= 3000
        ? "Starke Leistung – du hast ein gutes Gespür für Geschichte."
        : points >= 1500
          ? "Solider Start – mit jedem Rätsel wächst dein Gefühl für die Zeit."
          : "Geschichte ist Übungssache – die Auflösungen helfen dir beim nächsten Mal.";
  return exact > 0 ? `${base} ${exact === 1 ? "Ein Jahr" : `${exact} Jahre`} hast du genau getroffen.` : base;
}

export default async function ErgebnisPage({ searchParams }: { searchParams: Promise<{ spiel?: string }> }) {
  const { spiel } = await searchParams;
  const player = await readPlayerId();
  const db = await getDb();
  if (!player || !isUuid(spiel)) redirect("/spielen");
  const game = await getGameState(db, player, spiel);
  if (!game) redirect("/spielen");
  if (game.status !== "abgeschlossen") redirect(game.official ? "/spielen" : `/archiv/${game.packNumber}`);

  const stats = await getPlayerStats(db, player, todayKey());
  const exact = game.rounds.filter((r) => r.result?.difference === 0).length;
  const shareUrl = absoluteUrl(`/tagesraetsel/${game.packNumber}?utm_source=share`);
  const text = buildShareText({
    number: game.packNumber,
    points: game.totalPoints,
    url: shareUrl,
    practice: !game.official,
  });

  return (
    <Container className="!pt-6 sm:!pt-10">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={game.official ? "accent" : "neutral"}>
              {game.official ? "Tagesrätsel" : "Übung"} #{game.packNumber}
            </Badge>
            <span className="text-sm text-ink-soft">{formatDateDe(game.packDate)}</span>
          </div>
          <h1 className="sr-only">Dein Ergebnis</h1>

          {/* Punktekarte */}
          <div className="mt-4 animate-rise overflow-hidden rounded-card bg-ink text-paper shadow-card">
            <div className="p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-paper/80">Dein Ergebnis</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-3 font-display font-extrabold leading-none tabular-nums" data-testid="total-points">
                <span className="text-[4.5rem] text-sun sm:text-8xl">
                  <CountUp to={game.totalPoints} ms={1000} />
                </span>
                <span className="text-3xl text-paper/85 sm:text-4xl">/ {formatPoints(MAX_POINTS_PER_GAME)}</span>
              </p>
              <p className="mt-1 text-lg font-medium text-paper/90">Punkte</p>
              <p className="mt-4 max-w-xl text-lg text-paper">{summary(game.totalPoints, exact)}</p>
              {!game.official && <p className="mt-2 text-sm text-paper/80">Das war eine Übungsrunde und verändert deine Tageswertung nicht.</p>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-ink-2 px-6 py-3 text-sm text-paper/90">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4 text-sun" aria-hidden="true" /> Morgen warten fünf neue Ereignisse auf dich.
              </span>
              {stats.currentStreak > 0 && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-sun">
                  <Flame className="size-4" aria-hidden="true" /> Serie: {stats.currentStreak} {stats.currentStreak === 1 ? "Tag" : "Tage"}
                </span>
              )}
            </div>
          </div>

          <h2 className="mb-4 mt-10 text-2xl font-bold">Deine fünf Ereignisse in zeitlicher Reihenfolge</h2>
          <ResultChart rounds={game.rounds} />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={game.official ? "/spielen" : `/archiv/${game.packNumber}`} className={buttonVariants({ variant: "secondary" })}>
              Erklärungen nachlesen
            </Link>
            <Link href={game.official ? "/spielen?uebung=1" : `/archiv/${game.packNumber}`} className={buttonVariants({ variant: "quiet" })}>
              <RotateCcw className="size-4" aria-hidden="true" /> Als Übung wiederholen
            </Link>
          </div>
        </div>

        <aside className="space-y-6">
          <ShareBox text={text} url={shareUrl} />

          <Card className="p-5 sm:p-6">
            <h2 className="text-2xl font-bold">Deine Statistik</h2>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-3">
              <Stat label="Serie" value={`${stats.currentStreak}`} unit={stats.currentStreak === 1 ? "Tag" : "Tage"} icon={<Flame className="size-4" />} />
              <Stat label="Ø Punkte" value={stats.averagePoints === null ? "–" : formatPoints(stats.averagePoints)} />
              <Stat label="Treffer" value={`${stats.exactHits}`} unit="exakt" icon={<Target className="size-4" />} />
            </dl>
            <Link href="/statistik" className="mt-4 inline-block font-semibold text-ink underline decoration-sun decoration-[3px] underline-offset-4">
              Alle Statistiken ansehen
            </Link>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-xl font-bold">Morgen wiederkommen</h2>
            <p className="mt-2 text-ink-soft">Jeden Tag um 00:00 Uhr (Berliner Zeit) warten fünf neue Ereignisse auf dich.</p>
            <p className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
              <Bookmark className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Tipp: Speichere JAHRSAGER als Lesezeichen oder lege es auf deinen Startbildschirm.
            </p>
            <Link href="/archiv" className={buttonVariants({ variant: "quiet", size: "sm", className: "mt-4" })}>
              <Archive className="size-4" aria-hidden="true" /> Frühere Rätsel spielen
            </Link>
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function Stat({ label, value, unit, icon }: { label: string; value: string; unit?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-paper-2 p-3">
      <dt className="flex items-center justify-center gap-1 text-xs font-medium text-ink-soft">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</dd>
      {unit && <dd className="text-xs text-ink-soft">{unit}</dd>}
    </div>
  );
}
