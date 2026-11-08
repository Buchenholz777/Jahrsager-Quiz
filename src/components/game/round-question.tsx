"use client";

import { ArrowRight, HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RoundState } from "@/lib/game-types";
import { Button } from "@/components/ui/button";
import { PhotoFrame } from "./photo-frame";
import { YearPicker } from "./year-picker";

/** Aufgabe einer Runde. Mobil: Bild → Titel/Beschreibung → Jahreseingabe (DOM-Reihenfolge bleibt auf allen Größen gleich). */
export function RoundQuestion({
  round,
  busy,
  error,
  onGuess,
  onResolve,
  onRetry,
}: {
  round: RoundState;
  total: number;
  busy: boolean;
  error: string | null;
  onGuess: (year: number) => void;
  onResolve: () => void;
  onRetry: () => void;
}) {
  const [year, setYear] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const q = round.question;

  useEffect(() => {
    heading.current?.focus({ preventScroll: false });
  }, []);

  return (
    <section aria-labelledby="runde-titel" className="animate-rise grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <PhotoFrame image={q.image} alt={q.alt} credit={q.creditShort} license={q.license} licenseUrl={q.licenseUrl} priority={round.position === 1} />
      </div>
      <div>
        <h1 id="runde-titel" ref={heading} tabIndex={-1} className="text-[1.75rem] font-bold leading-tight outline-none sm:text-4xl">
          {q.title}
        </h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink">{q.description}</p>

        <form
          className="mt-6 rounded-card border border-line bg-card p-4 shadow-card sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (year !== null && !busy) onGuess(year);
          }}
        >
          <p className="mb-4 font-display text-2xl font-bold leading-tight">In welchem Jahr war das?</p>
          <YearPicker value={year} onChange={setYear} disabled={busy} />
          <Button type="submit" size="lg" className="mt-3 w-full" disabled={year === null || busy}>
            {busy ? "Wird eingeloggt …" : "Jahr einloggen"}
            {!busy && <ArrowRight className="size-5" aria-hidden="true" />}
          </Button>
          <p className="mt-2 text-center text-sm text-ink-soft">
            {year === null ? "Schritt 1: Jahr wählen · Schritt 2: einloggen" : `Du tippst auf ${year}. Bestätige mit „Jahr einloggen“.`}
          </p>
          <div aria-live="polite" className="mt-1">
            {error && (
              <p role="alert" className="rounded-xl border border-sun bg-sun-soft p-3 text-sm font-semibold text-ink">
                {error}{" "}
                <button type="button" onClick={onRetry} className="font-bold underline underline-offset-2">
                  Erneut versuchen
                </button>
              </p>
            )}
          </div>
        </form>

        <div className="mt-3">
          {confirming ? (
            <div className="animate-pop rounded-2xl border border-line bg-card p-4" role="group" aria-label="Auflösen ohne Tipp bestätigen">
              <p className="font-medium">Ohne Tipp auflösen? Diese Runde ergibt dann 0 Punkte, du siehst aber die Geschichte dahinter.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" disabled={busy} onClick={onResolve}>
                  Ja, auflösen
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              <HelpCircle className="size-4" aria-hidden="true" /> Auflösen ohne Tipp
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
