/**
 * Vorbereitung für spätere A/B-Tests der Startseite.
 * Aktuell gibt es nur die Variante „geschichte“ (dunkler Hero mit historischer Bildkomposition).
 * Weitere Varianten werden hier eingetragen und in `src/app/page.tsx` ausgewählt; die Variante wird bei
 * Startseitenaufruf und Klick auf den Spielstart datensparsam (ohne Personenbezug) mitgemessen.
 * Es werden keine Zuweisungs-Cookies gesetzt; eine Zuweisung kann später serverseitig/per Edge erfolgen.
 */
export const HERO_VARIANTS = ["geschichte"] as const;
export type HeroVariant = (typeof HERO_VARIANTS)[number];

export function activeHeroVariant(): HeroVariant {
  const v = process.env.NEXT_PUBLIC_HERO_VARIANT;
  return (HERO_VARIANTS as readonly string[]).includes(v ?? "") ? (v as HeroVariant) : HERO_VARIANTS[0];
}
