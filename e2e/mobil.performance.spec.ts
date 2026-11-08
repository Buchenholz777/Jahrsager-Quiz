import { expect, test, type Page } from "@playwright/test";

/**
 * Messung von LCP und CLS im Produktions-Build (Smartphone-Emulation, localhost, KEINE Netzwerkdrosselung).
 * Die Werte sind nur ein Plausibilitätstest gegen grobe Fehler – für belastbare Zahlen sind Messungen mit
 * gedrosseltem Netz auf echten Geräten (z. B. PageSpeed Insights / Lighthouse CI) nötig.
 */
async function vitals(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ lcp: number; cls: number }>((resolve) => {
        let lcp = 0;
        let cls = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) lcp = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve({ lcp, cls }), 2500);
      }),
  );
}

for (const path of ["/", "/spielen"]) {
  test(`Web Vitals ${path} (lokal, Smartphone-Emulation)`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("load");
    const v = await vitals(page);
    console.log(`  [Messung lokal] ${path}: LCP ${Math.round(v.lcp)} ms, CLS ${v.cls.toFixed(3)}`);
    expect(v.lcp).toBeLessThanOrEqual(2500);
    expect(v.cls).toBeLessThanOrEqual(0.1);
  });
}
