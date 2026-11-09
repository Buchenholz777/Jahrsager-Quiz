/**
 * Einwilligungsgesteuertes Tracking (Google Analytics 4 / Google Tag Manager, Consent Mode v2, „Basic“-Variante).
 * Ohne konfigurierte ID passiert nichts: kein Skript, kein Banner, keine Anfragen. Mit ID wird nichts von Google geladen,
 * bevor der Besucher der Statistik zugestimmt hat. Die Messung ist vollständig optional – das Spiel funktioniert ohne.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";
/** GTM hat Vorrang (zentrale Verwaltung); sonst direkte GA4-Einbindung. Nie beides gleichzeitig (keine doppelte Messung). */
export const TRACKING_MODE: "gtm" | "ga" | "off" = GTM_ID ? "gtm" : GA_ID ? "ga" : "off";
export const trackingConfigured = () => TRACKING_MODE !== "off";

export const CONSENT_KEY = "jahrsager_consent_v1";
export const CONSENT_OPEN_EVENT = "jahrsager-consent-open";
export type ConsentState = { analytics: boolean; at: string };

export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as ConsentState;
    return typeof v.analytics === "boolean" ? v : null;
  } catch {
    return null;
  }
}
export function writeConsent(analytics: boolean): ConsentState {
  const v = { analytics, at: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(v));
  } catch {
    /* Speicher blockiert: Entscheidung gilt nur für diese Seite */
  }
  return v;
}

let granted = false;
export const setTrackingGranted = (v: boolean) => {
  granted = v;
};
export const isTrackingGranted = () => granted;

/** Standard-gtag-Funktion (schreibt „arguments“-Objekte in die dataLayer, wie von Google gefordert). */
export function gtag(...args: unknown[]): void {
  void args;
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

export type EventParams = Record<string, string | number | boolean>;

/** Sendet ein Ereignis – nur mit Einwilligung und konfigurierter ID. Keine personenbezogenen Daten übergeben. */
export function trackEvent(name: string, params: EventParams = {}): void {
  if (!granted || typeof window === "undefined" || TRACKING_MODE === "off") return;
  if (TRACKING_MODE === "gtm") {
    (window.dataLayer = window.dataLayer || []).push({ event: name, ...params });
  } else {
    gtag("event", name, params);
  }
}

/** Grobe Punktklasse statt exakter Werte (datensparsam). */
export function scoreBucket(points: number): string {
  if (points >= 5000) return "5000";
  const lo = Math.floor(Math.max(0, points) / 1000) * 1000;
  return `${lo}-${lo + 999}`;
}

/** Führt fn höchstens einmal je Schlüssel pro Browser-Sitzung aus (verhindert doppelte Ereignisse bei Neuladen/Strict Mode). */
export function once(key: string, fn: () => void): void {
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* ohne Sitzungsspeicher: lieber einmal zu viel verhindern als doppelt senden */
    return;
  }
  fn();
}
