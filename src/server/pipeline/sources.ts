import type { CommonsMeta } from "./license";

const UA = "JAHRSAGER-Redaktion/0.1 (https://www.jahrsagerquiz.de; Kontakt über den Betreiber der Website)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Höflicher Abruf mit Timeout und Wiederholung bei 429/5xx (Wikimedia-Richtlinien). */
export async function politeFetch(url: string, init: RequestInit = {}, tries = 4): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < tries; i++) {
    try {
      last = await fetch(url, { ...init, headers: { "User-Agent": UA, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(30_000) });
      if (last.status !== 429 && last.status < 500) return last;
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await sleep(Math.min(Number(last?.headers.get("retry-after")) || 4 * (i + 1), 60) * 1000);
  }
  return last!;
}

export interface Candidate {
  sourceId: string; // Wikidata-Q-Nummer
  date: string; // YYYY-MM-DD (Zeitpunkt, auf den Tag genau)
  commonsFile: string;
  articleUrl: string;
  articleTitle: string;
}

const EVENT_TYPES = ["Q1190554", "Q1656682", "Q13418847", "Q3839081", "Q273120", "Q40231", "Q124757", "Q178561", "Q2627975"];

/** Wikidata-Ereignisse mit tagesgenauem Datum 1900–2020, Bild (P18) und deutschem Wikipedia-Artikel. */
export async function findCandidates(limit: number, offset = 0): Promise<Candidate[]> {
  const q = `SELECT ?item ?date ?image ?article WHERE {
    VALUES ?t { ${EVENT_TYPES.map((t) => "wd:" + t).join(" ")} }
    ?item wdt:P31 ?t .
    ?item p:P585 ?st . ?st psv:P585 ?v . ?v wikibase:timeValue ?date ; wikibase:timePrecision 11 .
    FILTER(?date >= "1900-01-01T00:00:00Z"^^xsd:dateTime && ?date < "2021-01-01T00:00:00Z"^^xsd:dateTime)
    ?item wdt:P18 ?image .
    ?article schema:about ?item ; schema:isPartOf <https://de.wikipedia.org/> .
  } LIMIT ${limit} OFFSET ${offset}`;
  const res = await politeFetch("https://query.wikidata.org/sparql?" + new URLSearchParams({ query: q }), { headers: { Accept: "application/sparql-results+json" } });
  if (!res.ok) throw new Error(`Wikidata-SPARQL: HTTP ${res.status}`);
  const json = (await res.json()) as { results: { bindings: Record<string, { value: string }>[] } };
  return json.results.bindings.map((b) => ({
    sourceId: b.item.value.split("/").pop()!,
    date: b.date.value.slice(0, 10),
    commonsFile: decodeURIComponent(b.image.value.split("Special:FilePath/").pop()!).replace(/_/g, " "),
    articleUrl: b.article.value,
    articleTitle: decodeURIComponent(b.article.value.split("/wiki/").pop()!).replace(/_/g, " "),
  }));
}

const strip = (s: string | undefined) => (s ?? "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

type ImageInfo = {
  url: string;
  width: number;
  height: number;
  mime: string;
  descriptionurl: string;
  extmetadata?: Record<string, { value?: string }>;
};

export async function commonsMeta(file: string): Promise<CommonsMeta | null> {
  const api =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({ action: "query", titles: `File:${file}`, prop: "imageinfo", iiprop: "url|size|mime|extmetadata", format: "json", formatversion: "2" });
  const res = await politeFetch(api);
  if (!res.ok) throw new Error(`Commons-API: HTTP ${res.status}`);
  const page = ((await res.json()) as { query?: { pages?: { imageinfo?: ImageInfo[] }[] } }).query?.pages?.[0];
  const i = page?.imageinfo?.[0];
  if (!i) return null;
  const m = i.extmetadata ?? {};
  const v = (k: string) => strip(m[k]?.value);
  return {
    file,
    pageUrl: i.descriptionurl,
    url: i.url,
    width: i.width,
    height: i.height,
    mime: i.mime,
    license: v("LicenseShortName"),
    licenseUrl: v("LicenseUrl"),
    artist: v("Artist"),
    credit: v("Credit"),
    dateOriginal: v("DateTimeOriginal"),
    copyrighted: m.Copyrighted?.value === undefined ? null : /true/i.test(m.Copyrighted.value),
    restrictions: v("Restrictions"),
    categories: v("Categories").split("|").map((s) => s.trim()).filter(Boolean),
  };
}

export interface WikiInfo {
  title: string;
  url: string;
  extract: string;
  externalLinks: string[];
}

export async function wikipediaInfo(articleUrl: string): Promise<WikiInfo | null> {
  const title = decodeURIComponent(articleUrl.split("/wiki/").pop()!).replace(/_/g, " ");
  const api =
    "https://de.wikipedia.org/w/api.php?" +
    new URLSearchParams({ action: "query", titles: title, prop: "extracts|extlinks", exintro: "1", explaintext: "1", exlimit: "1", ellimit: "60", redirects: "1", format: "json", formatversion: "2" });
  const res = await politeFetch(api);
  if (!res.ok) return null;
  const p = ((await res.json()) as { query?: { pages?: { extract?: string; extlinks?: { url: string }[]; missing?: boolean }[] } }).query?.pages?.[0];
  if (!p || p.missing || !p.extract) return null;
  return { title, url: articleUrl, extract: p.extract, externalLinks: (p.extlinks ?? []).map((l) => l.url) };
}

/** Vertrauenswürdige Domains für Faktenquellen (Archive, Behörden, Institutionen). */
export const SOURCE_ALLOWLIST = [
  "nasa.gov", "archives.gov", "loc.gov", "bundesarchiv.de", "bpb.de", "bundestag.de", "bundesregierung.de", "whitehouse.gov",
  "britannica.com", "si.edu", "olympics.com", "nobelprize.org", "un.org", "europarl.europa.eu", "dhm.de", "hdg.de", "bnf.fr",
  "europeana.eu", "trumanlibrary.org", "jfklibrary.org", "esa.int", "nih.gov", "genome.gov", "unesco.org", "icrc.org",
];
export const allowedSource = (url: string) => {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return SOURCE_ALLOWLIST.some((d) => h === d || h.endsWith("." + d));
  } catch {
    return false;
  }
};

export async function reachable(url: string): Promise<boolean> {
  try {
    let r = await politeFetch(url, { method: "HEAD" }, 2);
    if (r.status === 405 || r.status === 403) r = await politeFetch(url, { method: "GET" }, 2);
    return r.ok;
  } catch {
    return false;
  }
}

const IMAGE_HOSTS = new Set(["upload.wikimedia.org", "thumb.wikimedia.org"]);
/** Lädt eine auf 2400 px Breite skalierte Fassung (Original-Scans sind oft zu groß); nur von upload.wikimedia.org. */
export async function downloadImage(meta: CommonsMeta, maxBytes = 25 * 1024 * 1024): Promise<Buffer> {
  const u = new URL(meta.url);
  if (u.protocol !== "https:" || !IMAGE_HOSTS.has(u.hostname)) throw new Error(`Bild-Download nur von upload.wikimedia.org erlaubt (${u.hostname}).`);
  const scaled = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(meta.file.replace(/ /g, "_"))}?width=2400`;
  const res = await politeFetch(scaled);
  if (!res.ok) throw new Error(`Bild-Download fehlgeschlagen: HTTP ${res.status}`);
  if (!IMAGE_HOSTS.has(new URL(res.url).hostname)) throw new Error("Bild-Download wurde auf einen nicht erlaubten Host umgeleitet.");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) throw new Error("Bild größer als erlaubt.");
  return buf;
}
