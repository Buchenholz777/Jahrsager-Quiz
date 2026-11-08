import { computeStreaks } from "@/lib/streak";
import type { Queryable } from "../db/client";

export interface PlayerStats {
  completed: number;
  exactHits: number;
  roundsPlayed: number;
  averagePoints: number | null;
  bestPoints: number | null;
  currentStreak: number;
  longestStreak: number;
  practiceGames: number;
  history: { gameId: string; number: number; date: string; points: number; deviations: (number | null)[] }[];
}

/** Persönliche Statistik. Zählt ausschließlich offizielle Tageswertungen; Übungen verändern sie nicht. */
export async function getPlayerStats(db: Queryable, playerId: string, today: string): Promise<PlayerStats> {
  const games = await db.query<{ id: string; number: number; pack_date: string; total_points: number }>(
    `select g.id, p.number, p.pack_date, g.total_points from games g join daily_packs p on p.id = g.pack_id
     where g.player_id = $1 and g.official and g.status = 'abgeschlossen' order by p.pack_date desc`,
    [playerId],
  );
  const hits = await db.one<{ exact: number; played: number }>(
    `select count(*) filter (where r.difference = 0)::int as exact, count(*)::int as played
     from game_rounds r join games g on g.id = r.game_id
     where g.player_id = $1 and g.official and g.status = 'abgeschlossen'`,
    [playerId],
  );
  const practice = await db.one<{ n: number }>("select count(*)::int as n from games where player_id = $1 and not official and status = 'abgeschlossen'", [playerId]);
  const streaks = computeStreaks(games.map((g) => g.pack_date), today);
  const recent = games.slice(0, 30);
  const history: PlayerStats["history"] = [];
  for (const g of recent) {
    const rounds = await db.query<{ difference: number | null }>("select difference from game_rounds where game_id = $1 order by position", [g.id]);
    history.push({ gameId: g.id, number: g.number, date: g.pack_date, points: g.total_points, deviations: rounds.map((r) => r.difference) });
  }
  const total = games.reduce((s, g) => s + g.total_points, 0);
  return {
    completed: games.length,
    exactHits: hits?.exact ?? 0,
    roundsPlayed: hits?.played ?? 0,
    averagePoints: games.length ? Math.round(total / games.length) : null,
    bestPoints: games.length ? Math.max(...games.map((g) => g.total_points)) : null,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    practiceGames: practice?.n ?? 0,
    history,
  };
}
