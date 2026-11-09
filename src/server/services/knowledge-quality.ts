import type { EventRow } from "../types";

/**
 * Qualitätsschranke für die Indexierung von Wissensseiten. Eine Seite ist für Suchmaschinen nur freigegeben, wenn sie
 * einen eigenständigen Informationswert hat und alle Nachweise vorliegen. Andernfalls bleibt sie für Spieler erreichbar
 * (nach dem Rätseltag), erhält aber noindex und steht nicht in der Sitemap.
 */
export const KNOWLEDGE_MIN = {
  /** Wörter im „Historischen Hintergrund“ (Quizauflösung allein reicht nicht als eigenständige Seite) */
  backgroundWords: 80,
  /** Wörter aller Textfelder zusammen */
  totalWords: 220,
  sources: 2,
  /** lange Bildseite in px (Open Graph / Discover) */
  imageLongSide: 1200,
  /** Kategorie-Übersicht und /geschichte werden erst ab dieser Zahl indexierbarer Seiten indexiert */
  listingMinPages: 3,
} as const;

const words = (s: string | null | undefined) => (s ?? "").trim().split(/\s+/).filter(Boolean).length;

export interface KnowledgeQuality {
  indexable: boolean;
  problems: string[];
  words: { background: number; total: number };
}

export function knowledgeQuality(e: Pick<EventRow, "is_demo" | "blocked" | "image_status" | "image_id" | "image_is_placeholder" | "image_alt" | "image_width" | "image_height" | "image_credit_full" | "image_license" | "image_source_url" | "checks" | "sources" | "explanation_what" | "explanation_why" | "explanation_detail" | "background">): KnowledgeQuality {
  const p: string[] = [];
  const bg = words(e.background);
  const total = bg + words(e.explanation_what) + words(e.explanation_why) + words(e.explanation_detail);
  if (e.is_demo) p.push("Demo-Inhalt.");
  if (e.blocked) p.push("Ereignis ist gesperrt.");
  if (e.image_status !== "freigegeben" || !e.checks?.rights) p.push("Bildrechte nicht freigegeben/bestätigt.");
  if (!e.checks?.facts) p.push("Fakten nicht als geprüft bestätigt.");
  if (!e.image_id || e.image_is_placeholder) p.push("Kein echtes Foto.");
  if (!e.image_alt?.trim()) p.push("Alternativtext fehlt.");
  if (!e.image_credit_full?.trim() || !e.image_license?.trim() || !e.image_source_url?.trim()) p.push("Bildnachweis (Urheber, Lizenz, Fundstelle) unvollständig.");
  if (Math.max(e.image_width ?? 0, e.image_height ?? 0) < KNOWLEDGE_MIN.imageLongSide) p.push(`Bild kleiner als ${KNOWLEDGE_MIN.imageLongSide} px (lange Seite).`);
  const withUrl = (e.sources ?? []).filter((s) => s.url && /^https?:\/\//.test(s.url)).length;
  if (withUrl < KNOWLEDGE_MIN.sources) p.push(`Weniger als ${KNOWLEDGE_MIN.sources} Faktenquellen mit Link.`);
  if (bg < KNOWLEDGE_MIN.backgroundWords) p.push(`Historischer Hintergrund hat ${bg} Wörter (mind. ${KNOWLEDGE_MIN.backgroundWords}).`);
  if (total < KNOWLEDGE_MIN.totalWords) p.push(`Gesamttext hat ${total} Wörter (mind. ${KNOWLEDGE_MIN.totalWords}).`);
  return { indexable: p.length === 0, problems: p, words: { background: bg, total } };
}
