"use client";

import { ArrowRight, BookOpen, Lightbulb, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RoundState } from "@/lib/game-types";
import { describeDeviation, resolutionAnnouncement } from "@/lib/timeline";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/count-up";
import { Confetti } from "./confetti";
import { ResultTimeline } from "./result-timeline";
import { PhotoFrame } from "./photo-frame";
import { ReportDialog } from "./report-dialog";

/** Auflösung einer Runde: großes Jahr, Tipp, Abstand, Punkte, Zeitachse und redaktionelle Wissenskarte. */
export function RoundReveal({
  round,
  gameId,
  isLast,
  onNext,
  celebrate = false,
}: {
  round: RoundState;
  /** true nur beim ersten Auflösen in dieser Sitzung (kein Konfetti beim Neuladen) */
  celebrate?: boolean;
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
  const dev = describeDeviation(r.guess, r.correct);
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setAnnounce(resolutionAnnouncement(r.guess, r.correct, r.points)), 50);
    return () => clearTimeout(t);
  }, [r.guess, r.correct, r.points, round.position]);
  const firstSource = r.reveal.sources.find((x) => x.url?.startsWith("http"));
  const firstSentence = (r.reveal.what.match(/^.*?[.!?](\s|$)/)?.[0] ?? r.reveal.what).trim();

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
          {/* Auflösung direkt an der Stelle der Eingabe: Zeitleiste bleibt, Tipp ist fixiert */}
          <div className="overflow-hidden rounded-card border border-line bg-card shadow-card" data-testid="reveal-card">
            <div className="p-4 sm:p-5">
              <ResultTimeline guess={r.guess} correct={r.correct} />
              <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <div>
                  <p
                    className={"font-display text-[2rem] font-extrabold leading-tight " + (exact ? "text-good" : "text-ink")}
                    data-testid="deviation-text"
                  >
                    {exact && <Sparkles className="mr-2 inline size-7 align-[-0.1em]" aria-hidden="true" />}
                    {dev ? dev.text : "Ohne Tipp aufgelöst"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink-soft">
                    Richtiges Jahr: <span className="font-bold text-ink" data-testid="correct-year">{r.correct}</span>
                    {r.guess !== null && <> · Dein Tipp: <span className="font-bold text-ink">{r.guess}</span></>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-4xl font-extrabold tabular-nums leading-none text-ink">
                    +<CountUp to={r.points} />
                  </p>
                  <p className="text-sm font-medium text-ink-soft">Punkte</p>
                </div>
              </div>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink" data-testid="context-sentence">
                {r.reveal.significance ?? firstSentence}
                {firstSource && (
                  <>
                    {" "}
                    <a href={firstSource.url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap font-semibold text-ink underline decoration-sun decoration-2 underline-offset-2">
                      Quelle: {firstSource.label}
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>
          <p className="sr-only" aria-live="polite" data-testid="sr-resolution">{announce}</p>
          {exact && celebrate && <Confetti />}

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
              {isLast ? "Ergebnis ansehen" : "Nächste Runde"}
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
