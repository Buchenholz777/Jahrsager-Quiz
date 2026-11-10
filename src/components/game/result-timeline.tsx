import { MAX_YEAR, MIN_YEAR } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { timelineGeometry } from "@/lib/timeline";

const INSET = 26; // gleiche Randbreite wie die Eingabe-Zeitleiste (year-picker.tsx)
const LABELS = [1900, 1920, 1940, 1960, 1980, 2000, 2020];
const pos = (pct: number) => `calc(${INSET}px + (100% - ${INSET * 2}px) * ${pct / 100})`;
const align = (pct: number) => (pct < 16 ? "translate-x-[-14%]" : pct > 84 ? "translate-x-[-86%]" : "-translate-x-1/2");

/**
 * Auflösung auf derselben Skala wie die Eingabe-Zeitleiste.
 * - Volltreffer: ein gemeinsamer grüner Marker.
 * - Abweichung: Marker „Dein Tipp“ (Ring, unten beschriftet) und „Richtiges Jahr“ (gefüllt, oben beschriftet) mit rotem Segment exakt dazwischen.
 * Beschriftungen liegen auf getrennten Zeilen (oben/unten), die Markerpositionen bleiben exakt. Rein visuell: der Text steht in der Auflösung.
 */
export function ResultTimeline({ guess, correct, className }: { guess: number | null; correct: number; className?: string }) {
  const g = timelineGeometry(guess, correct);
  return (
    <div aria-hidden="true" className={cn("relative h-[8.25rem] w-full select-none rounded-2xl border-2 border-line bg-paper-2", className)} data-testid="result-timeline">
      <div className="absolute top-[4.1rem] h-1 rounded-full bg-line-strong" style={{ left: INSET, right: INSET }} />
      {Array.from({ length: (MAX_YEAR - MIN_YEAR) / 5 + 1 }, (_, i) => MIN_YEAR + i * 5).map((y) => (
        <span key={y} className={cn("absolute w-px bg-line-strong", y % 20 === 0 ? "top-[3.5rem] h-[1.4rem] bg-ink-soft/60" : y % 10 === 0 ? "top-[3.75rem] h-3" : "top-[3.9rem] h-2")} style={{ left: pos(((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100) }} />
      ))}
      {LABELS.map((y) => (
        <span key={y} className="absolute top-[6.2rem] -translate-x-1/2 text-[0.72rem] font-semibold tabular-nums text-ink-soft" style={{ left: pos(((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100) }}>
          {y}
        </span>
      ))}

      {/* rotes Segment exakt zwischen den Markern */}
      {g.segment && (
        <span
          data-testid="deviation-segment"
          data-left-pct={g.segment.leftPct.toFixed(4)}
          data-width-pct={g.segment.widthPct.toFixed(4)}
          className="absolute top-[3.95rem] h-2 rounded-sm bg-[#c1121f]"
          style={{ left: pos(g.segment.leftPct), width: `calc((100% - ${INSET * 2}px) * ${g.segment.widthPct / 100})` }}
        />
      )}

      {g.exact ? (
        <div className="absolute top-[4.1rem]" style={{ left: pos(g.correctPct) }} data-testid="marker-exact">
          <span className="absolute left-0 top-0 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-good shadow-pop" />
          <span className={cn("absolute -top-[3.4rem] whitespace-nowrap rounded-full bg-good px-3 py-1 font-display text-sm font-bold tabular-nums text-white", align(g.correctPct))}>Volltreffer! {correct}</span>
        </div>
      ) : (
        <>
          <div className="absolute top-[4.1rem]" style={{ left: pos(g.correctPct) }} data-testid="marker-correct">
            <span className="absolute left-0 top-0 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-sun shadow-pop" />
            <span className={cn("absolute -top-[3.4rem] whitespace-nowrap rounded-full bg-sun px-2.5 py-1 font-display text-sm font-bold tabular-nums text-ink", align(g.correctPct))}>Richtiges Jahr {correct}</span>
          </div>
          {g.guessPct !== null && (
            <div className="absolute top-[4.1rem]" style={{ left: pos(g.guessPct) }} data-testid="marker-guess">
              <span className="absolute left-0 top-0 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-card shadow-pop" />
              <span className={cn("absolute top-[1.15rem] whitespace-nowrap rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-sm font-bold tabular-nums text-ink", align(g.guessPct))}>Dein Tipp {guess}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
