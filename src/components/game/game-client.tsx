"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { ROUNDS_PER_GAME } from "@/lib/constants";
import type { GameState } from "@/lib/game-types";
import { formatDateDe } from "@/lib/time";
import { Badge } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProgressSegments } from "./progress";
import { RoundQuestion } from "./round-question";
import { RoundReveal } from "./round-reveal";

type StartOpts = { packNumber?: number; practice?: boolean };

async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error?.message ?? "Verbindungsproblem") as Error & { code?: string };
    err.code = data?.error?.code;
    throw err;
  }
  return data as T;
}

export function GameClient({ packNumber, practice }: { packNumber?: number; practice?: boolean }) {
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);
  const [view, setView] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<{ code?: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const lock = useRef(false);
  const last = useRef<(() => void) | null>(null);

  const start = useCallback(async (opts: StartOpts) => {
    setLoadError(null);
    try {
      const { state } = await api<{ state: GameState }>("/api/spiel/start", opts);
      setGame(state);
      setView(state.currentPosition ?? ROUNDS_PER_GAME);
    } catch (e) {
      const err = e as Error & { code?: string };
      setLoadError({ code: err.code, message: err.message });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void start({ packNumber, practice });
    });
    return () => {
      cancelled = true;
    };
  }, [start, packNumber, practice]);

  const submit = useCallback(
    (position: number, year: number | null) => {
      if (!game || lock.current) return;
      const run = async () => {
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setActionError(null);
        try {
          const { state } = await api<{ state: GameState }>(`/api/spiel/${game.gameId}/antwort`, { position, year });
          setGame(state);
          setView(position);
        } catch (e) {
          const err = e as Error & { code?: string };
          setActionError(err.code === "UNGUELTIGES_JAHR" || err.code === "UNGUELTIGE_EINGABE" ? err.message : "Das hat nicht geklappt. Dein Tipp wurde nicht verbraucht – bitte versuche es erneut.");
        } finally {
          lock.current = false;
          setBusy(false);
        }
      };
      last.current = run;
      void run();
    },
    [game],
  );

  if (loadError) return <LoadProblem error={loadError} onRetry={() => start({ packNumber, practice })} />;
  if (!game || view === null) return <GameSkeleton />;

  const round = game.rounds.find((r) => r.position === view) ?? game.rounds[game.rounds.length - 1];
  const isDone = game.status === "abgeschlossen";

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
      <GameHeader game={game} view={round.position} onView={setView} />

      {isDone && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-card border border-line bg-card p-4 shadow-card">
          <Check className="size-6 text-good" aria-hidden="true" />
          <p className="flex-1 font-medium">
            {game.official ? "Du hast das heutige Tagesrätsel abgeschlossen." : "Übungsrunde abgeschlossen."} Du kannst die Auflösungen ansehen oder das Ergebnis öffnen.
          </p>
          <Link href={`/ergebnis?spiel=${game.gameId}`} className={buttonVariants({ size: "sm" })}>
            Ergebnis ansehen
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setGame(null);
              void start({ packNumber: game.packNumber, practice: true });
            }}
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Als Übung spielen
          </Button>
        </div>
      )}

      {round.result ? (
        <RoundReveal
          key={`r${round.position}`}
          round={round}
          total={ROUNDS_PER_GAME}
          gameId={game.gameId}
          isLast={round.position === ROUNDS_PER_GAME}
          onNext={() => {
            if (round.position === ROUNDS_PER_GAME) router.push(`/ergebnis?spiel=${game.gameId}`);
            else {
              setView(round.position + 1);
              window.scrollTo({ top: 0 });
            }
          }}
        />
      ) : (
        <RoundQuestion
          key={`q${round.position}`}
          round={round}
          total={ROUNDS_PER_GAME}
          busy={busy}
          error={actionError}
          onGuess={(y) => submit(round.position, y)}
          onResolve={() => submit(round.position, null)}
          onRetry={() => last.current?.()}
        />
      )}
    </div>
  );
}

function GameHeader({ game, view, onView }: { game: GameState; view: number; onView: (n: number) => void }) {
  const resolved = Array.from({ length: ROUNDS_PER_GAME }, (_, i) => !!game.rounds.find((x) => x.position === i + 1)?.result);
  const reachable = Array.from({ length: ROUNDS_PER_GAME }, (_, i) => !!game.rounds.find((x) => x.position === i + 1));
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="font-display text-xl font-bold" data-testid="round-indicator">
          Ereignis {view} von {ROUNDS_PER_GAME}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={game.official ? "accent" : "neutral"}>
            {game.official ? "Tagesrätsel" : "Übung"} #{game.packNumber}
          </Badge>
          <span className="text-sm text-ink-soft">{formatDateDe(game.packDate)}</span>
        </div>
      </div>
      <div className="mt-1">
        <ProgressSegments total={ROUNDS_PER_GAME} resolved={resolved} reachable={reachable} current={view} onSelect={onView} />
      </div>
      {!game.official && <p className="text-sm text-ink-soft">Übung: verändert deine Tageswertung nicht.</p>}
    </div>
  );
}

function GameSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" role="status" aria-live="polite">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-[4/3] animate-pulse rounded-card bg-paper-2" />
        <div className="space-y-4">
          <div className="h-5 w-32 animate-pulse rounded bg-paper-2" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-paper-2" />
          <div className="h-24 animate-pulse rounded bg-paper-2" />
        </div>
      </div>
      <span className="sr-only">JAHRSAGER wird geladen …</span>
    </div>
  );
}

function LoadProblem({ error, onRetry }: { error: { code?: string; message: string }; onRetry: () => void }) {
  const missing = error.code === "KEIN_PAKET" || error.code === "NICHT_VERFUEGBAR";
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center" role="alert">
      <h1 className="text-3xl font-semibold">{missing ? "Hier gibt es gerade nichts zu spielen" : "Das Spiel konnte nicht geladen werden"}</h1>
      <p className="mt-3 text-ink-soft">{error.message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!missing && <Button onClick={onRetry}>Erneut versuchen</Button>}
        <Link href="/archiv" className={buttonVariants({ variant: "secondary" })}>
          Zum Rätselarchiv
        </Link>
      </div>
    </div>
  );
}
