"use client";

import { ChevronsLeftRight, Minus, MoveHorizontal, Plus } from "lucide-react";
import { useId, useRef, useState } from "react";
import { MAX_YEAR, MIN_YEAR } from "@/lib/constants";
import { cn } from "@/lib/cn";

const SPAN = MAX_YEAR - MIN_YEAR;
const INSET = 26; // px Abstand der Skala zum Rand, damit die Marke am Rand nicht abgeschnitten wird
const START_YEAR = 1960;
const LABELS = [1900, 1920, 1940, 1960, 1980, 2000, 2020];

const clamp = (n: number) => Math.min(MAX_YEAR, Math.max(MIN_YEAR, n));
const pct = (year: number) => ((year - MIN_YEAR) / SPAN) * 100;

/**
 * Jahreszeitleiste 1900–2020 (JAHRSAGER-Signaturelement).
 * - Grobe Auswahl per Maus/Finger auf der Leiste (Ziehen oder Tippen)
 * - Feinjustierung mit −1/+1 (und −10/+10), Pfeiltasten, Bild↑/↓, Pos1/Ende
 * - Direkteingabe im Zahlenfeld
 * Es gibt bewusst keinen Vorgabewert: erst nach einer Auswahl kann eine Schätzung abgegeben werden.
 */
