import { ROUNDS_PER_GAME } from "@/lib/constants";
import type { GameState, RoundState, TodayStatus } from "@/lib/game-types";
import { isValidYear, SCORING_VERSION, scoreGuess, yearDifference } from "@/lib/scoring";
import { nextBerlinMidnight } from "@/lib/time";
import { now as clockNow, todayKey } from "../clock";
import type { Db, Queryable } from "../db/client";
import { AppError, type EventRow, type PackInfo } from "../types";
import { getEventVersion } from "./events";
import { getPackByNumber, getTodayPack, getPublicPack, demoAllowed } from "./packs";

interface GameRow {
  id: string;
  player_id: string;
  pack_id: string;
  mode: "daily" | "practice" | "party";
  official: boolean;
  status: "laufend" | "abgeschlossen";
  scoring_version: number;
  total_points: number;
  party_id: string | null;
}
interface RoundRow {
  game_id: string;
  position: number;
  event_id: string;
  event_version: number;
  status: "offen" | "getippt" | "ohne_tipp";
  guess_year: number | null;
  correct_year: number | null;
  difference: number | null;
  points: number | null;
}

export async function ensurePlayer(db: Queryable, playerId: string | null): Promise<string> {
  if (playerId) {
    const n = await db.run("update players set last_seen_at = now() where id = $1", [playerId]);
    if (n > 0) return playerId;
  }
  const row = await db.one<{ id: string }>("insert into players default values returning id");
  return row!.id;
}

export const isUuid = (v: string | null | undefined): v is string =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

function toQuestion(e: EventRow) {
  return {
    title: e.neutral_title,
    description: e.description,
    alt: e.image_alt,
    creditShort: e.image_credit_short,
    license: e.image_license,
    licenseUrl: e.image_license_url,
    image: {
      id: e.image_id ?? "",
      ext: e.image_ext ?? "svg",
      width: e.image_width ?? 1200,
      height: e.image_height ?? 800,
      placeholder: e.image_is_placeholder,
    },
  };
}

function toReveal(e: EventRow) {
  return {
    publicTitle: e.public_title,
    what: e.explanation_what,
    why: e.explanation_why,
    detail: e.explanation_detail,
    sources: e.sources,
    creditFull: e.image_credit_full,
    license: e.image_license,
    licenseUrl: e.image_license_url,
    sourceUrl: e.image_source_url,
    isDemo: e.is_demo,
    significance: e.research?.bedeutung?.reason?.trim() || undefined,
  };
}

/** Baut den Client-Zustand. Lösungen werden NUR für bereits aufgelöste Runden mitgeliefert. */
export async function buildState(db: Queryable, game: GameRow, at: Date = clockNow()): Promise<GameState> {
  const pack = (await db.one<PackInfo>("select id, number, pack_date, status from daily_packs where id = $1", [game.pack_id]))!;
  const rounds = await db.query<RoundRow>("select * from game_rounds where game_id = $1 order by position", [game.id]);
  const firstOpen = rounds.find((r) => r.status === "offen")?.position ?? null;
  const visible: RoundState[] = [];
  for (const r of rounds) {
    if (firstOpen !== null && r.position > firstOpen) break;
    const ev = await getEventVersion(db, r.event_id, r.event_version);
    const state: RoundState = { position: r.position, status: r.status, eventId: r.event_id, question: toQuestion(ev) };
    if (r.status !== "offen") {
      state.result = {
        guess: r.guess_year,
        correct: r.correct_year!,
        difference: r.difference,
        points: r.points ?? 0,
        reveal: toReveal(ev),
      };
    }
    visible.push(state);
  }
  const partyCode = game.party_id ? ((await db.one<{ code: string }>("select code from parties where id = $1", [game.party_id]))?.code ?? null) : null;
  return {
    gameId: game.id,
    partyCode,
    mode: game.mode,
    official: game.official,
    status: game.status,
    packNumber: pack.number,
    packDate: pack.pack_date,
    scoringVersion: game.scoring_version,
    totalPoints: game.total_points,
    currentPosition: firstOpen,
    answered: rounds.filter((r) => r.status !== "offen").length,
    rounds: visible,
    nextResetAt: nextBerlinMidnight(at).toISOString(),
  };
}

export async function createGame(
  db: Db,
  playerId: string,
  pack: PackInfo,
  events: { id: string; version: number }[],
  official: boolean,
  party: { id: string } | null = null,
): Promise<GameRow> {
  // Eine einzige Anweisung: Partie und Runden werden atomar angelegt.
  const rounds = JSON.stringify(events.map((e, i) => ({ position: i + 1, event_id: e.id, event_version: e.version })));
  return (await db.one<GameRow>(
    `with g as (
       insert into games(player_id, pack_id, mode, official, scoring_version, party_id) values ($1, $2, $3, $4, $5, $7) returning *
     ), r as (
       insert into game_rounds(game_id, position, event_id, event_version)
       select g.id, v.position, v.event_id, v.event_version from g, jsonb_to_recordset($6::jsonb) as v(position int, event_id uuid, event_version int)
       returning 1
     ) select * from g`,
    [playerId, pack.id, party ? "party" : official ? "daily" : "practice", official, SCORING_VERSION, rounds, party?.id ?? null],
  ))!;
}

