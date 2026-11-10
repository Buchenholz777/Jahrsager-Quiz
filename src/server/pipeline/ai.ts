import { CATEGORY_KEYS, REGIONS } from "@/lib/constants";
import { findTimeHints } from "@/lib/hints";

export interface CardDraft {
  insufficient: boolean;
  category: string;
  difficulty: number;
  subcategory: string;
  tags: string[];
  region: string;
  country: string;
  topic_key: string;
  neutral_title: string;
  description: string;
  image_alt: string;
  public_title: string;
  explanation_what: string;
  explanation_why: string;
  explanation_detail: string;
  /** Weltgeschichtliche Bedeutung (Pflichtkriterium), nur aus dem Auszug begründet */
  significance?: {
    verdict: "weltgeschichtlich" | "nicht_weltgeschichtlich" | "unklar";
    reason: string;
    cross_border_effects: boolean;
    year_unambiguous: boolean;
  };
  image_check: {
    matches_event: "yes" | "no" | "unclear";
    /** ereignisspezifisch = zeigt das Ereignis, seine unmittelbaren Folgen oder einen unverwechselbaren Moment; generisch = austauschbares Motiv */
    specificity?: "ereignisspezifisch" | "generisch" | "unklar";
    persons_visible: boolean;
    caption_or_date_visible: boolean;
    quality_ok: boolean;
    note: string;
  };
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Formale Prüfung eines KI-Entwurfs. Gibt Probleme zurück (leer = formal in Ordnung). */
export function validateDraft(d: CardDraft, year: number): string[] {
  const p: string[] = [];
  const d1 = words(d.description ?? "");
  if (d1 < 30 || d1 > 55) p.push(`Rätselbeschreibung hat ${d1} Wörter (30–55 erforderlich).`);
  const w2 = words(d.explanation_what ?? "");
  if (w2 < 60 || w2 > 100) p.push(`Auflösung hat ${w2} Wörter (60–100 erforderlich).`);
  if (words(d.explanation_why ?? "") < 12) p.push("„Warum bedeutsam“ ist zu kurz.");
  if (words(d.explanation_detail ?? "") < 8) p.push("„Ein Detail“ ist zu kurz.");
  if (!CATEGORY_KEYS.includes(d.category as never)) p.push(`Ungültiges Themenfeld: ${d.category}`);
  if (![1, 2, 3].includes(d.difficulty)) p.push("Ungültiger Schwierigkeitsgrad.");
  if (!(d.region in REGIONS)) p.push(`Ungültige Region: ${d.region}`);
  if (!Array.isArray(d.tags) || d.tags.length < 2) p.push("Mindestens zwei Schlagwörter erforderlich.");
  if (!d.topic_key?.trim()) p.push("Themenschlüssel fehlt.");
  for (const [label, text] of [["Titel", d.neutral_title], ["Beschreibung", d.description], ["Alternativtext", d.image_alt]] as const) {
    if (!text?.trim()) p.push(`${label} fehlt.`);
    for (const h of findTimeHints(text ?? "")) p.push(`${label}: Zeitlicher Hinweis „${h.match}“.`);
    if (new RegExp(`\\b${year}\\b`).test(text ?? "")) p.push(`${label} nennt das Jahr.`);
  }
  if (!d.public_title?.trim()) p.push("Titel der Auflösung fehlt.");
  return p;
}

const SYSTEM = `Du bist Redakteur eines historischen Bilderquiz. Du erhältst einen Wikipedia-Auszug (die EINZIGE zulässige Faktenbasis), das belegte Ereignisdatum und ein Foto.
Regeln: Verwende ausschließlich Informationen aus dem Auszug und dem sichtbaren Bildinhalt. Erfinde nichts. Reicht der Auszug für die geforderten Texte nicht aus, setze "insufficient": true.
Vor dem Tipp sichtbare Felder (neutral_title, description, image_alt) dürfen KEINE Jahreszahl, kein Datum, keinen Jahrzehnt- oder Jahrhundertbezug und keine zeitlich verräterischen Epochennamen enthalten.
description: 30-55 Wörter, beschreibt neutral, was auf dem Bild zu sehen ist und worum es geht. explanation_what: 60-100 Wörter, Auflösung "Was geschah?". explanation_why: Bedeutung. explanation_detail: ein interessantes Detail aus dem Auszug.
category aus: ${CATEGORY_KEYS.join(", ")}. difficulty: 1 (bekannt), 2 (mittel), 3 (knifflig). Nutze Raumfahrt NUR für echte Raumfahrt-/Astronomieereignisse. region aus: ${Object.keys(REGIONS).join(", ")}; country: deutscher Ländername oder leer; subcategory: kurzer Begriff; tags: 2-5 kleingeschriebene Schlagwörter; topic_key: kurzer Schlüssel für das konkrete Thema (z. B. "apollo", "olympia-1936"), damit ähnliche Ereignisse erkannt werden.
significance: Prüfe streng, ob das Ereignis Weltgeschichte geschrieben hat. Nur ein konkretes Ereignis mit eindeutigem Jahr, das nachweisbare Folgen über Ländergrenzen hinweg hatte oder als historischer Wendepunkt von weltweiter Bedeutung gilt, ist "weltgeschichtlich". Ein Ereignis darf an einem einzigen Ort stattgefunden haben. NICHT weltgeschichtlich ("nicht_weltgeschichtlich"): routinemäßige Wahlen, Pressekonferenzen, gewöhnliche Regierungswechsel, gewöhnliche Stürme/Hochwasser/Wetterrekorde ohne internationale Tragweite, lokale Rekorde, kurzfristiges Medienecho, reine Bekanntheit. Reicht der Auszug für ein sicheres Urteil nicht, setze "unklar". reason: EIN konkreter Satz (12-40 Wörter) aus dem Auszug, was sich durch das Ereignis verändert hat oder welchen bleibenden Meilenstein es markiert; keine Floskeln wie "bekannt" oder "viel beachtet". cross_border_effects: true nur, wenn der Auszug Folgen über Ländergrenzen hinweg belegt. year_unambiguous: false, wenn der Auszug widersprüchliche oder mehrdeutige Jahresangaben enthält.
image_check: Beurteile ehrlich, ob das Foto das Ereignis zeigt ("yes"/"no"/"unclear"), ob Personen erkennbar sind, ob Beschriftung oder Datum im Bild das Jahr verrät, ob die Qualität reicht. specificity: "ereignisspezifisch", wenn das Foto das Ereignis, seine unmittelbaren Folgen oder einen unverwechselbaren Moment daraus zeigt; "generisch", wenn das Motiv austauschbar wäre (beliebiges Wahllokal, Wahlurne, Pressepodium, Menschenmenge ohne Bezug, Landschaft); sonst "unklar".
Antworte NUR mit einem JSON-Objekt mit genau diesen Feldern: insufficient, category, difficulty, subcategory, tags, region, country, topic_key, neutral_title, description, image_alt, public_title, explanation_what, explanation_why, explanation_detail, significance{verdict, reason, cross_border_effects, year_unambiguous}, image_check{matches_event, specificity, persons_visible, caption_or_date_visible, quality_ok, note}.`;

export async function draftCard(
  input: { title: string; date: string; extract: string; imageJpegBase64: string },
  apiKey: string,
  model = process.env.PIPELINE_MODEL ?? "claude-sonnet-5-5",
): Promise<CardDraft> {
  // Bis zu zwei Versuche: manchmal antwortet das Modell mit Erklärtext, abgeschnittener Ausgabe oder ungültigem JSON.
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        model,
        max_tokens: 3500,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: input.imageJpegBase64 } },
              {
                type: "text",
                text: `Ereignis (Wikipedia-Titel): ${input.title}\nBelegtes Datum (Wikidata): ${input.date}\n\nWikipedia-Auszug:\n${input.extract.slice(0, 6000)}${attempt ? "\n\nWICHTIG: Antworte ausschließlich mit dem vollständigen JSON-Objekt, ohne Einleitung, ohne Markdown." : ""}`,
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Claude-API: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const body = (await res.json()) as { stop_reason?: string; content: { type: string; text?: string }[] };
    const text = body.content.find((c) => c.type === "text")?.text ?? "";
    const m = /\{[\s\S]*\}/.exec(text);
    if (m) {
      try {
        return JSON.parse(m[0]) as CardDraft;
      } catch {
        lastError = "ungültiges JSON";
      }
    } else {
      lastError = `kein JSON (stop_reason ${body.stop_reason ?? "?"}, Anfang: ${text.slice(0, 80).replace(/\s+/g, " ")})`;
    }
  }
  throw new Error(`Claude-Antwort unbrauchbar: ${lastError}`);
}
