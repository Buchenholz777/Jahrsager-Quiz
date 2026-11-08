import type { Queryable } from "../db/client";
import type { EventInput, EventRow, ImageCandidate, ImageStatus, Source } from "../types";
import { EDITABLE_FIELDS } from "../types";
import { createEvent, getEventBySlug, preTipHints, updateEvent } from "./events";

/** Datensatz aus `content/recherche/jahrsager-10-ereignisse.json` (Schema „seed-v1“). */
export interface RedaktionEvent {
  id: string;
  slug: string;
  title_pre_guess: string;
  teaser_pre_guess: string;
  answer_year: number;
  event_date: string | null;
  category: string;
  estimated_difficulty: "leicht" | "mittel" | "schwer";
  image: {
    candidate_source_url: string;
    storage_path: string | null;
    photographed_at: string | null;
    photo_date_precision: string;
    institution: string;
    photographer: string;
    license_claim: string;
    credit_line_draft: string;
    license_url: string | null;
    modifications: string[];
    visual_inspection_done: boolean;
    rights_approved_by_human: boolean;
    editorial_notes: string;
    alt_text_pre_guess: string | null;
  };
  reveal: { what_happened: string; why_it_matters: string; extra_fact: string };
  fact_sources: string[];
  editorial_review_notes: string;
}
export interface RedaktionFile {
  schema_version: string;
  events: RedaktionEvent[];
}

/** Themenfelder der App je Ereignis (die Quelldatei nutzt freiere Bezeichnungen). */
const CATEGORY: Record<string, string> = {
  "suedpol-amundsen-1911": "wissenschaft",
  "lindbergh-paris-1927": "technik",
  "jesse-owens-1936": "sport",
  "berliner-luftbruecke-1948": "politik",
  "marsch-washington-1963": "gesellschaft",
  "nixon-ruecktritt-1974": "politik",
  "shuttle-columbia-start-1981": "technik",
  "hubble-start-1990": "wissenschaft",
  "humangenom-entwurf-2000": "wissenschaft",
  "frauen-ausseneinsatz-iss-2019": "gesellschaft",
};

/** Titel der Auflösung (in der Quelldatei nicht enthalten, hier redaktionell ergänzt). */
const PUBLIC_TITLE: Record<string, string> = {
  "suedpol-amundsen-1911": "Amundsen erreicht den Südpol",
  "lindbergh-paris-1927": "Lindberghs Alleinflug über den Atlantik",
  "jesse-owens-1936": "Jesse Owens gewinnt in Berlin vier Goldmedaillen",
  "berliner-luftbruecke-1948": "Die Berliner Luftbrücke",
  "marsch-washington-1963": "Der Marsch auf Washington für Arbeit und Freiheit",
  "nixon-ruecktritt-1974": "Richard Nixon tritt als US-Präsident zurück",
  "shuttle-columbia-start-1981": "Erster Flug des Space Shuttles (STS-1)",
  "hubble-start-1990": "Start des Hubble-Weltraumteleskops",
  "humangenom-entwurf-2000": "Entwurf der menschlichen Genomsequenz vorgestellt",
  "frauen-ausseneinsatz-iss-2019": "Erster Außenbordeinsatz nur mit Frauen",
};

/** Fälle mit bekannten Widersprüchen/Lücken: Bildstatus „zu_pruefen“, alle übrigen „recherchiert“. */
const PROBLEM_CASES = new Set([
  "suedpol-amundsen-1911",
  "lindbergh-paris-1927",
  "berliner-luftbruecke-1948",
  "humangenom-entwurf-2000",
  "jesse-owens-1936",
  "frauen-ausseneinsatz-iss-2019",
]);

const com = (f: string) => "https://commons.wikimedia.org/wiki/File:" + f.replace(/ /g, "_");

