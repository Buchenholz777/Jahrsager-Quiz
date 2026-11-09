/** Fasst konkrete Pfade zu Bereichen zusammen (keine Slugs, Spielnummern oder IDs in der Messung). */
export function routeGroup(pathname: string): string {
  const p = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (p.startsWith("/geschichte/")) return "/geschichte/[slug]";
  if (p.startsWith("/tagesraetsel/")) return "/tagesraetsel/[nr]";
  const known = ["/", "/spielen", "/ergebnis", "/statistik", "/archiv", "/geschichte", "/so-funktionierts", "/impressum", "/datenschutz"];
  return known.includes(p) ? p : "/sonstige";
}
