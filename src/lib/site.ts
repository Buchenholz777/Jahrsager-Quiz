export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE_TITLE = "Jahrsager – Das tägliche Geschichtsquiz | 5 Bilder, 5 Ereignisse";
export const SITE_DESCRIPTION =
  "Wie gut kennst du unsere Geschichte? Bei Jahrsager erwarten dich täglich 5 historische Bilder. Schätze das richtige Jahr und sammle Punkte. Kostenlos spielen!";
