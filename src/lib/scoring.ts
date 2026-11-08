import { MAX_POINTS_PER_ROUND, MAX_YEAR, MIN_YEAR, PENALTY_PER_YEAR } from "./constants";

/**
 * Versionierte Wertungsregeln. Eine Änderung der Formel erhält eine NEUE Version;
 * bereits gespeicherte Partien behalten ihre Version (siehe games.scoring_version).
 */
export const SCORING_VERSION = 1;

type Rule = { maxPoints: number; penaltyPerYear: number };
const RULES: Record<number, Rule> = {
  1: { maxPoints: MAX_POINTS_PER_ROUND, penaltyPerYear: PENALTY_PER_YEAR },
};

export function isValidYear(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= MIN_YEAR && value <= MAX_YEAR;
}

/** Punkte = max(0, 1000 − 50 × |Tipp − Lösung|) */
export function scoreGuess(guess: number, correct: number, version: number = SCORING_VERSION): number {
  const rule = RULES[version];
  if (!rule) throw new Error(`Unbekannte Wertungsversion ${version}`);
  if (!Number.isInteger(guess) || !Number.isInteger(correct)) throw new Error("Jahre müssen ganze Zahlen sein");
  return Math.max(0, rule.maxPoints - rule.penaltyPerYear * Math.abs(guess - correct));
}

export function yearDifference(guess: number, correct: number) {
  return Math.abs(guess - correct);
}

export function formatPoints(n: number) {
  return new Intl.NumberFormat("de-DE").format(n);
}

export function describeDifference(diff: number | null): string {
  if (diff === null) return "Ohne Tipp aufgelöst";
  if (diff === 0) return "Genau getroffen!";
  return diff === 1 ? "1 Jahr daneben" : `${diff} Jahre daneben`;
}
