import { GAME_TIMEZONE } from "./constants";

type Parts = { y: number; m: number; d: number; h: number; min: number; s: number };

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: GAME_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function parts(at: Date): Parts {
  const o: Record<string, number> = {};
  for (const p of fmt.formatToParts(at)) if (p.type !== "literal") o[p.type] = Number(p.value);
  return { y: o.year, m: o.month, d: o.day, h: o.hour % 24, min: o.minute, s: o.second };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Kalendertag (YYYY-MM-DD) in Europe/Berlin. Berücksichtigt Sommer-/Winterzeit. */
export function berlinDateKey(at: Date): string {
  const p = parts(at);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

function offsetMs(at: Date): number {
  const p = parts(at);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

export function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

/** Der Zeitpunkt (UTC-Instant), an dem in Berlin der nächste Kalendertag beginnt. */
export function nextBerlinMidnight(at: Date): Date {
  const next = addDays(berlinDateKey(at), 1);
  const [y, m, d] = next.split("-").map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, 0, 0);
  let guess = naive - offsetMs(new Date(naive));
  guess = naive - offsetMs(new Date(guess));
  return new Date(guess);
}

export function isDateKey(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function formatDateDe(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

export function formatDateShortDe(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
