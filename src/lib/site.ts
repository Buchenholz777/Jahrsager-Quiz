export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE_TITLE = "JAHRSAGER Quiz – Tägliches Geschichtsquiz kostenlos spielen";
export const SITE_DESCRIPTION =
  "5 Bilder. 5 Ereignisse. Rate das Jahr! Entdecke täglich Momente der Weltgeschichte, schätze Jahreszahlen und sammle Punkte. Kostenlos, ohne Anmeldung.";