/** Offizielle Partie des Spielers für das Datum des Pakets (beliebige Fassung). */
async function officialOfDate(db: Db, playerId: string, pack: PackInfo): Promise<GameRow | null> {
  return db.one<GameRow>(
    "select g.* from games g join daily_packs p on p.id = g.pack_id where g.player_id = $1 and g.official and p.pack_date = $2 order by g.started_at limit 1",
    [playerId, pack.pack_date],
  );
}

const PRACTICE_Q = "select * from games where player_id = $1 and pack_id = $2 and not official and party_id is null and status = 'laufend'";

/**
 * Startet bzw. setzt eine Partie fort.
 * - Heutiges Paket, erste Partie: offizielle Wertung.
 * - Frühere Pakete und wiederholtes Spielen: Übung (verändert die Tageswertung nie).
 * - Eine unvollendete offizielle Partie wird immer zuerst fortgesetzt (auch nach Mitternacht).
 */
export async function startGame(
  db: Db,
  playerId: string,
  opts: { packNumber?: number; practice?: boolean },
  at: Date = clockNow(),
): Promise<GameState> {
  const today = todayKey(at);
  let pack: PackInfo;
  let events: EventRow[];
  if (opts.packNumber !== undefined) {
    let p = await getPublicPack(db, opts.packNumber, at);
    if (!p) throw new AppError("NICHT_VERFUEGBAR", "Dieses Tagesrätsel ist (noch) nicht verfügbar.", 404);
    // Eine ersetzte Fassung des heutigen Tages steht nur noch bereits begonnenen Partien offen: neue Partien nutzen die aktuelle Fassung.
    if (p.pack.pack_date === today && (await db.one("select 1 from daily_packs where id = $1 and superseded_at is not null", [p.pack.id]))) p = (await getTodayPack(db, at)) ?? p;
    ({ pack, events } = p);
  } else {
    const t = await getTodayPack(db, at);
    if (!t) throw new AppError("KEIN_PAKET", "Für heute ist noch kein Tagesrätsel hinterlegt.", 404);
    ({ pack, events } = t);
  }

  // Je Datum gibt es höchstens eine offizielle Wertung – auch wenn das Paket des Tages versioniert (ersetzt) wurde.
  const official = await officialOfDate(db, playerId, pack);
  if (official?.status === "laufend") return buildState(db, official, at);

  // Heutiges Paket: Übung erst nach abgeschlossener offizieller Wertung (sonst könnte man die Lösungen vorab sehen).
  const wantPractice = pack.pack_date < today || (!!opts.practice && official?.status === "abgeschlossen");
  if (!wantPractice) {
    if (official) return buildState(db, official, at);
    try {
      return buildState(db, await createGame(db, playerId, pack, events, true), at);
    } catch (e) {
      if ((e as { code?: string }).code !== "23505") throw e;
      const again = await officialOfDate(db, playerId, pack);
      if (!again) throw e;
      return buildState(db, again, at);
    }
  }

  const running = await db.one<GameRow>(PRACTICE_Q, [playerId, pack.id]);
  if (running) return buildState(db, running, at);
  try {
    return buildState(db, await createGame(db, playerId, pack, events, false), at);
  } catch (e) {
    if ((e as { code?: string }).code !== "23505") throw e;
    const again = await db.one<GameRow>(PRACTICE_Q, [playerId, pack.id]);
    if (!again) throw e;
    return buildState(db, again, at);
  }
}

export async function getGameState(db: Db, playerId: string, gameId: string, at: Date = clockNow()): Promise<GameState | null> {
  if (!isUuid(gameId)) return null;
  const game = await db.one<GameRow>("select * from games where id = $1 and player_id = $2", [gameId, playerId]);
  return game ? buildState(db, game, at) : null;
}

/**
 * Wertet eine Runde genau einmal (idempotent). guess = null löst ohne Tipp auf (0 Punkte).
 * Ungültige Eingaben werfen VOR jeder Änderung und verbrauchen keinen Tipp.
 */