export function YearPicker({ value, onChange, disabled }: { value: number | null; onChange: (y: number | null) => void; disabled?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const inputId = useId();
  const hintId = useId();

  const set = (y: number | null) => {
    setDraft(null);
    setMsg("");
    onChange(y === null ? null : clamp(y));
  };
  const step = (d: number) => set(value === null ? START_YEAR : value + d);

  const fromPointer = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left - INSET) / (rect.width - INSET * 2)));
    set(Math.round(MIN_YEAR + ratio * SPAN));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, number | "min" | "max"> = {
      ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10, Home: "min", End: "max",
    };
    const a = map[e.key];
    if (a === undefined) return;
    e.preventDefault();
    if (a === "min") set(MIN_YEAR);
    else if (a === "max") set(MAX_YEAR);
    else step(a);
  };

  const text = draft ?? (value === null ? "" : String(value));
  const invalid = msg !== "";
  const rangeMsg = `Bitte gib ein Jahr zwischen ${MIN_YEAR} und ${MAX_YEAR} ein.`;

  const onText = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    setDraft(digits);
    const n = Number(digits);
    const ok = digits.length === 4 && n >= MIN_YEAR && n <= MAX_YEAR;
    if (raw !== digits && /\D/.test(raw)) setMsg("Bitte gib nur Ziffern ein, zum Beispiel 1969.");
    else if (digits.length === 4 && !ok) setMsg(rangeMsg);
    else setMsg("");
    onChange(ok ? n : null);
  };

  const left = value === null ? 0 : pct(value);
  const pos = (p: number) => `calc(${INSET}px + (100% - ${INSET * 2}px) * ${p / 100})`;

  return (
    <div className="select-none">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-medium text-ink-soft">{value === null ? "Noch kein Jahr gewählt" : "Dein gewähltes Jahr"}</p>
        <p
          aria-hidden="true"
          className={cn("font-display text-5xl font-extrabold tabular-nums leading-none transition-colors duration-200", value === null ? "text-line-strong" : "text-ink")}
        >
          {value === null ? "––––" : <span className="marker">{value}</span>}
        </p>
      </div>

      {/* Kurze, integrierte Anleitung oberhalb der Zeitleiste (Finger vs. Maus) */}
      <p id={hintId} className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <MoveHorizontal className="size-4 shrink-0" aria-hidden="true" />
        {value === null ? (
          <>
            <span className="only-mouse">Ziehe den Regler oder klicke auf die Zeitleiste.</span>
            <span className="only-touch">Wische oder tippe auf die Zeitleiste.</span>
          </>
        ) : (
          <span className="font-medium text-ink-soft">Feinjustieren mit − und + oder per Tastatur.</span>
        )}
      </p>

      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Jahr auswählen"
        aria-describedby={hintId}
        aria-valuemin={MIN_YEAR}
        aria-valuemax={MAX_YEAR}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? "Noch kein Jahr ausgewählt" : `Jahr ${value}`}
        aria-disabled={disabled}
        onKeyDown={disabled ? undefined : onKeyDown}
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          fromPointer(e.clientX);
        }}
        onPointerMove={(e) => dragging && fromPointer(e.clientX)}
        onPointerUp={(e) => {
          setDragging(false);
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={() => setDragging(false)}
        className={cn(
          "relative mt-2 h-[5.75rem] cursor-grab touch-none rounded-2xl border-2 bg-paper-2 transition-colors duration-200 active:cursor-grabbing",
          value === null ? "border-field bg-sun-soft/70 hover:border-ink" : "border-line",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {/* Skala */}
        <div className="absolute top-[3.25rem] h-1 rounded-full bg-line-strong" style={{ left: INSET, right: INSET }} />
        {Array.from({ length: SPAN / 5 + 1 }, (_, i) => MIN_YEAR + i * 5).map((y) => {
          const major = y % 20 === 0;
          const mid = y % 10 === 0;
          return (
            <span
              key={y}
              aria-hidden="true"
              className={cn("absolute w-px bg-line-strong", major ? "top-[2.6rem] h-[1.4rem] bg-ink-soft/60" : mid ? "top-[2.85rem] h-3" : "top-[3rem] h-2")}
              style={{ left: pos(pct(y)) }}
            />
          );
        })}
        {LABELS.map((y) => (
          <span
            key={y}
            aria-hidden="true"
            className="absolute top-[4.5rem] -translate-x-1/2 text-[0.72rem] font-semibold tabular-nums text-ink-soft"
            style={{ left: pos(pct(y)) }}
          >
            {y}
          </span>
        ))}

        {/* Einladung zur Bedienung: Regler-Geist in der Mitte, bewegt sich kurz hin und her und ruht dann */}
        {value === null && !disabled && (
          <span aria-hidden="true" className="pointer-events-none absolute top-[3.25rem] -translate-x-1/2 -translate-y-[calc(50%-2px)]" style={{ left: pos(50) }}>
            <span className="relative block animate-nudge">
              <span className="absolute inset-0 animate-ring rounded-full bg-sun" />
              <span className="relative flex size-11 items-center justify-center rounded-full border-[3px] border-ink bg-sun shadow-pop">
                <ChevronsLeftRight className="size-6 text-ink" strokeWidth={2.5} />
              </span>
            </span>
          </span>
        )}

        {/* Aktive Auswahl: gelber Verlauf bis zum Auswahlpunkt */}
        {value !== null && (
          <>
            <span
              aria-hidden="true"
              className="absolute top-[3.25rem] h-1 rounded-full bg-sun"
              style={{ left: INSET, width: `calc((100% - ${INSET * 2}px) * ${left / 100})` }}
            />
            <span aria-hidden="true" className="absolute top-[3.25rem] -translate-x-1/2 -translate-y-[calc(50%-2px)]" style={{ left: pos(left) }}>
              <span
                className={cn(
                  "absolute bottom-7 left-1/2 -translate-x-1/2 rounded-full bg-ink px-3 py-1 font-display text-base font-bold tabular-nums text-sun shadow-pop transition-transform duration-150",
                  dragging && "-translate-y-1.5 scale-110",
                )}
              >
                {value}
              </span>
              <span className={cn("block size-8 rounded-full border-[3px] border-ink bg-sun shadow-pop transition-transform duration-150", dragging && "scale-125")} />
            </span>
          </>
        )}
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <StepButton label="10 Jahre zurück" onClick={() => step(-10)} disabled={disabled}>
          <span className="text-sm font-bold">−10</span>
        </StepButton>
        <StepButton label="1 Jahr zurück" onClick={() => step(-1)} disabled={disabled} big>
          <Minus className="size-5" />
        </StepButton>
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="mb-1 block text-center text-xs font-semibold text-ink-soft">
            Jahr eingeben (1900–2020)
          </label>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="Jahr"
            disabled={disabled}
            value={text}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${inputId}-err` : undefined}
            onChange={(e) => onText(e.target.value)}
            onBlur={() => {
              if (draft !== null && draft.length > 0 && draft.length < 4) setMsg(rangeMsg);
              setDraft(null);
            }}
            className={cn(
              "h-14 w-full rounded-xl border-2 bg-card text-center font-display text-2xl font-bold tabular-nums text-ink placeholder:text-line-strong",
              invalid ? "border-ink bg-sun-soft" : "border-field focus:border-ink",
            )}
          />
        </div>
        <StepButton label="1 Jahr vor" onClick={() => step(1)} disabled={disabled} big>
          <Plus className="size-5" />
        </StepButton>
        <StepButton label="10 Jahre vor" onClick={() => step(10)} disabled={disabled}>
          <span className="text-sm font-bold">+10</span>
        </StepButton>
      </div>
      <p id={`${inputId}-err`} role="alert" className="mt-2 min-h-5 text-sm font-semibold text-ink">
        {msg}
      </p>
    </div>
  );
}

function StepButton({ children, label, onClick, disabled, big }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; big?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-field bg-card text-ink transition-[background-color,border-color,transform] duration-150 hover:border-ink hover:bg-sun-soft active:scale-95 disabled:opacity-50",
        "h-14",
        big ? "w-14" : "w-11",
      )}
    >
      {children}
    </button>
  );
}
