"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import type { TodayStatus } from "@/lib/game-types";
import { buttonVariants } from "@/components/ui/button";
import { sendMeasurement } from "@/components/beacon";
import { trackEvent } from "@/lib/tracking";

function useCountdown(iso: string | null) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!iso) return;
    const tick = () => {
      const ms = new Date(iso).getTime() - Date.now();
      if (ms <= 0) return setText("jetzt");
      const h = Math.floor(ms / 3.6e6);
      const m = Math.floor((ms % 3.6e6) / 6e4);
      setText(h > 0 ? `${h} Std. ${m} Min.` : `${m} Min.`);
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [iso]);
  return text;
}

const deviceClass = () => (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches ? "mobil" : "desktop");

/**
 * Dominanter Spielstart auf dunklem Grund. Führt ohne Zwischenschritt direkt zur echten Partie:
 * „Jetzt Tagesrätsel spielen“ → „Spiel fortsetzen“ (nächste offene Runde) → „Heutiges Ergebnis ansehen“.
 * Ohne JavaScript bleibt der Standard-Link zu /spielen.
 */
export function HomeCta({ variant }: { variant: string }) {
  const [s, setS] = useState<TodayStatus | null>(null);
  useEffect(() => {
    let off = false;
    fetch("/api/spiel/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !off && d && setS(d.status))
      .catch(() => undefined);
    return () => {
      off = true;
    };
  }, []);
  const countdown = useCountdown(s?.state === "abgeschlossen" ? s.nextResetAt : null);

  const done = s?.state === "abgeschlossen";
  const track = () => {
    sendMeasurement("cta_click", { variant, device: deviceClass() });
    trackEvent("home_cta_click", { page_type: "home", cta_state: s?.state ?? "unbekannt", device: deviceClass() });
  };
  const cta = buttonVariants({ variant: "sun", size: "lg", className: "w-full min-h-[3.75rem] text-[1.15rem] sm:w-auto sm:px-9" });

  return (
    <div>
      {s && !s.hasPack ? (
        <Link href="/archiv" onClick={track} className={cta}>
          Frühere Rätsel spielen <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      ) : done ? (
        <Link href={`/ergebnis?spiel=${s!.gameId}`} onClick={track} className={cta}>
          Heutiges Ergebnis ansehen <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      ) : (
        <Link href="/spielen" onClick={track} className={cta} data-testid="cta-play">
          {s?.state === "laufend" ? "Spiel fortsetzen" : "Jetzt Tagesrätsel spielen"}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      )}
      <p className="mt-3 text-sm font-medium text-paper/85">
        {done ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            Morgen gibt es neue Ereignisse{countdown ? ` – in ${countdown}` : ""}
          </span>
        ) : s?.state === "laufend" ? (
          `Weiter mit Ereignis ${s.answered + 1} von 5`
        ) : (
          "Kostenlos · Ohne Anmeldung · Jeden Tag neu"
        )}
      </p>
      {s?.openOlder && (
        <p className="mt-2 text-sm">
          <Link href={`/archiv/${s.openOlder.number}`} className="font-semibold text-sun underline decoration-2 underline-offset-4">
            Tagesrätsel #{s.openOlder.number} noch zu Ende spielen
          </Link>
        </p>
      )}
    </div>
  );
}
