import { MAX_YEAR, MIN_YEAR } from "./constants";

/** Eine gemeinsame Skala für Eingabe-Zeitleiste, Auflösung und Tests. Positionen in Prozent (0–100) der nutzbaren Skalenbreite. */
export function yearToPercent(year: number, min = MIN_YEAR, max = MAX_YEAR): number {
  return ((Math.min(max, Math.max(min, year)) - min) / (max - min)) * 100;
}

export interface Deviation {
  /** 0 = Volltreffer */
  years: number;
  /** früh: Tipp liegt vor dem richtigen Jahr, spät: danach */
  direction: "exakt" | "zu_frueh" | "zu_spaet";
  /** z. B. „30 Jahre zu spät“, „1 Jahr zu früh“, „Volltreffer!“ */
  text: string;
}

export function describeDeviation(guess: number | null, correct: number): Deviation | null {
  if (guess === null) return null;
  const years = Math.abs(guess - correct);
  if (years === 0) return { years, direction: "exakt", text: "Volltreffer!" };
  const direction = guess > correct ? "zu_spaet" : "zu_frueh";
  return { years, direction, text: `${years} ${years === 1 ? "Jahr" : "Jahre"} ${direction === "zu_spaet" ? "zu spät" : "zu früh"}` };
}

export interface TimelineGeometry {
  correctPct: number;
  guessPct: number | null;
  exact: boolean;
  /** Rotes Segment exakt zwischen den Markern – unabhängig davon, welcher links steht. */
  segment: { leftPct: number; widthPct: number } | null;
}

export function timelineGeometry(guess: number | null, correct: number, min = MIN_YEAR, max = MAX_YEAR): TimelineGeometry {
  const correctPct = yearToPercent(correct, min, max);
  if (guess === null) return { correctPct, guessPct: null, exact: false, segment: null };
  const guessPct = yearToPercent(guess, min, max);
  const exact = guess === correct;
  return {
    correctPct,
    guessPct,
    exact,
    segment: exact ? null : { leftPct: Math.min(correctPct, guessPct), widthPct: Math.abs(correctPct - guessPct) },
  };
}

/** Screenreader-Text der Auflösung, einmal vollständig. */
export function resolutionAnnouncement(guess: number | null, correct: number, points: number): string {
  const d = describeDeviation(guess, correct);
  if (!d) return `Aufgelöst ohne Schätzung. Richtiges Jahr: ${correct}. 0 Punkte.`;
  if (d.direction === "exakt") return `Volltreffer! Du hast ${correct} geschätzt, das ist genau richtig. ${points} Punkte.`;
  return `Du hast ${guess} geschätzt, das richtige Jahr ist ${correct}. ${d.text}. ${points} Punkte.`;
}
