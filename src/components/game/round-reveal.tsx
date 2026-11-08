"use client";

import { ArrowRight, BookOpen, Lightbulb, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import type { RoundState } from "@/lib/game-types";
import { describeDifference } from "@/lib/scoring";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/count-up";
import { MiniTimeline } from "./mini-timeline";
import { PhotoFrame } from "./photo-frame";
import { ReportDialog } from "./report-dialog";

/** Auflösung einer Runde: großes Jahr, Tipp, Abstand, Punkte, Zeitachse und redaktionelle Wissenskarte. */
export function RoundReveal({
  round,
  gameId,
  isLast,
  onNext,
}: {
  round: RoundState;
  total?: number;
  gameId: string;
  isLast: boolean;
  onNext: () => void;
}) {
  const r = round.result!;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [round.position]);
  const exact = r.difference === 0;

  return (
    <section aria-labelledby="aufloesung-titel" className="animate-rise">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-ink-soft">
        Auflösung
      </p>
      <h1 id="aufloesung-titel" ref={heading} tabIndex={-1} className="mt-1 text-[1.75rem] font-bold leading-tight outline-none sm:text-4xl">
        {r.reveal.publicTitle}
      </h1>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
        <div>
          <PhotoFrame
            image={round.question.image}
            alt={round.question.alt}
            credit={r.reveal.creditFull || round.question.creditShort}
            license={r.reveal.license}
            licenseUrl={r.reveal.licenseUrl}
            compact
          />
        </div>

        <div className="space-y-5">
          {/* Ergebnis-Karte: dunkler Kopf mit gelben Zahlen, heller Fuß mit Zeitachse */}
          <div className="overflow-hidden rounded-card bg-ink text-paper shadow-card">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 p-5">
              <div>
                <p className="text-sm font-medium text-paper/80">Richtiges Jahr</p>
                <p className="animate-pop font-display text-[4.25rem] font-extrabold leading-none tabular-nums text-sun sm:text-7xl" data-testid="correct-year">
                  {r.correct}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-paper/80">{r.guess === null ? "Kein Tipp" : `Dein Tipp: ${r.guess}`}</p>
                <p className="mt-1 font-display text-4xl font-extrabold tabular-nums leading-none">
                  +<CountUp to={r.points} />
                </p>
                <p className="text-sm font-medium text-paper/80">Punkte</p>
              </div>
            </div>
            <div className="bg-card p-4 text-ink">
              <p
                className={
                  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold " +
                  (exact ? "bg-good-soft text-good" : r.difference === null ? "bg-paper-2 text-ink-soft" : "bg-sun-soft text-ink ring-1 ring-sun")
                }
              >
                {exact && <Sparkles className="size-4" aria-hidden="true" />}
                {describeDifference(r.difference)}
              </p>
              <MiniTimeline className="mt-3" correct={r.correct} guess={r.guess} />
            </div>
          </div>

          {/* Wissenskarte */}
          <div className="space-y-4 rounded-card border border-line bg-card p-5 shadow-card">
            <Block icon={<BookOpen className="size-5" />} title="Was geschah?">
              {r.reveal.what}
            </Block>
            <Block icon={<Sparkles className="size-5" />} title="Warum war es wichtig?">
              {r.reveal.why}
            </Block>
            <Block icon={<Lightbulb className="size-5" />} title="Interessantes Detail">
              {r.reveal.detail}
            </Block>
          </div>

          {r.reveal.isDemo && (
            <p className="rounded-xl border border-sun bg-sun-soft p-3 text-sm text-ink">
              <Badge tone="dark" className="mr-2">
                Demo
              </Badge>
              Demo-Inhalt: Text und Bild sind noch nicht redaktionell freigegeben.
            </p>
          )}

          <details className="rounded-2xl border border-line bg-card p-4 text-sm">
            <summary className="min-h-6 cursor-pointer font-semibold">Quellen und Bildnachweis</summary>
            <div className="mt-3 space-y-3 text-ink-soft">
              <div>
                <p className="font-semibold text-ink">Faktenquellen</p>
                <ul className="mt-1 list-disc pl-5">
                  {r.reveal.sources.map((s, i) => (
                    <li key={i}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-sun decoration-2 underline-offset-2">
                          {s.label}
                        </a>
                      ) : (
                        s.label
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-ink">Bild</p>
                <p>{r.reveal.creditFull}</p>
                <p>
                  Lizenz:{" "}
                  {r.reveal.licenseUrl ? (
                    <a href={r.reveal.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-sun decoration-2 underline-offset-2">
                      {r.reveal.license}
                    </a>
                  ) : (
                    r.reveal.license
                  )}
                </p>
                {r.reveal.sourceUrl.startsWith("http") && (
                  <p>
                    <a href={r.reveal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-sun decoration-2 underline-offset-2">
                      Originalfundstelle
                    </a>
                  </p>
                )}
              </div>
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button size="lg" onClick={onNext} className="w-full sm:w-auto sm:min-w-60">
              {isLast ? "Ergebnis ansehen" : "Nächstes Ereignis"}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
            <ReportDialog eventId={round.eventId} gameId={gameId} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-sun text-ink" aria-hidden="true">
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
