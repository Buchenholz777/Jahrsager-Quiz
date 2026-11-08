import { berlinDateKey } from "@/lib/time";

let override: Date | null = null;

/** Für Tests: feste Uhrzeit. */
export function setNowForTests(d: Date | null) {
  override = d;
}

/** Aktuelle Zeit. Außerhalb der Produktion kann ZEITSPUR_FAKE_NOW gesetzt werden. */
export function now(): Date {
  if (override) return override;
  const fake = process.env.ZEITSPUR_FAKE_NOW;
  if (fake && process.env.NODE_ENV !== "production") {
    const d = new Date(fake);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** Aktive Tageskennung, serverseitig aus Europe/Berlin abgeleitet. */
export function todayKey(at: Date = now()): string {
  return berlinDateKey(at);
}
