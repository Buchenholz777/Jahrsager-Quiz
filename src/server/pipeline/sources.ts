import type { CommonsMeta } from "./license";

// Wikimedia verlangt eine identifizierbare Kennung mit gültigem Kontakt: PIPELINE_CONTACT (E-Mail oder URL) setzen.
const UA = `JAHRSAGER-Redaktion/0.2 (https://www.jahrsagerquiz.de; ${process.env.PIPELINE_CONTACT ?? "Kontakt: PIPELINE_CONTACT nicht gesetzt"})`;
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
  /** Commons-Kategorie des Ereignisses (Wikidata P373), Quelle für die Bild-Suche je Ereignis */
  commonsCategory?: string;
}

/** Zusätzliche Ereignistypen für die US-Variante: Naturereignisse, Katastrophen, Raumflüge. */
// Raumflüge (Q5916) bewusst nicht als eigener Suchtyp: Raumfahrt soll den Vorrat nicht dominieren (siehe Raumfahrt-Deckel in process.ts).
const US_EXTRA_TYPES = ["Q8065", "Q7944", "Q8068", "Q168983", "Q1261499"];
const EVENT_TYPES = ["Q1190554", "Q1656682", "Q13418847", "Q3839081", "Q273120", "Q40231", "Q124757", "Q178561", "Q2627975"];
/** Themenspezifische Suchen für unterrepräsentierte Bereiche (Wikidata-Klassen; die Ausbeute je Variante wird im Lauf protokolliert). */
const TOPIC_TYPES: Record<"sport" | "kultur" | "gesellschaft", string[]> = {
  sport: ["Q16510064", "Q13406554", "Q18608583"],
  kultur: ["Q132241", "Q182832", "Q2627975", "Q464980"],
  gesellschaft: ["Q273120", "Q49773", "Q45382", "Q131569", "Q40231"],
};

/**
 * Suchvarianten: "breit" (alle Ereignistypen weltweit), "us" (Ereignisse in den USA – dort sind Bilder von Bundesbehörden wie NASA, Militär,
 * National Archives, USGS verbreitet und als Werke der Bundesregierung gemeinfrei). Optional auf einen Zeitraum eingegrenzt.
 */
export interface DiscoveryOptions {
  variant?: "breit" | "us" | "sport" | "kultur" | "gesellschaft";
  fromYear?: number;
  toYear?: number;
}

