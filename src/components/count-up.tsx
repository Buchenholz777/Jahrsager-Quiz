"use client";

import { useEffect, useRef, useState } from "react";
import { formatPoints } from "@/lib/scoring";

/** Kurzes Hochzählen (ca. 0,9 s). Bei "weniger Bewegung" erscheint sofort der Endwert. */
export function CountUp({ to, ms = 900 }: { to: number; ms?: number }) {
  const [v, setV] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || to === 0) {
      raf.current = requestAnimationFrame(() => setV(to));
      return () => {
        if (raf.current) cancelAnimationFrame(raf.current);
      };
    }
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [to, ms]);
  return (
    <>
      <span aria-hidden="true">{formatPoints(v)}</span>
      <span className="sr-only">{formatPoints(to)}</span>
    </>
  );
}
