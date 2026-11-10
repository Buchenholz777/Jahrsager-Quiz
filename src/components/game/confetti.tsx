"use client";

import { useEffect, useState } from "react";

const COLORS = ["#FFB34D", "#1E746D", "#16283D", "#F6A13A", "#7FC8C0", "#c1121f"];

/** Kurzes Konfetti (einmal beim ersten Auflösen eines Volltreffers). Bei reduzierter Bewegung wird nichts gerendert. */
export function Confetti() {
  const [show, setShow] = useState(false);
  const [pieces] = useState(() =>
    Array.from({ length: 36 }, (_, i) => ({
      left: Math.round(((i * 37) % 100) + (i % 3)) % 100,
      color: COLORS[i % COLORS.length],
      delay: (i % 9) * 0.07,
      dur: 1.8 + (i % 5) * 0.2,
      dx: ((i % 7) - 3) * 24,
    })),
  );
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const on = setTimeout(() => setShow(true), 0);
    const off = setTimeout(() => setShow(false), 3200);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, []);
  if (!show) return null;
  return (
    <div aria-hidden="true" data-testid="confetti" className="confetti-layer pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece" style={{ left: `${p.left}%`, background: p.color, ["--delay" as string]: `${p.delay}s`, ["--dur" as string]: `${p.dur}s`, ["--dx" as string]: `${p.dx}px` }} />
      ))}
    </div>
  );
}
