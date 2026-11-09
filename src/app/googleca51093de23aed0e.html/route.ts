/**
 * Google-Search-Console-Bestätigungsdatei. Als Route statt als statische Datei, weil Cloudflare Pages ".html"-Dateien per 308 umleitet,
 * die Bestätigung aber eine direkte Antwort (200) unter genau dieser URL verlangt. Die Datei darf nicht entfernt werden.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response("google-site-verification: googleca51093de23aed0e.html", {
    headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "public, max-age=3600" },
  });
}
