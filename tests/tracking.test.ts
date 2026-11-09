import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Tracking ist nur mit konfigurierter ID aktiv: ID per Umgebungsvariable setzen und Modul frisch laden.
async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const k of ["NEXT_PUBLIC_GA_MEASUREMENT_ID", "NEXT_PUBLIC_GTM_ID"]) delete process.env[k];
  Object.assign(process.env, env);
  return import("@/lib/tracking");
}

describe("Einwilligungsgesteuertes Tracking", () => {
  beforeEach(() => {
    (globalThis as unknown as { window: { dataLayer: unknown[] } }).window = { dataLayer: [] };
  });
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    delete process.env.NEXT_PUBLIC_GTM_ID;
  });

  it("sendet ohne konfigurierte ID nichts (kein Banner nötig)", async () => {
    const t = await load({});
    expect(t.trackingConfigured()).toBe(false);
    t.setTrackingGranted(true);
    t.trackEvent("daily_quiz_started");
    expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([]);
  });

  it("sendet ohne Einwilligung nichts und mit Einwilligung genau das Ereignis", async () => {
    const t = await load({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-TEST123" });
    expect(t.TRACKING_MODE).toBe("ga");
    t.trackEvent("home_cta_click", { page_type: "home" });
    expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toHaveLength(0);
    t.setTrackingGranted(true);
    t.trackEvent("home_cta_click", { page_type: "home" });
    const dl = (window as unknown as { dataLayer: ArrayLike<unknown>[] }).dataLayer;
    expect(dl).toHaveLength(1);
    expect(Array.from(dl[0])).toEqual(["event", "home_cta_click", { page_type: "home" }]);
    t.setTrackingGranted(false); // Widerruf
    t.trackEvent("home_cta_click");
    expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toHaveLength(1);
  });

  it("bevorzugt GTM und verwendet nie beide Wege gleichzeitig", async () => {
    const t = await load({ NEXT_PUBLIC_GTM_ID: "GTM-TEST", NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-TEST123" });
    expect(t.TRACKING_MODE).toBe("gtm");
    t.setTrackingGranted(true);
    t.trackEvent("daily_quiz_completed", { score_bucket: "3000-3999" });
    expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([{ event: "daily_quiz_completed", score_bucket: "3000-3999" }]);
  });

  it("gruppiert Punkte grob", async () => {
    const t = await load({});
    expect(t.scoreBucket(0)).toBe("0-999");
    expect(t.scoreBucket(3450)).toBe("3000-3999");
    expect(t.scoreBucket(5000)).toBe("5000");
  });
});
