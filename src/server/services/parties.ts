import { ROUNDS_PER_GAME } from "@/lib/constants";
import type { GameState } from "@/lib/game-types";
import { now as clockNow, todayKey } from "../clock";
import type { Db } from "../db/client";
import { pickLeastBad } from "../pipeline/select";
import { toSel } from "../pipeline/plan";
import { AppError, type EventRow, type PackInfo } from "../types";
import { buildState, createGame } from "./games";
import { demoAllowed } from "./packs";

/** Ohne verwechselbare Zeichen (0/O, 1/I/L): leicht abzutippen und vorzulesen. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
export const MAX_MEMBERS = 20;

/** Entfernt Leerzeichen, Bindestriche und Sonderzeichen am Rand und dazwischen, unabhängig von Groß-/Kleinschreibung. */
export function normalizeCode(raw: unknown): string {
  return String(raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidCodeFormat(code: string): boolean {
  return code.length === CODE_LENGTH && [...code].every((c) => ALPHABET.includes(c));
}

export function generateCode(rnd: () => number = Math.random): string {
  return Array.from({ length: CODE_LENGTH }, () => ALPHABET[Math.floor(rnd() * ALPHABET.length)]).join("");
}

export function cleanName(raw: unknown, fallbackSeed = Math.floor(Math.random() * 9000) + 1000): string {
  const n = String(raw ?? "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
  return n || `Gast ${fallbackSeed}`;
}

interface PartyRow {
  id: string;
  code: string;
  pack_id: string;
  rounds: { event_id: string; event_version: number }[];
  creator_player_id: string;
  created_at: string;
  expires_at: string;
}

async function loadParty(db: Db, rawCode: unknown, at: Date): Promise<PartyRow> {
  const code = normalizeCode(rawCode);
  if (!code) throw new AppError("CODE_LEER", "Bitte gib einen Party-Code ein.", 400);
  const p = isValidCodeFormat(code) ? await db.one<PartyRow>("select * from parties where code = $1", [code]) : null;
  if (!p) throw new AppError("PARTY_UNBEKANNT", "Diesen Party-Code gibt es nicht. Prüfe die Schreibweise oder bitte um einen neuen Einladungslink.", 404);
  if (new Date(p.expires_at).getTime() < at.getTime()) throw new AppError("PARTY_ABGELAUFEN", "Diese Party ist abgelaufen. Du kannst eine neue Party erstellen.", 410);
  return p;
}

/** Erstellt eine Party mit festem Aufgabensatz aus bereits veröffentlichten Ereignissen (nicht aus dem heutigen Tagesrätsel). */
export async function createParty(db: Db, playerId: string, name: unknown, at: Date = clockNow()): Promise<{ code: string }> {
  const today = todayKey(at);
  const rows = await db.query<EventRow & { pack_id: string; pack_date: string }>(
    `select distinct on (e.id) e.*, p.id as pack_id, p.pack_date
     from daily_pack_events pe join daily_packs p on p.id = pe.pack_id join events e on e.id = pe.event_id
     where p.pack_date < $1 and p.superseded_at is null and not e.blocked and e.image_id is not null ${demoAllowed() ? "" : "and not e.is_demo"}
     order by e.id, p.pack_date desc`,
    [today],
  );
  if (rows.length < ROUNDS_PER_GAME) {
    throw new AppError("ZU_WENIG_EREIGNISSE", "Für eine Party gibt es noch nicht genug bereits gespielte Ereignisse. Bitte versuche es in ein paar Tagen erneut.", 409);
  }
  const pick = pickLeastBad(rows.map(toSel), []);
  if (!pick.set) throw new AppError("ZU_WENIG_EREIGNISSE", "Aus dem Bestand lässt sich gerade keine passende Party zusammenstellen.", 409);
  const chosen = pick.set.map((s) => rows.find((r) => r.id === s.id)!);
  const anchor = chosen.map((e) => e.pack_id).sort()[0];
  const rounds = JSON.stringify(chosen.map((e, i) => ({ position: i + 1, event_id: e.id, event_version: e.version })));
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCode();
    try {
      const party = await db.one<{ id: string }>(
        "insert into parties(code, pack_id, rounds, creator_player_id) values ($1, $2, $3::jsonb, $4) returning id",
        [code, anchor, rounds, playerId],
      );
      await db.run("insert into party_members(party_id, player_id, display_name) values ($1, $2, $3) on conflict do nothing", [party!.id, playerId, cleanName(name)]);
      return { code };
    } catch (e) {
      if ((e as { code?: string }).code !== "23505") throw e;
    }
  }
  throw new AppError("SERVERFEHLER", "Der Party-Code konnte nicht erzeugt werden. Bitte versuche es erneut.", 500);
}

/** Tritt einer Party bei (idempotent). Gäste brauchen nur einen Anzeigenamen. */
export async function joinParty(db: Db, playerId: string, rawCode: unknown, name: unknown, at: Date = clockNow()): Promise<{ code: string }> {
  const p = await loadParty(db, rawCode, at);
  const already = await db.one("select 1 from party_members where party_id = $1 and player_id = $2", [p.id, playerId]);
  if (!already) {
    const n = (await db.one<{ n: number }>("select count(*)::int as n from party_members where party_id = $1", [p.id]))!.n;
    if (n >= MAX_MEMBERS) throw new AppError("PARTY_VOLL", `Diese Party hat bereits ${MAX_MEMBERS} Teilnehmende.`, 409);
    await db.run("insert into party_members(party_id, player_id, display_name) values ($1, $2, $3) on conflict do nothing", [p.id, playerId, cleanName(name)]);
  }
  return { code: p.code };
}

export interface PartyView {
  code: string;
  expiresAt: string;
  memberCount: number;
  isMember: boolean;
  me: { name: string; state: "nicht_gestartet" | "laufend" | "abgeschlossen"; answered: number; points: number | null; gameId: string | null } | null;
  members: { name: string; state: "nicht_gestartet" | "laufend" | "abgeschlossen"; isMe: boolean }[];
  /** Nur nach eigenem Abschluss gefüllt: Punktestände der fertigen Teilnehmenden (absteigend). */
  leaderboard: { name: string; points: number; isMe: boolean }[];
  /** Eigener Abschluss, aber noch niemand sonst fertig. */
  waiting: boolean;
}

export async function getPartyView(db: Db, playerId: string | null, rawCode: unknown, at: Date = clockNow()): Promise<PartyView> {
  const p = await loadParty(db, rawCode, at);
  const rows = await db.query<{ player_id: string; display_name: string; status: string | null; points: number | null; answered: number | null; game_id: string | null }>(
    `select m.player_id, m.display_name, g.status, g.total_points as points, g.id as game_id,
       (select count(*)::int from game_rounds r where r.game_id = g.id and r.status <> 'offen') as answered
     from party_members m left join games g on g.party_id = m.party_id and g.player_id = m.player_id
     where m.party_id = $1 order by m.joined_at`,
    [p.id],
  );
  const state = (s: string | null): "nicht_gestartet" | "laufend" | "abgeschlossen" => (s === "abgeschlossen" ? "abgeschlossen" : s === "laufend" ? "laufend" : "nicht_gestartet");
  const mine = rows.find((r) => r.player_id === playerId);
  const meDone = mine?.status === "abgeschlossen";
  const finished = rows.filter((r) => r.status === "abgeschlossen");
  return {
    code: p.code,
    expiresAt: new Date(p.expires_at).toISOString(),
    memberCount: rows.length,
    isMember: !!mine,
    me: mine ? { name: mine.display_name, state: state(mine.status), answered: mine.answered ?? 0, points: meDone ? mine.points : null, gameId: mine.game_id } : null,
    members: rows.map((r) => ({ name: r.display_name, state: state(r.status), isMe: r.player_id === playerId })),
    leaderboard: meDone
      ? finished.map((r) => ({ name: r.display_name, points: r.points ?? 0, isMe: r.player_id === playerId })).sort((a, b) => b.points - a.points)
      : [],
    waiting: !!meDone && finished.length < 2,
  };
}

/** Startet bzw. setzt die eigene Partie der Party fort (je Person genau eine Wertung, identischer Aufgabensatz). */
export async function startPartyGame(db: Db, playerId: string, rawCode: unknown, at: Date = clockNow()): Promise<GameState> {
  const p = await loadParty(db, rawCode, at);
  const member = await db.one("select 1 from party_members where party_id = $1 and player_id = $2", [p.id, playerId]);
  if (!member) await joinParty(db, playerId, p.code, null, at);
  const existing = await db.one<Parameters<typeof buildState>[1]>("select * from games where party_id = $1 and player_id = $2", [p.id, playerId]);
  if (existing) return buildState(db, existing, at);
  const pack = (await db.one<PackInfo>("select id, number, pack_date, status from daily_packs where id = $1", [p.pack_id]))!;
  const events = p.rounds.map((r) => ({ id: r.event_id, version: r.event_version }));
  try {
    return buildState(db, await createGame(db, playerId, pack, events, false, { id: p.id }), at);
  } catch (e) {
    if ((e as { code?: string }).code !== "23505") throw e;
    const again = await db.one<Parameters<typeof buildState>[1]>("select * from games where party_id = $1 and player_id = $2", [p.id, playerId]);
    if (!again) throw e;
    return buildState(db, again, at);
  }
}