/**
 * Bildkandidaten, deren Lizenz am Commons-Datensatz abgefragt wurde (8. November 2026) und die eine nachvollziehbare
 * Quelle haben. NICHT enthalten sind bewusst: Südpol (Fotograf Bjaaland † 1961 – in Deutschland/EU voraussichtlich
 * noch geschützt, Rechte ungeklärt) und Humangenom (Bildquelle ungeklärt). Der Import (images:import) prüft die Lizenz
 * erneut und gibt NIE frei; ein Mensch muss Bild, Lizenz, Quelle und Datum am Original bestätigen.
 */
const IMAGE_CANDIDATES: Record<string, ImageCandidate> = {
  "lindbergh-paris-1927": {
    commonsFile: "L'avion de Lindbergh (le Spirit of Saint-Louis) survolant Le Bourget, 1927 - btv1b53241544p.jpg",
    commonsUrl: com("L'avion de Lindbergh (le Spirit of Saint-Louis) survolant Le Bourget, 1927 - btv1b53241544p.jpg"),
    originalUrl: "https://gallica.bnf.fr/ark:/12148/btv1b53241544p",
    originalReadable: false,
    author: "Agence de presse Meurisse (Auftraggeber/Agentur; Fotograf nicht genannt)",
    license: "Public domain",
    licenseUrl: "",
    photoDate: "1927-05",
    photoDateNote: "Nur das Jahr/der Monat ist belegt; ob das Bild die Ankunft am 21. Mai zeigt, ist offen.",
    creditShort: "Bibliothèque nationale de France / Agence Meurisse",
    creditFull: "Bibliothèque nationale de France, Agence de presse Meurisse (btv1b53241544p), über Wikimedia Commons; als Public domain gekennzeichnet",
    altDraft: "Entwurf (am Bild zu prüfen): Einmotoriges Flugzeug im Flug über einem Flugplatz.",
    width: 6051,
    height: 4639,
    risks: ["Aufnahmetag unbestätigt", "Originalseite (Gallica) nicht geprüft", "Gemeinfrei-Angabe nach Landesrecht prüfen"],
  },
  "jesse-owens-1936": {
    commonsFile: "Bundesarchiv Bild 183-R96374, Berlin, Olympiade, Jesse Owens beim Weitsprung.jpg",
    commonsUrl: com("Bundesarchiv Bild 183-R96374, Berlin, Olympiade, Jesse Owens beim Weitsprung.jpg"),
    originalUrl: com("Bundesarchiv Bild 183-R96374, Berlin, Olympiade, Jesse Owens beim Weitsprung.jpg"),
    originalReadable: true,
    author: "Bundesarchiv (Fotograf unbekannt)",
    license: "CC BY-SA 3.0 de",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/de/",
    photoDate: "1936-08",
    photoDateNote: "Nur August belegt.",
    creditShort: "Bundesarchiv, Bild 183-R96374 / CC BY-SA 3.0 DE",
    creditFull: "Bundesarchiv, Bild 183-R96374, Fotograf unbekannt, CC BY-SA 3.0 DE (über Wikimedia Commons)",
    altDraft: "Entwurf (am Bild zu prüfen): Leichtathlet beim Weitsprung im Stadion.",
    width: 568,
    height: 800,
    risks: ["Namensnennung und ShareAlike (CC BY-SA 3.0 DE) einhalten", "Bearbeitungen kennzeichnen", "geringe Auflösung (568 × 800 px)"],
  },
  "berliner-luftbruecke-1948": {
    commonsFile: "Airlift-berlin.jpg",
    commonsUrl: com("Airlift-berlin.jpg"),
    originalUrl: "http://www.trumanlibrary.org/photographs/displayimage.php?pointer=31197",
    originalReadable: false,
    author: "Unbekannt (US-Regierungsstelle)",
    license: "Public domain",
    licenseUrl: "",
    photoDate: "1948-08",
    photoDateNote: "Nur der Monat ist belegt.",
    creditShort: "Harry S. Truman Presidential Library",
    creditFull: "Harry S. Truman Presidential Library (Fotograf unbekannt, US-Regierungsstelle), über Wikimedia Commons; als Public domain gekennzeichnet",
    altDraft: "Entwurf (am Bild zu prüfen): Transportflugzeuge auf einem Flughafen, Helfer entladen Fracht.",
    width: 783,
    height: 507,
    risks: ["Einzeltag und Ort (Tempelhof?) unbestätigt", "Originalseite nicht geprüft"],
  },
  "nixon-ruecktritt-1974": {
    commonsFile: "President Richard Nixon's farewell to his cabinet and members of the White House staff.jpg",
    commonsUrl: com("President Richard Nixon's farewell to his cabinet and members of the White House staff.jpg"),
    originalUrl: "https://catalog.archives.gov/id/194597",
    originalReadable: false,
    author: "White House Photo Office (US-Bundesregierung)",
    license: "Public domain",
    licenseUrl: "",
    photoDate: "1974-08-09",
    creditShort: "White House Photo Office / U.S. National Archives",
    creditFull: "White House Photo Office Collection (Nixon Administration), U.S. National Archives, Katalog-ID 194597, über Wikimedia Commons; als Public domain gekennzeichnet",
    altDraft: "Entwurf (am Bild zu prüfen): Ein Mann im Anzug spricht vor einer versammelten Gruppe in einem Saal.",
    width: 3000,
    height: 2051,
    risks: ["Abgebildete und Bildquelle am Original prüfen"],
  },
};

