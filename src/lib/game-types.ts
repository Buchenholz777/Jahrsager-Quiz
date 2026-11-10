/** Client-sichere Typen des Spielzustands. Enthält nie Lösungen offener Runden. */
export type RoundStatus = "offen" | "getippt" | "ohne_tipp";

export interface ImageInfo {
  id: string;
  ext: string;
  width: number;
  height: number;
  placeholder: boolean;
}

export interface RoundQuestion {
  title: string;
  description: string;
  alt: string;
  creditShort: string;
  license: string;
  licenseUrl: string;
  image: ImageInfo;
}

export interface RoundReveal {
  publicTitle: string;
  what: string;
  why: string;
  detail: string;
  sources: { label: string; url?: string }[];
  creditFull: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  isDemo: boolean;
  /** Belegte Begründung der weltgeschichtlichen Bedeutung (ein Satz), soweit redaktionell erfasst */
  significance?: string;
}

export interface RoundResult {
  guess: number | null;
  correct: number;
  difference: number | null;
  points: number;
  reveal: RoundReveal;
}

export interface RoundState {
  position: number;
  status: RoundStatus;
  eventId: string;
  question: RoundQuestion;
  result?: RoundResult;
}

export interface GameState {
  gameId: string;
  mode: "daily" | "practice" | "party";
  /** Gesetzt bei Party-Spielen: Code der Party */
  partyCode?: string | null;
  official: boolean;
  status: "laufend" | "abgeschlossen";
  packNumber: number;
  packDate: string;
  scoringVersion: number;
  totalPoints: number;
  /** Erste noch offene Runde (1–5) oder null, wenn die Partie abgeschlossen ist. */
  currentPosition: number | null;
  answered: number;
  /** Nur bereits aufgelöste Runden und die aktuell offene Runde – nie zukünftige. */
  rounds: RoundState[];
  nextResetAt: string;
}

export interface TodayStatus {
  hasPack: boolean;
  packNumber: number | null;
  state: "neu" | "laufend" | "abgeschlossen";
  answered: number;
  points: number | null;
  gameId: string | null;
  openOlder: { number: number; answered: number } | null;
  nextResetAt: string;
}
