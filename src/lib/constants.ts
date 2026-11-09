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
  gesellschaft: "Gesellschaft",
  sport: "Sport",
  musik: "Musik & Popkultur",
  film: "Film & Fernsehen",
  wissenschaft: "Wissenschaft",
  technik: "Technik",
  architektur: "Architektur",
  natur: "Natur & Umwelt",
  wirtschaft: "Wirtschaft",
  entdeckung: "Entdeckungen",
  raumfahrt: "Raumfahrt & Astronomie",
  kultur: "Kultur", // Altwert aus der ersten Version; neue Ereignisse nutzen Musik oder Film
} as const;
export type CategoryKey = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

/** Zwölf Hauptthemenfelder der Auswahl (Altwert „kultur“ zählt zu Film). */
export const CATEGORY_GROUP: Record<CategoryKey, CategoryKey> = {
  politik: "politik", gesellschaft: "gesellschaft", sport: "sport", musik: "musik", film: "film", wissenschaft: "wissenschaft",
  technik: "technik", architektur: "architektur", natur: "natur", wirtschaft: "wirtschaft", entdeckung: "entdeckung", raumfahrt: "raumfahrt", kultur: "film",
};
export const MAIN_CATEGORIES = CATEGORY_KEYS.filter((k) => k !== "kultur");

export const REGIONS = {
  europa: "Europa",
  nordamerika: "Nordamerika",
  suedamerika: "Südamerika",
  afrika: "Afrika",
  asien: "Asien",
  ozeanien: "Ozeanien",
  global: "International/global",
} as const;
export type RegionKey = keyof typeof REGIONS;

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
