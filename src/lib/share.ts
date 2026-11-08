import { formatPoints } from "./scoring";
import { CLAIM, MAX_POINTS_PER_GAME, SITE_NAME } from "./constants";

/** Spoilerfreier Teilen-Text im JAHRSAGER-Format: keine Ereignisnamen, keine Lösungsjahre. */
export function buildShareText(opts: {
  number: number;
  points: number;
  /** Nur zur Signatur-Kompatibilität; Abweichungen werden bewusst nicht geteilt. */
  deviations?: (number | null)[];
  url: string;
  practice?: boolean;
}): string {
  return [
    SITE_NAME,
    CLAIM,
    `Tagesrätsel #${opts.number}${opts.practice ? " (Übung)" : ""} – mein Ergebnis: ${formatPoints(opts.points)} / ${formatPoints(MAX_POINTS_PER_GAME)}`,
    "Wie gut kennst du unsere Geschichte?",
    opts.url,
  ].join("\n");
}

export function whatsappUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