/** Wikidata-Ereignisse mit tagesgenauem Datum (Standard 1900–2020), Bild (P18) und deutschem Wikipedia-Artikel. */
export async function findCandidates(limit: number, offset = 0, opts: DiscoveryOptions = {}): Promise<Candidate[]> {
  const from = Math.max(1900, opts.fromYear ?? 1900);
  const to = Math.min(2020, opts.toYear ?? 2020);
  const types = opts.variant === "us" ? [...EVENT_TYPES, ...US_EXTRA_TYPES] : opts.variant && opts.variant in TOPIC_TYPES ? TOPIC_TYPES[opts.variant as keyof typeof TOPIC_TYPES] : EVENT_TYPES;
  const q = `SELECT ?item ?date ?image ?article ?cat WHERE {
    VALUES ?t { ${types.map((t) => "wd:" + t).join(" ")} }
    ?item wdt:P31 ?t .
    ${opts.variant === "us" ? "?item wdt:P17 wd:Q30 ." : ""}
    ?item p:P585 ?st . ?st psv:P585 ?v . ?v wikibase:timeValue ?date ; wikibase:timePrecision 11 .
    FILTER(?date >= "${from}-01-01T00:00:00Z"^^xsd:dateTime && ?date < "${to + 1}-01-01T00:00:00Z"^^xsd:dateTime)
    ?item wdt:P18 ?image .
    OPTIONAL { ?item wdt:P373 ?cat }
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
    commonsCategory: b.cat?.value,
  }));
}

/** Commons-Metadaten sind HTML: Tags entfernen und Entitäten dekodieren; das Ergebnis ist reiner Text (wird im Browser nie als HTML dargestellt). */
const ENT: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };
const strip = (s: string | undefined) =>
  (s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|lt|gt|quot|nbsp|#39);/g, (m) => ENT[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();

type ImageInfo = {
  url: string;
  width: number;
  height: number;
  mime: string;
  descriptionurl: string;
  extmetadata?: Record<string, { value?: string }>;
};

function toMeta(file: string, i: ImageInfo): CommonsMeta {
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
    title: v("ObjectName"),
    attribution: v("Attribution"),
    attributionRequired: m.AttributionRequired?.value === undefined ? null : /true/i.test(m.AttributionRequired.value),
  };
}

export async function commonsMeta(file: string): Promise<CommonsMeta | null> {
  const api =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({ action: "query", titles: `File:${file}`, prop: "imageinfo", iiprop: "url|size|mime|extmetadata", format: "json", formatversion: "2" });
  const res = await politeFetch(api);
  if (!res.ok) throw new Error(`Commons-API: HTTP ${res.status}`);
  const page = ((await res.json()) as { query?: { pages?: { imageinfo?: ImageInfo[] }[] } }).query?.pages?.[0];
  const i = page?.imageinfo?.[0];
  return i ? toMeta(file, i) : null;
}

/** Metadaten der Dateien einer Commons-Kategorie (höchstens `limit`, eine Abfrage für die Liste, eine für alle Metadaten). */
export async function categoryImages(category: string, limit = 50): Promise<CommonsMeta[]> {
  const list = ((await wikiApi("commons.wikimedia.org", { action: "query", list: "categorymembers", cmtitle: `Category:${category.replace(/^Category:/, "")}`, cmtype: "file", cmlimit: String(limit) })) as {
    query?: { categorymembers?: { title: string }[] };
  }).query?.categorymembers ?? [];
  if (!list.length) return [];
  const pages = ((await wikiApi("commons.wikimedia.org", { action: "query", prop: "imageinfo", iiprop: "url|size|mime|extmetadata", titles: list.map((m) => m.title).join("|") })) as {
    query?: { pages?: { title: string; imageinfo?: ImageInfo[] }[] };
  }).query?.pages ?? [];
  return pages.filter((p) => p.imageinfo?.[0]).map((p) => toMeta(p.title.replace(/^File:/, ""), p.imageinfo![0]));
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
  "europeana.eu", "trumanlibrary.org", "jfklibrary.org", "esa.int", "nih.gov", "genome.gov", "unesco.org", "icrc.org", "usgs.gov", "noaa.gov", "nps.gov",
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

/** Commons-Kategorien mit Werken von US-Bundesbehörden (gemeinfrei, Nachweis über Urheber/Credit wird von der Lizenzprüfung gefordert). */
export const GOV_CATEGORIES = ["PD NASA", "PD US Army", "PD US Navy", "PD US Air Force", "PD US Coast Guard", "PD USGS"];

async function wikiApi(host: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  // POST, weil lange Titellisten die URL-Längengrenze (HTTP 414) überschreiten würden.
  const res = await politeFetch(`https://${host}/w/api.php`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ format: "json", formatversion: "2", ...params }).toString(),
  });
  if (!res.ok) throw new Error(`${host}-API: HTTP ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

/**
 * Bild-zuerst-Suche: zufällige Dateien aus Kategorien mit Behördenbildern → deutsche Wikipedia-Artikel, die das Bild nutzen → Wikidata-Ereignis
 * mit tagesgenauem Datum. Nur Artikel mit Ereignisdatum werden Kandidaten; Lizenz, Datumsabgleich, Quellen und Texte prüft anschließend die Pipeline.
 */
export async function findGovCandidates(files = 100, rnd: () => number = Math.random): Promise<Candidate[]> {
  const cat = GOV_CATEGORIES[Math.floor(rnd() * GOV_CATEGORIES.length)];
  const hex = Array.from({ length: 16 }, () => "0123456789abcdef"[Math.floor(rnd() * 16)]).join("");
  const members = ((await wikiApi("commons.wikimedia.org", { action: "query", list: "categorymembers", cmtitle: `Category:${cat}`, cmtype: "file", cmlimit: String(Math.min(50, files)), cmsort: "sortkey", cmstarthexsortkey: hex })) as {
    query?: { categorymembers?: { title: string }[] };
  }).query?.categorymembers ?? [];
  if (!members.length) return [];
  const usage = ((await wikiApi("commons.wikimedia.org", { action: "query", prop: "globalusage", gulimit: "max", titles: members.map((m) => m.title).join("|") })) as {
    query?: { pages?: { title: string; globalusage?: { wiki: string; title: string; ns: string | number }[] }[] };
  }).query?.pages ?? [];
  const byArticle = new Map<string, string>(); // de-Artikel → Datei
  for (const p of usage) {
    const de = p.globalusage?.find((u) => u.wiki === "de.wikipedia.org" && !u.title.includes(":")); // nur Artikel (keine Namensraum-Seiten wie "Benutzer:")
    if (de && !byArticle.has(de.title)) byArticle.set(de.title, p.title.replace(/^File:/, ""));
  }
  if (process.env.DEBUG_GOV) console.log(`[gov] ${cat}: Dateien ${members.length}, mit de-Artikel ${byArticle.size}`);
  if (!byArticle.size) return [];
  const props = ((await wikiApi("de.wikipedia.org", { action: "query", prop: "pageprops", ppprop: "wikibase_item", redirects: "1", titles: [...byArticle.keys()].slice(0, 50).join("|") })) as {
    query?: { pages?: { title: string; pageprops?: { wikibase_item?: string } }[] };
  }).query?.pages ?? [];
  const items = props.filter((p) => p.pageprops?.wikibase_item);
  if (process.env.DEBUG_GOV) console.log(`[gov] Seiten ${props.length}, mit Wikidata ${items.length}`);
  if (!items.length) return [];
  const q = `SELECT ?item ?date WHERE {
    VALUES ?item { ${items.map((p) => "wd:" + p.pageprops!.wikibase_item).join(" ")} }
    { ?item p:P585 ?st . ?st psv:P585 ?v } UNION { ?item p:P580 ?st . ?st psv:P580 ?v }
    ?v wikibase:timeValue ?date ; wikibase:timePrecision 11 .
    FILTER(?date >= "1900-01-01T00:00:00Z"^^xsd:dateTime && ?date < "2021-01-01T00:00:00Z"^^xsd:dateTime)
  }`;
  const res = await politeFetch("https://query.wikidata.org/sparql?" + new URLSearchParams({ query: q }), { headers: { Accept: "application/sparql-results+json" } });
  if (!res.ok) throw new Error(`Wikidata-SPARQL: HTTP ${res.status}`);
  const dates = new Map<string, string>(((await res.json()) as { results: { bindings: Record<string, { value: string }>[] } }).results.bindings.map((b) => [b.item.value.split("/").pop()!, b.date.value.slice(0, 10)]));
  if (process.env.DEBUG_GOV) console.log(`[gov] mit Datum ${dates.size}`);
  const out: Candidate[] = [];
  for (const p of items) {
    const q = p.pageprops!.wikibase_item!;
    const date = dates.get(q);
    const file = byArticle.get(p.title) ?? [...byArticle].find(([t]) => t.replace(/_/g, " ") === p.title)?.[1];
    if (!date || !file) continue;
    out.push({ sourceId: q, date, commonsFile: file, articleUrl: `https://de.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`, articleTitle: p.title });
  }
  return out;
}
