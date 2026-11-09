"use client";

import { usePathname } from "next/navigation";
import { activeHeroVariant } from "@/lib/experiments";
import { useEffect } from "react";
import { routeGroup } from "@/lib/route-group";

function send(name: string, props?: Record<string, string | number>) {
  try {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return; // Datenschutzsignale respektieren
    const body = JSON.stringify({ name, props });
    fetch("/api/messung", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  } catch {
    /* Messung ist optional */
  }
}
export { send as sendMeasurement };

/**
 * Datensparsame Messung ohne Cookies/Kennungen: Startseitenaufruf und – einmal pro Sitzung – eine grobe
 * Herkunftskategorie (Suche, Teilen, sozial, direkt). Der Referrer-Host selbst wird nicht übertragen.
 */
export function Beacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    send("page_view", { path: routeGroup(pathname), device: window.matchMedia("(max-width: 767px)").matches ? "mobil" : "desktop" });
    if (pathname === "/") send("home_view", { variant: activeHeroVariant(), device: window.matchMedia("(max-width: 767px)").matches ? "mobil" : "desktop" });
    try {
      if (sessionStorage.getItem("zs_landed")) return;
      sessionStorage.setItem("zs_landed", "1");
    } catch {
      return;
    }
    const ref = document.referrer;
    const own = location.hostname;
    let channel = "direkt";
    if (new URLSearchParams(location.search).get("utm_source") === "share") channel = "teilen";
    else if (ref) {
      try {
        const h = new URL(ref).hostname.toLowerCase();
        if (h === own) channel = "direkt";
        else if (/(^|\.)(google|bing|duckduckgo|ecosia|yahoo|startpage|qwant)\./.test(h)) channel = "suche";
        else if (/(whatsapp|facebook|instagram|t\.co|twitter|x\.com|reddit|telegram|tiktok|linkedin|mastodon|bsky)/.test(h)) channel = "sozial";
        else channel = "sonstige";
      } catch {
        channel = "sonstige";
      }
    }
    send("landing", { channel, path: pathname.startsWith("/geschichte/") ? "/geschichte/[slug]" : pathname });
  }, [pathname]);
  return null;
}
