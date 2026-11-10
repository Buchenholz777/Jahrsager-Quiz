/**
 * Weltgeschichtliche Bedeutung als Pflichtkriterium für jedes Quizereignis.
 * Reine Regeln ohne Server-Abhängigkeiten: werden von der automatischen Recherche und von der Redaktion (Freigabe) gemeinsam genutzt.
 *
 * Ein Ereignis kommt nur infrage, wenn es (1) konkret ist, (2) ein eindeutig belegtes Jahr hat, (3) nachweisbare Folgen über Ländergrenzen hinweg hatte
 * oder als Wendepunkt von weltweiter Bedeutung gilt und (4) die Begründung in einem konkreten Satz festgehalten ist. Bekanntheit, kurzfristiges Medienecho
 * oder ein lokaler Rekord genügen nicht. Ein Ereignis darf an einem einzigen Ort stattgefunden haben.
 */

export type SignificanceVerdict = "weltgeschichtlich" | "nicht_weltgeschichtlich" | "unklar";
export type ImageSpecificity = "ereignisspezifisch" | "generisch" | "unklar";

export interface Bedeutung {
  verdict: SignificanceVerdict;
  /** ein konkreter Satz: Was hat sich durch das Ereignis verändert bzw. welchen Meilenstein markiert es? */
  reason: string;
  /** nachweisbare Folgen über Ländergrenzen hinweg */
  crossBorderEffects?: boolean;
  /** Ist das Jahr eindeutig belegt (Quellen widersprechen sich nicht)? */
  yearUnambiguous?: boolean;
  /** Zeigt das Bild das Ereignis, seine unmittelbaren Folgen oder einen unverwechselbaren Moment? */
  imageSpecificity?: ImageSpecificity;
  /** Anzahl der Wikipedia-Sprachversionen (objektives Indiz internationaler Beachtung, nie allein ausschlaggebend) */
  sitelinks?: number;
  checkedBy?: "auto" | "admin";
  checkedAt?: string;
}

/** Weniger Sprachversionen: Das Ereignis findet international kaum Beachtung (kein weltgeschichtliches Ereignis). */
export const SITELINKS_REJECT_BELOW = 10;
/** Ab dieser Zahl gilt die internationale Beachtung als ausreichendes Indiz für die unbeaufsichtigte Freigabe (zusätzlich zur Begründung). */
export const SITELINKS_AUTO_FROM = 25;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Typische Begründungen, die NICHT genügen (Bekanntheit, Medienecho, Rekord). */
const WEAK_REASON = /(medienecho|medial|bekannt(heit)?\b|beliebt|viral|schlagzeile|rekord(?! .{0,40}(erst|zum ersten))|aufsehen|sorgte für|trend)/i;

export interface SignificanceCheck {
  /** ok = unbeaufsichtigt zulässig, zurueckgestellt = redaktionelle Prüfung, abgelehnt = aussortiert */
  result: "ok" | "zurueckgestellt" | "abgelehnt";
  reasons: string[];
}

