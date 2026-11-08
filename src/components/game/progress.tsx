import { cn } from "@/lib/cn";

/**
 * Fortschritt in fünf Segmenten: abgeschlossene Runden sonnengelb, aktuelle Runde mitternachtsblau.
 * Erreichbare Segmente sind Schaltflächen (Auflösungen bleiben erreichbar); jedes hat eine Touchfläche von ≥ 44 px Höhe.
 */
export function ProgressSegments({
  total,
  resolved,
  reachable,
  current,
  onSelect,
}: {
  total: number;
  resolved: boolean[];
  reachable: boolean[];
  current: number;
  onSelect?: (position: number) => void;
}) {
  const done = resolved.filter(Boolean).length;
  return (
    <div role="group" aria-label={`Fortschritt: ${done} von ${total} Ereignissen aufgelöst`} className="flex items-stretch gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
        const isDone = resolved[n - 1];
        const isCurrent = n === current;
        const can = reachable[n - 1];
        return (
          <button
            key={n}
            type="button"
            disabled={!can}
            onClick={() => onSelect?.(n)}
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`Ereignis ${n}${isDone ? " (aufgelöst)" : can ? " (aktuell)" : " (noch gesperrt)"}`}
            className="group flex min-h-11 flex-1 items-center rounded-lg disabled:cursor-default"
          >
            <span
              className={cn(
                "block h-3 w-full rounded-full transition-[background-color,transform] duration-200",
                isCurrent ? "bg-ink" : isDone ? "bg-sun group-hover:bg-sun-2" : can ? "bg-ink/35" : "bg-line",
                isCurrent && "scale-y-125",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
