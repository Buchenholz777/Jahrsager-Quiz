import { MAX_YEAR, MIN_YEAR } from "@/lib/constants";
import type { RoundState } from "@/lib/game-types";
import { formatPoints } from "@/lib/scoring";
import { describeDeviation } from "@/lib/timeline";

const pos = (y: number) => `calc(14px + (100% - 28px) * ${(y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)})`;

/** Visuelle Auswertung: pro Ereignis Lösung (gefüllt) und Tipp (Ring) auf einer gemeinsamen Zeitachse. */
export function ResultChart({ rounds }: { rounds: RoundState[] }) {
  const sorted = [...rounds].sort((a, b) => a.result!.correct - b.result!.correct);
  return (
    <div>
      <ol className="space-y-3">
        {sorted.map((r) => {
          const res = r.result!;
          return (
            <li key={r.position} className="rounded-2xl border border-line bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-display text-xl font-semibold">
                  <span className="mr-2 tabular-nums marker">{res.correct}</span>
                  {res.reveal.publicTitle}
                </p>
                <p className="text-sm font-medium tabular-nums text-ink-soft">
                  {formatPoints(res.points)} Punkte
                </p>
              </div>
              <div
                className="relative mt-3 h-9"
                role="img"
                aria-label={`${res.reveal.publicTitle}: Lösung ${res.correct}, ${res.guess === null ? "kein Tipp" : `dein Tipp ${res.guess}`}. ${describeDeviation(res.guess, res.correct)?.text ?? "ohne Tipp"}`}
              >
                <div className="absolute inset-x-3.5 top-4 h-0.5 bg-line-strong" />
                {res.guess !== null && res.guess !== res.correct && (
                  <div
                    className="absolute top-[0.9rem] h-1.5 rounded bg-sun/60"
                    style={{
                      left: pos(Math.min(res.guess, res.correct)),
                      width: `calc((100% - 28px) * ${Math.abs(res.guess - res.correct) / (MAX_YEAR - MIN_YEAR)})`,
                    }}
                  />
                )}
                {res.guess !== null && (
                  <span className="absolute top-4 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-card" style={{ left: pos(res.guess) }} />
                )}
                <span className="absolute top-4 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-sun" style={{ left: pos(res.correct) }} />
                <div className="absolute inset-x-3.5 bottom-0 flex justify-between text-[0.65rem] tabular-nums text-ink-soft" aria-hidden="true">
                  <span>{MIN_YEAR}</span>
                  <span>{MAX_YEAR}</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {res.guess === null ? "Ohne Tipp aufgelöst" : `Dein Tipp: ${res.guess}`} · {describeDeviation(res.guess, res.correct)?.text ?? ""}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-2" aria-hidden="true">
                <div className="h-full rounded-full bg-sun" style={{ width: `${(res.points / 1000) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full bg-sun" /> Lösung
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full border-2 border-ink bg-card" /> Dein Tipp
        </span>
      </p>
    </div>
  );
}
