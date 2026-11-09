"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { sendMeasurement } from "@/components/beacon";
import {
  CONSENT_OPEN_EVENT,
  GA_ID,
  GTM_ID,
  TRACKING_MODE,
  gtag,
  once,
  readConsent,
  setTrackingGranted,
  trackEvent,
  trackingConfigured,
  writeConsent,
  type ConsentState,
} from "@/lib/tracking";

declare global {
  interface Window {
    __jsqTrackingLoaded?: boolean;
  }
}

function setConsentMode(analytics: boolean) {
  gtag("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

/** Lädt Google erst nach Einwilligung (Basic Consent Mode). */
function loadGoogle() {
  if (window.__jsqTrackingLoaded) return;
  window.__jsqTrackingLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  if (TRACKING_MODE === "gtm") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  } else {
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    gtag("js", new Date());
    gtag("config", GA_ID, { send_page_view: false }); // Seitenaufrufe werden unten genau einmal je Navigation gesendet
  }
  document.head.appendChild(s);
}

function deleteGoogleCookies() {
  const names = document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n === "_gid" || n.startsWith("_ga") || n.startsWith("_gat"));
  const host = location.hostname;
  const parts = host.split(".");
  const domains = [host, "." + host, parts.length > 2 ? "." + parts.slice(-2).join(".") : ""].filter(Boolean);
  for (const n of names) for (const d of domains) document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
}

/**
 * Einwilligungsabfrage und Google-Tracking. Rendert nichts und lädt nichts, solange keine GA-/GTM-ID konfiguriert ist.
 * Gleichwertige Schaltflächen „Alle ablehnen“ / „Alle akzeptieren“; Entscheidung jederzeit über „Cookie-Einstellungen“ änderbar.
 */
export function AnalyticsProvider() {
  const configured = trackingConfigured();
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [toggle, setToggle] = useState(false);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    // Standard: alles verweigert, bevor irgendein Google-Skript geladen wird.
    gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    const c = readConsent();
    queueMicrotask(() => {
      setConsent(c);
      setToggle(Boolean(c?.analytics));
      setOpen(c === null);
      if (c === null) once("jsq_consent_shown", () => sendMeasurement("consent_shown")); // anonymer Zähler (cookiefrei), nur beim automatischen Öffnen
    });
    const reopen = () => {
      setToggle(Boolean(readConsent()?.analytics));
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, [configured]);

  const apply = useCallback((analytics: boolean) => {
    sendMeasurement("consent", { choice: analytics ? "ja" : "nein" });
    setConsent(writeConsent(analytics));
    setToggle(analytics);
    setOpen(false);
    setDetails(false);
    setTrackingGranted(analytics);
    if (analytics) {
      setConsentMode(true);
      loadGoogle();
    } else {
      if (window.__jsqTrackingLoaded) setConsentMode(false); // Widerruf: Google sofort anweisen, nichts mehr zu speichern
      deleteGoogleCookies();
    }
  }, []);

  // Bereits erteilte Einwilligung beim Seitenaufruf anwenden.
  useEffect(() => {
    if (!configured || !consent?.analytics) return;
    setTrackingGranted(true);
    setConsentMode(true);
    loadGoogle();
  }, [configured, consent]);

  // Genau ein Seitenaufruf je Navigation (Next.js navigiert clientseitig).
  useEffect(() => {
    if (!configured || !consent?.analytics || lastPath.current === pathname) return;
    if (pathname.startsWith("/admin")) return;
    lastPath.current = pathname;
    trackEvent("page_view", { page_path: pathname, page_location: location.origin + pathname, page_title: document.title });
  }, [configured, consent, pathname]);

  if (!configured || !open || pathname.startsWith("/admin")) return null;
  return (
    <div role="dialog" aria-labelledby="consent-title" aria-describedby="consent-text" className="fixed inset-x-0 bottom-0 z-[100] border-t border-line bg-card p-4 shadow-pop sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md sm:rounded-card sm:border">
      <h2 id="consent-title" className="text-lg font-bold">
        Statistik und Datenschutz
      </h2>
      <p id="consent-text" className="mt-1 text-sm text-ink-soft">
        Mit deiner Zustimmung nutzen wir Google Analytics, um zu verstehen, wie JAHRSAGER genutzt wird. Das Spiel funktioniert genauso ohne Zustimmung. Du kannst deine Entscheidung jederzeit unter „Cookie-Einstellungen“ ändern.{" "}
        <Link href="/datenschutz" className="underline underline-offset-2">
          Datenschutz
        </Link>
      </p>
      {details && (
        <label className="mt-3 flex items-start gap-3 rounded-xl border border-line p-3 text-sm">
          <input type="checkbox" checked={toggle} onChange={(e) => setToggle(e.target.checked)} className="mt-0.5 size-5" />
          <span>
            <strong>Statistik (Google Analytics)</strong>
            <br />
            <span className="text-ink-soft">Anonymisierte Nutzungsdaten, keine Werbung, keine Personalisierung.</span>
          </span>
        </label>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => apply(false)} className="min-h-11 rounded-xl border-2 border-ink bg-card px-3 font-semibold text-ink hover:bg-paper">
          Alle ablehnen
        </button>
        <button type="button" onClick={() => apply(true)} className="min-h-11 rounded-xl border-2 border-ink bg-ink px-3 font-semibold text-paper hover:bg-ink-2">
          Alle akzeptieren
        </button>
        {details ? (
          <button type="button" onClick={() => apply(toggle)} className="col-span-2 min-h-11 rounded-xl border border-line px-3 font-semibold hover:bg-paper">
            Auswahl speichern
          </button>
        ) : (
          <button type="button" onClick={() => setDetails(true)} className="col-span-2 min-h-11 rounded-xl px-3 text-sm font-semibold underline underline-offset-2">
            Einstellungen
          </button>
        )}
      </div>
    </div>
  );
}
