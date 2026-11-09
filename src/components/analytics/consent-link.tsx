"use client";

import { CONSENT_OPEN_EVENT, trackingConfigured } from "@/lib/tracking";

/** „Cookie-Einstellungen“ im Footer: öffnet die Einwilligungsauswahl erneut (nur sichtbar, wenn Tracking konfiguriert ist). */
export function ConsentLink({ className }: { className?: string }) {
  if (!trackingConfigured()) return null;
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}>
      Cookie-Einstellungen
    </button>
  );
}