const HOST_LABEL: [RegExp, string][] = [
  [/commons\.wikimedia\.org/, "Wikimedia Commons (Bildseite)"],
  [/amnh\.org/, "American Museum of Natural History"],
  [/airandspace\.si\.edu/, "Smithsonian National Air and Space Museum"],
  [/olympics\.com/, "Olympics.com"],
  [/af\.mil/, "U.S. Air Force"],
  [/unwritten-record\.blogs\.archives\.gov/, "U.S. National Archives (Unwritten Record)"],
  [/archives\.gov/, "U.S. National Archives"],
  [/nasa\.gov/, "NASA"],
  [/genome\.gov/, "National Human Genome Research Institute"],
];
const sourceLabel = (url: string) => HOST_LABEL.find(([re]) => re.test(url))?.[1] ?? new URL(url).hostname;

function photoDate(img: RedaktionEvent["image"]): string | null {
  if (img.photographed_at) return img.photographed_at;
  const m = /^month:(\d{4}-\d{2})$/.exec(img.photo_date_precision);
  return m ? m[1] : null;
}

/** Bildet einen Quelldatensatz auf das bestehende Ereignis-Schema ab – immer als Entwurf, ohne Bilddatei. */
export function mapRedaktionEvent(r: RedaktionEvent): EventInput {
  const category = CATEGORY[r.slug];
  const publicTitle = PUBLIC_TITLE[r.slug];
  if (!category || !publicTitle) throw new Error(`Kein Themenfeld/Titel für ${r.slug} hinterlegt.`);
  const status: ImageStatus = PROBLEM_CASES.has(r.slug) ? "zu_pruefen" : "recherchiert";
  const sources: Source[] = r.fact_sources.map((url) => ({ label: sourceLabel(url), url }));
  const openPoints = [r.image.editorial_notes, r.editorial_review_notes].filter((s) => s && s.trim());
  return {
    slug: r.slug,
    category,
    difficulty: { leicht: 1, mittel: 2, schwer: 3 }[r.estimated_difficulty],
    neutral_title: r.title_pre_guess,
    description: r.teaser_pre_guess,
    image_alt: r.image.alt_text_pre_guess ?? "", // bewusst leer: erst am echten Bild zu formulieren
    image_credit_short: "",
    correct_year: r.answer_year,
    exact_date: r.event_date,
    photo_date: photoDate(r.image),
    public_title: publicTitle,
    explanation_what: r.reveal.what_happened,
    explanation_why: r.reveal.why_it_matters,
    explanation_detail: r.reveal.extra_fact,
    background: "",
    sources,
    image_id: null,
    image_ext: null,
    image_width: null,
    image_height: null,
    image_is_placeholder: false,
    image_photographer: r.image.photographer,
    image_institution: r.image.institution,
    image_credit_full: r.image.credit_line_draft,
    image_license: r.image.license_claim,
    image_license_url: r.image.license_url ?? "",
    image_source_url: r.image.candidate_source_url,
    image_edits: r.image.modifications.join("; "),
    checks: {}, // keine Prüfbestätigung: Rechte, Fakten und Foto-Zuordnung muss ein Mensch bestätigen
    image_status: status,
    research: {
      openPoints,
      ...(IMAGE_CANDIDATES[r.slug] ? { image: IMAGE_CANDIDATES[r.slug] } : {}),
      // Rohdaten der Recherche exakt übernommen (Review-Metadaten, keine Freigabe)
      redaktion: {
        quelle: "content/recherche/jahrsager-10-ereignisse.json",
        id: r.id,
        bild: {
          storage_path: r.image.storage_path,
          photo_date_precision: r.image.photo_date_precision,
          visual_inspection_done: r.image.visual_inspection_done,
          rights_approved_by_human: r.image.rights_approved_by_human,
        },
      },
    } as unknown as EventRow["research"],
    knowledge_enabled: false,
    homepage_showcase: false,
    is_demo: false,
  };
}