/** Prüft Relevanz, Jahr und Bildbezug eines Kandidaten. Alles muss stimmen, damit das Ergebnis „ok“ ist. */
export function checkSignificance(b: Bedeutung | null | undefined, opts: { hasImage?: boolean } = {}): SignificanceCheck {
  const rejected: string[] = [];
  const hold: string[] = [];
  if (!b) return { result: "zurueckgestellt", reasons: ["Keine Bewertung der weltgeschichtlichen Bedeutung vorhanden."] };

  if (b.sitelinks !== undefined && b.sitelinks < SITELINKS_REJECT_BELOW) {
    rejected.push(`Relevanzprüfung: Nur ${b.sitelinks} Wikipedia-Sprachversionen – kaum internationale Beachtung, kein belegter weltgeschichtlicher Rang.`);
  }
  if (b.verdict === "nicht_weltgeschichtlich") {
    rejected.push(`Relevanzprüfung: Keine weltgeschichtliche Bedeutung${b.reason ? ` (${b.reason.trim()})` : ""}.`);
  } else if (b.verdict === "unklar") {
    hold.push("Relevanzprüfung: Weltgeschichtliche Bedeutung nicht eindeutig belegt – redaktionelle Prüfung.");
  } else {
    const n = words(b.reason ?? "");
    if (n < 8) hold.push("Relevanzprüfung: Es fehlt die konkrete Begründung in einem Satz (was hat sich verändert?).");
    else if (WEAK_REASON.test(b.reason)) hold.push("Relevanzprüfung: Die Begründung beruht auf Bekanntheit, Medienecho oder Rekord, nicht auf belegten Folgen.");
    if (b.sitelinks === undefined) hold.push("Relevanzprüfung: Internationale Beachtung (Sprachversionen) nicht ermittelt – kein objektives Indiz für die unbeaufsichtigte Freigabe.");
    if (b.crossBorderEffects === false) hold.push("Relevanzprüfung: Keine belegten Folgen über Ländergrenzen hinweg; Wendepunkt von weltweiter Bedeutung müsste redaktionell begründet werden.");
    if (b.sitelinks !== undefined && b.sitelinks >= SITELINKS_REJECT_BELOW && b.sitelinks < SITELINKS_AUTO_FROM) {
      hold.push(`Relevanzprüfung: Nur ${b.sitelinks} Sprachversionen – internationale Tragweite redaktionell bestätigen.`);
    }
  }

  if (b.yearUnambiguous === false) hold.push("Jahr nicht eindeutig belegt (Quellen widersprechen sich oder Angabe mehrdeutig) – redaktionelle Prüfung.");
  if (opts.hasImage !== false) {
    if (b.imageSpecificity === "generisch") rejected.push("Bildprüfung: Das Foto ist austauschbar (z. B. beliebiges Wahllokal, Wahlurne, Pressepodium) und zeigt nicht das Ereignis, seine unmittelbaren Folgen oder einen unverwechselbaren Moment.");
    else if (b.imageSpecificity === "unklar") hold.push("Bildprüfung: Bezug des Fotos zum konkreten Ereignis nicht eindeutig – redaktionelle Prüfung.");
  }

  if (rejected.length) return { result: "abgelehnt", reasons: [...rejected, ...hold] };
  if (hold.length) return { result: "zurueckgestellt", reasons: hold };
  return { result: "ok", reasons: [] };
}

/** Für die Redaktion (Freigabe): Was fehlt, bevor ein Ereignis freigegeben werden darf? Demo-Inhalte sind ausgenommen (aufrufende Stelle). */
export function significanceProblemsForApproval(b: Partial<Bedeutung> | null | undefined): string[] {
  const p: string[] = [];
  if (!b) return ["Weltgeschichtliche Bedeutung ist nicht erfasst (ein konkreter Satz, was sich verändert hat)."];
  if (b.verdict === "nicht_weltgeschichtlich") p.push("Das Ereignis wurde als nicht weltgeschichtlich eingestuft und darf nicht freigegeben werden.");
  else if (b.verdict !== "weltgeschichtlich") p.push("Die weltgeschichtliche Bedeutung ist nicht bestätigt.");
  if (words(b.reason ?? "") < 8) p.push("Die Begründung der weltgeschichtlichen Bedeutung fehlt oder ist zu kurz (ein konkreter Satz mit mindestens 8 Wörtern).");
  else if (WEAK_REASON.test(b.reason ?? "")) p.push("Die Begründung beruht auf Bekanntheit, Medienecho oder Rekord: Nennen Sie die belegten Folgen.");
  if (b.imageSpecificity === "generisch") p.push("Das Foto ist nicht ereignisspezifisch (austauschbares Motiv).");
  if (b.yearUnambiguous === false) p.push("Das Jahr ist nicht eindeutig belegt.");
  return p;
}

export const VERDICT_LABEL: Record<SignificanceVerdict, string> = {
  weltgeschichtlich: "Weltgeschichtlich bedeutsam",
  nicht_weltgeschichtlich: "Nicht weltgeschichtlich",
  unklar: "Bedeutung unklar",
};
