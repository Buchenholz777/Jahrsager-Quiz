import { addDays } from "./time";

/**
 * Teilnahmeserie: aufeinanderfolgende Kalendertage (Tagesrätsel-Datum), an denen die
 * offizielle Tagespartie abgeschlossen wurde. Eine perfekte Punktzahl wird nicht verlangt.
 * Die aktuelle Serie bleibt erhalten, solange der heutige Tag noch offen ist.
 */
export function computeStreaks(dateKeys: string[], today: string): { current: number; longest: number } {
  const set = new Set(dateKeys);
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}
