"use client";

import { useEffect } from "react";
import { once, trackEvent, type EventParams } from "@/lib/tracking";

/** Löst beim ersten Anzeigen einer Seite genau ein (einwilligungsabhängiges) Ereignis aus. */
export function PageEvent({ name, params = {} }: { name: string; params?: EventParams }) {
  useEffect(() => {
    const t = setTimeout(() => once(`jsq_pe_${name}_${location.pathname}`, () => trackEvent(name, params)), 600); // nach der Einwilligungsprüfung
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  return null;
}