export async function answerRound(
  db: Db,
  playerId: string,
  gameId: string,
  position: number,
  guess: number | null,
  at: Date = clockNow(),
): Promise<{ state: GameState; alreadyAnswered: boolean }> {
  if (!isUuid(gameId)) throw new AppError("NICHT_GEFUNDEN", "Partie nicht gefunden", 404);
  if (!Number.isInteger(position) || position < 1 || position > ROUNDS_PER_GAME) {
    throw new AppError("UNGUELTIGE_RUNDE", "Ungültige Runde.");
  }
  if (guess !== null && !isValidYear(guess)) throw new AppError("UNGUELTIGES_JAHR", "Bitte wähle ein Jahr zwischen 1900 und 2020.");

  const outcome = await db.transaction(async (tx) => {
    // Die Sperre auf die Partie serialisiert doppelte Klicks und parallele Anfragen.
    const game = await tx.one<GameRow>("select * from games where id = $1 and player_id = $2 for update", [gameId, playerId]);
    if (!game) throw new AppError("NICHT_GEFUNDEN", "Partie nicht gefunden", 404);
    const round = await tx.one<RoundRow>("select * from game_rounds where game_id = $1 and position = $2", [gameId, position]);
    if (!round) throw new AppError("UNGUELTIGE_RUNDE", "Ungültige Runde.");
    if (round.status !== "offen") return { game, already: true };

    const firstOpen = (await tx.one<{ p: number }>("select min(position)::int as p from game_rounds where game_id = $1 and status = 'offen'", [gameId]))!.p;
    if (firstOpen !== position) throw new AppError("REIHENFOLGE", "Diese Runde ist noch nicht an der Reihe.", 409);

    const ev = await getEventVersion(tx, round.event_id, round.event_version);
    const points = guess === null ? 0 : scoreGuess(guess, ev.correct_year, game.scoring_version);
    const diff = guess === null ? null : yearDifference(guess, ev.correct_year);
    await tx.run(
      `update game_rounds set status = $3, guess_year = $4, correct_year = $5, difference = $6, points = $7, answered_at = now()
       where game_id = $1 and position = $2`,
      [gameId, position, guess === null ? "ohne_tipp" : "getippt", guess, ev.correct_year, diff, points],
    );
    const open = (await tx.one<{ n: number }>("select count(*)::int as n from game_rounds where game_id = $1 and status = 'offen'", [gameId]))!.n;
    if (open === 0) {
      const total = (await tx.one<{ s: number }>("select coalesce(sum(points),0)::int as s from game_rounds where game_id = $1", [gameId]))!.s;
      await tx.run("update games set status = 'abgeschlossen', total_points = $2, completed_at = now() where id = $1", [gameId, total]);
    }
    return { game, already: false };
  });

  const fresh = (await db.one<GameRow>("select * from games where id = $1", [gameId]))!;
  return { state: await buildState(db, fresh, at), alreadyAnswered: outcome.already };
}

/** Status für Startseite und Navigation (ohne Lösungen). */
export async function getTodayStatus(db: Db, playerId: string | null, at: Date = clockNow()): Promise<TodayStatus> {
  const today = await getTodayPack(db, at);
  const nextResetAt = nextBerlinMidnight(at).toISOString();
  const base: TodayStatus = {
    hasPack: !!today,
    packNumber: today?.pack.number ?? null,
    state: "neu",
    answered: 0,
    points: null,
    gameId: null,
    openOlder: null,
    nextResetAt,
  };
  if (!playerId) return base;
  if (today) {
    const g = await db.one<GameRow & { answered: number }>(
      `select g.*, (select count(*)::int from game_rounds r where r.game_id = g.id and r.status <> 'offen') as answered
       from games g join daily_packs p on p.id = g.pack_id where g.player_id = $1 and p.pack_date = $2 and g.official order by g.started_at limit 1`,
      [playerId, today.pack.pack_date],
    );
    if (g) {
      base.state = g.status === "abgeschlossen" ? "abgeschlossen" : "laufend";
      base.answered = g.answered;
      base.points = g.status === "abgeschlossen" ? g.total_points : null;
      base.gameId = g.id;
    }
  }
  const older = await db.one<{ number: number; answered: number }>(
    `select p.number, (select count(*)::int from game_rounds r where r.game_id = g.id and r.status <> 'offen') as answered
     from games g join daily_packs p on p.id = g.pack_id
     where g.player_id = $1 and g.official and g.status = 'laufend' and p.pack_date < $2 order by p.pack_date desc limit 1`,
    [playerId, todayKey(at)],
  );
  base.openOlder = older;
  return base;
}

export async function playerOfficialResult(db: Db, playerId: string, packNumber: number) {
  const pack = await getPackByNumber(db, packNumber);
  if (!pack) return null;
  return db.one<{ id: string; total_points: number; status: string }>(
    "select id, total_points, status from games where player_id = $1 and pack_id = $2 and official",
    [playerId, pack.id],
  );
}

export { demoAllowed };
