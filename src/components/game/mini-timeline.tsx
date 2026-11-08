import { MAX_YEAR, MIN_YEAR } from "@/lib/constants";
import { cn } from "@/lib/cn";

const p = (y: number) => ((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
const align = (pc: number) => (pc < 14 ? "translate-x-[-12%]" : pc > 86 ? "translate-x-[-88%]" : "-translate-x-1/2");

/** Kleine Zeitachse mit Lösung und eigenem Tipp. Der Abstand steht zusätzlich als Text, Farbe allein trägt keine Information. */
export function MiniTimeline({ correct, guess, className }: { correct: number; guess: number | null; className?: string }) {
  const c = p(correct);
  const g = guess === null ? null : p(guess);
  const label =
    guess === null
      ? `Zeitleiste: Lösung ${correct}, kein Tipp abgegeben`
      : `Zeitleiste: Lösung ${correct}, dein Tipp ${guess}, Abstand ${Math.abs(guess - correct)} Jahre`;
  return (
    <div role="img" aria-label={label} className={cn("relative h-[5.5rem] w-full", className)}>
      <div className="absolute inset-x-3 top-9 h-1 rounded-full bg-line-strong" />
      {g !== null && g !== c && (
        <div
          className="absolute top-9 h-1 rounded-full bg-sun"
          style={{ left: `calc(12px + (100% - 24px) * ${Math.min(c, g) / 100})`, width: `calc((100% - 24px) * ${Math.abs(c - g) / 100})` }}
        />
      )}
      {/* Lösung (oben) */}
      <div className="absolute top-0 animate-pop" style={{ left: `calc(12px + (100% - 24px) * ${c / 100})` }}>
        <span className={cn("absolute -top-0.5 whitespace-nowrap rounded-full bg-sun px-2.5 py-0.5 font-display text-sm font-bold tabular-nums text-ink", align(c))}>
          Lösung {correct}
        </span>
        <span className="absolute left-0 top-[1.75rem] size-[1.15rem] -translate-x-1/2 rounded-full border-[3px] border-ink bg-sun" />
      </div>
      {/* Tipp (unten) */}
      {g !== null && (
        <div className="absolute top-9" style={{ left: `calc(12px + (100% - 24px) * ${g / 100})` }}>
          <span className="absolute left-0 top-0 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-card" />
          <span className={cn("absolute top-3.5 whitespace-nowrap rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-bold tabular-nums text-ink", align(g))}>
            Dein Tipp {guess}
          </span>
        </div>
      )}
      <div className="absolute inset-x-3 bottom-[-0.15rem] flex justify-between text-[0.7rem] font-medium tabular-nums text-ink-soft" aria-hidden="true">
        <span>{MIN_YEAR}</span>
        <span>{MAX_YEAR}</span>
      </div>
    </div>
  );
}
