import type { EventStatus } from "@/lib/constants";

export type Source = { label: string; url?: string };

export type Checks = {
  rights?: boolean; // Bildrechte geprüft
  facts?: boolean; // Fakten und Ereignisjahr gegen Quellen geprüft
  photoMatchesEvent?: boolean; // Aufnahme entstand nachweislich während des Ereignisses
};

export const IMAGE_STATUSES = ["platzhalter", "recherchiert", "zu_pruefen", "freigegeben"] as const;
export type ImageStatus = (typeof IMAGE_STATUSES)[number];
export const IMAGE_STATUS_LABELS: Record<ImageStatus, string> = {
  platzhalter: "Platzhalter",
  recherchiert: "Recherchiert (am Original noch ungeprüft)",
  zu_pruefen: "Noch zu prüfen (offene Punkte)",
  freigegeben: "Redaktionell freigegeben",
};

/** Recherchierter Bildkandidat aus einem Archiv (noch nicht importiert/freigegeben). */
export interface ImageCandidate {
  commonsFile: string; // Dateiname auf Wikimedia Commons (ohne "File:")
  commonsUrl: string;
  originalUrl: string; // Seite im Originalarchiv (NASA, LoC, NARA, Bundesarchiv, ETH, Fortepan, Flickr …)
  originalReadable: boolean; // false = Originalseite war bei der Recherche nicht lesbar
  author: string;
  authorNote?: string;
  license: string;
  licenseUrl: string;
  photoDate: string; // Aufnahmedatum laut Metadaten (ggf. nur Monat/Jahr)
  photoDateNote?: string;
  creditShort: string; // vor dem Tipp sichtbar (frei von Zeitangaben!)
  creditFull: string;
  altDraft: string; // Entwurf – am echten Bild zu prüfen
  width: number;
  height: number;
  risks: string[];
  /** Prozent der Bildhöhe, die unten abgeschnitten werden (z. B. verräterische Archivbeschriftung). */
  cropBottomPct?: number;
}

/** Eintrag im Prüfprotokoll eines Ereignisses (Zeitpunkt, Regeln, Belege, Entscheidung). */
export interface AuditEntry {
  at: string;
  actor: string;
  step: string;
  decision: "ok" | "manuell" | "abgelehnt" | "info";
  rules: string[];
  evidence?: Record<string, unknown>;
}

export interface Research {
  image?: ImageCandidate;
  factsStatus?: "primaerquellen" | "teilweise_hilfsquellen";
  openPoints?: string[];
  /** Rechtedaten und Bildnachweis (src/lib/bildrechte.ts) */
  bildrechte?: import("@/lib/bildrechte").ImageRights;
  /** Weltgeschichtliche Bedeutung: Urteil, Begründung in einem Satz, Bild- und Jahresbezug (src/lib/bedeutung.ts) */
  bedeutung?: import("@/lib/bedeutung").Bedeutung;
}

export interface EventRow {
  id: string;
  slug: string;
  status: EventStatus;
  is_demo: boolean;
  version: number;
  category: string;
  difficulty: number;
  neutral_title: string;
  description: string;
  image_alt: string;
  image_credit_short: string;
  correct_year: number;
  exact_date: string | null;
  photo_date: string | null;
  public_title: string;
  explanation_what: string;
  explanation_why: string;
  explanation_detail: string;
  background: string;
  sources: Source[];
  image_id: string | null;
  image_ext: string | null;
  image_width: number | null;
  image_height: number | null;
  image_is_placeholder: boolean;
  image_photographer: string;
  image_institution: string;
  image_credit_full: string;
  image_license: string;
  image_license_url: string;
  image_source_url: string;
  image_edits: string;
  checks: Checks;
  image_status: ImageStatus;
  research: Research;
  knowledge_enabled: boolean;
  homepage_showcase: boolean;
  subcategory: string;
  tags: string[];
  region: string;
  country: string;
  topic_key: string;
  pipeline_state: "candidate" | "checking" | "auto_approved" | "manual_review" | "rejected" | null;
  source_id: string | null;
  blocked: boolean;
  blocked_reason: string;
  audit: AuditEntry[];
  created_at: Date | string;
  updated_at: Date | string;
  published_at: Date | string | null;
}

/** Felder, die Redakteure bearbeiten. */
export const EDITABLE_FIELDS = [
  "slug",
  "category",
  "difficulty",
  "neutral_title",
  "description",
  "image_alt",
  "image_credit_short",
  "correct_year",
  "exact_date",
  "photo_date",
  "public_title",
  "explanation_what",
  "explanation_why",
  "explanation_detail",
  "background",
  "sources",
  "image_id",
  "image_ext",
  "image_width",
  "image_height",
  "image_is_placeholder",
  "image_photographer",
  "image_institution",
  "image_credit_full",
  "image_license",
  "image_license_url",
  "image_source_url",
  "image_edits",
  "checks",
  "image_status",
  "research",
  "knowledge_enabled",
  "homepage_showcase",
  "subcategory",
  "tags",
  "region",
  "country",
  "topic_key",
  "is_demo",
] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];
export type EventInput = Pick<EventRow, EditableField>;

export interface PackInfo {
  id: string;
  number: number;
  pack_date: string;
  status: "geplant" | "veroeffentlicht";
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
