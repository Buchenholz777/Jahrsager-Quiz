export const SITE_NAME = "JAHRSAGER";
export const CLAIM = "5 Bilder. 5 Ereignisse. Rate das Jahr.";
export const TAGLINE = "Das tägliche Geschichtsquiz";
export const GAME_TIMEZONE = "Europe/Berlin";

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2020;
export const ROUNDS_PER_GAME = 5;
export const MAX_POINTS_PER_ROUND = 1000;
export const MAX_POINTS_PER_GAME = MAX_POINTS_PER_ROUND * ROUNDS_PER_GAME;
export const PENALTY_PER_YEAR = 50;

export const CATEGORIES = {
  politik: "Politik",
  wissenschaft: "Wissenschaft",
  technik: "Technik",
  gesellschaft: "Gesellschaft",
  kultur: "Kultur",
  sport: "Sport",
  wirtschaft: "Wirtschaft",
} as const;
export type CategoryKey = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

export const EVENT_STATUSES = ["entwurf", "in_pruefung", "freigegeben", "eingeplant", "veroeffentlicht"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  entwurf: "Entwurf",
  in_pruefung: "In Prüfung",
  freigegeben: "Freigegeben",
  eingeplant: "Eingeplant",
  veroeffentlicht: "Veröffentlicht",
};

export const DIFFICULTY_LABELS: Record<number, string> = { 1: "Einstieg", 2: "Mittel", 3: "Knifflig" };

export const PLAYER_COOKIE = "zs_pid";
export const ADMIN_COOKIE = "zs_admin";
