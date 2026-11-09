export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE_NAME = "JAHRSAGER";
export const SITE_TITLE = "JAHRSAGER – Das tägliche Geschichtsquiz";
export const SITE_DESCRIPTION =
  "5 historische Bilder, 5 Jahreszahlen: Wie gut kennst du die Weltgeschichte? Spiele das kostenlose Tagesquiz – jeden Tag neu und ohne Anmeldung.";
/** Statisches Marken-Vorschaubild (1200×630), enthält bewusst keine historischen Fotos. */
export const OG_IMAGE_PATH = "/brand/og-jahrsager-1200x630.png";