export interface ImportReport {
  created: string[];
  unchanged: string[];
  /** Vorhandene Entwürfe, deren Quelldaten sich geändert haben (nur mit `update` überschrieben). */
  proposals: { slug: string; fields: string[]; applied: boolean }[];
  /** Bereits weiterbearbeitete (nicht mehr Entwurf) Ereignisse – werden nie überschrieben. */
  skipped: string[];
  spoilers: string[];
}

/** JSON mit sortierten Schlüsseln (jsonb in Postgres speichert Schlüssel in anderer Reihenfolge). */
const canon = (v: unknown): string =>
  JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));
const differing = (a: EventInput, b: EventRow | EventInput) => EDITABLE_FIELDS.filter((f) => canon((a as never)[f]) !== canon((b as never)[f]));

/**
 * Idempotenter Import anhand des stabilen Slugs. Es werden nur neue Entwürfe angelegt. Bestehende Datensätze
 * bleiben unverändert (Änderungen der Quelldatei erscheinen als Vorschlag); Tagespakete und Spielstände werden nie berührt.
 */
export async function importRedaktion(db: Queryable, file: RedaktionFile, opts: { update?: boolean } = {}): Promise<ImportReport> {
  const report: ImportReport = { created: [], unchanged: [], proposals: [], skipped: [], spoilers: [] };
  for (const r of file.events) {
    const input = mapRedaktionEvent(r);
    const hints = preTipHints(input as unknown as EventRow);
    if (hints.length) {
      report.spoilers.push(`${r.slug}: ${hints.join("; ")}`);
      continue; // Zeit-Spoiler vor dem Tipp: nicht importieren
    }
    const existing = await getEventBySlug(db, r.slug);
    if (!existing) {
      await createEvent(db, input, "Import aus jahrsager-10-ereignisse.json (Entwurf)");
      report.created.push(r.slug);
      continue;
    }
    // Vom Import zu trennende Bearbeitungen: nur reine Entwürfe dieses Imports kommen für Vorschläge infrage.
    const diff = differing(input, existing);
    if (!diff.length) {
      report.unchanged.push(r.slug);
    } else if (existing.status !== "entwurf") {
      report.skipped.push(r.slug);
    } else if (opts.update) {
      await updateEvent(db, existing.id, input, "Import: Quelldatei aktualisiert");
      report.proposals.push({ slug: r.slug, fields: diff, applied: true });
    } else {
      report.proposals.push({ slug: r.slug, fields: diff, applied: false });
    }
  }
  return report;
}
