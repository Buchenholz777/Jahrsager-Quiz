"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Hourglass, MessageCircle, Trophy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inviteText } from "@/lib/party-code";
import { formatPoints } from "@/lib/scoring";
import type { PartyView } from "@/server/services/parties";
import { get, loadName, post, saveName } from "./party-api";

type Err = { code?: string; message: string };

const STATE_LABEL = { nicht_gestartet: "noch nicht gestartet", laufend: "spielt gerade", abgeschlossen: "fertig" } as const;

/** Party-Raum: Einladung, Teilnehmende, eigener Spielstand, Ergebnisse (erst nach eigenem Abschluss) und Wartemeldung. */
export function PartyRoom({ code }: { code: string }) {
  const [party, setParty] = useState<PartyView | null>(null);
  const [error, setError] = useState<Err | null>(null);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");
  const [name, setName] = useState(() => loadName());
  const [joining, setJoining] = useState(false);
  const [origin, setOrigin] = useState("");
  const nameId = useId();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await get<{ party: PartyView }>(`/api/party/${encodeURIComponent(code)}`);
      setParty(r.party);
      setError(null);
    } catch (e) {
      setError({ code: (e as { code?: string }).code, message: (e as Error).message });
    }
  }, [code]);

  useEffect(() => {
    queueMicrotask(() => {
      setOrigin(window.location.origin);
      void load();
    });
  }, [load]);

  // Solange man auf andere wartet, den Stand alle 15 Sekunden aktualisieren (nur bei sichtbarem Tab)
  useEffect(() => {
    if (!party?.waiting) return;
    timer.current = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [party?.waiting, load]);

  const link = `${origin}/party/${code}`;
  const text = inviteText(code, link);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setNote("Einladungslink kopiert.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNote("Kopieren nicht möglich – markiere den Link und kopiere ihn manuell.");
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (joining) return;
    setJoining(true);
    try {
      saveName(name);
      await post("/api/party/beitreten", { code, name });
      await load();
    } catch (e2) {
      setError({ code: (e2 as { code?: string }).code, message: (e2 as Error).message });
    } finally {
      setJoining(false);
    }
  }

  if (error && !party) return <Problem error={error} onRetry={load} />;
  if (!party) {
    return (
      <p role="status" className="text-ink-soft">
        Party wird geladen …
      </p>
    );
  }

  if (!party.isMember) {
    return (
      <Card className="max-w-xl p-6">
        <h2 className="text-2xl font-bold">Du wurdest zur Party eingeladen</h2>
        <p className="mt-2 text-ink-soft">
          Party-Code <strong className="tracking-widest text-ink">{party.code}</strong> · {party.memberCount} {party.memberCount === 1 ? "Person" : "Personen"} dabei. Alle spielen dieselben fünf Ereignisse – jede Person, wann sie Zeit hat.
        </p>
        <form onSubmit={join} className="mt-4">
          <label htmlFor={nameId} className="block text-sm font-semibold">
            Dein Anzeigename (optional)
          </label>
          <input id={nameId} value={name} maxLength={24} placeholder="z. B. Ben" onChange={(e) => setName(e.target.value)} className="mt-1 h-12 w-full rounded-xl border-2 border-field bg-card px-3 text-lg focus:border-ink" />
          <Button type="submit" size="lg" className="mt-4 w-full" disabled={joining} data-testid="party-join">
            {joining ? "Wird beigetreten …" : "Als Gast beitreten"}
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-sun bg-sun-soft p-3 text-sm font-semibold">
            {error.message}
          </p>
        )}
      </Card>
    );
  }

  const me = party.me!;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-soft">Party-Code</p>
          <p className="mt-1 font-display text-5xl font-extrabold tracking-[0.25em] text-ink" data-testid="party-code">
            {party.code}
          </p>
          <p className="mt-3 break-all text-sm text-ink-soft" data-testid="party-link">
            {link}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" size="lg" onClick={copy}>
              {copied ? <Check className="size-5" aria-hidden="true" /> : <Copy className="size-5" aria-hidden="true" />}
              {copied ? "Kopiert" : "Einladungslink kopieren"}
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="party-whatsapp"
              className={buttonVariants({ size: "lg", className: "bg-good text-white hover:bg-good/90" })}
            >
              <MessageCircle className="size-5" aria-hidden="true" /> Über WhatsApp teilen
            </a>
          </div>
          <p role="status" className="mt-2 min-h-5 text-sm text-ink-soft">
            {note}
          </p>
          <p className="text-sm text-ink-soft">Link und Code funktionieren auch ohne WhatsApp: einfach weitergeben. Die Party ist bis {new Date(party.expiresAt).toLocaleDateString("de-DE")} offen.</p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Dein Spiel</h2>
          {me.state === "nicht_gestartet" && (
            <>
              <p className="mt-2 text-ink-soft">Fünf Ereignisse, fünf Schätzungen. Die Punkte werden wie beim Tagesrätsel berechnet.</p>
              <Link href={`/party/${party.code}/spielen`} className={buttonVariants({ size: "lg", className: "mt-4 w-full sm:w-auto" })} data-testid="party-play">
                Party-Runde starten
              </Link>
            </>
          )}
          {me.state === "laufend" && (
            <>
              <p className="mt-2 text-ink-soft">Du bist bei Ereignis {me.answered + 1} von 5.</p>
              <Link href={`/party/${party.code}/spielen`} className={buttonVariants({ size: "lg", className: "mt-4 w-full sm:w-auto" })} data-testid="party-play">
                Spiel fortsetzen
              </Link>
            </>
          )}
          {me.state === "abgeschlossen" && (
            <>
              <p className="mt-2 text-lg">
                Du hast <strong data-testid="party-my-points">{formatPoints(me.points ?? 0)}</strong> von 5.000 Punkten erreicht.
              </p>
              <Link href={`/party/${party.code}/spielen`} className={buttonVariants({ variant: "quiet", className: "mt-4" })}>
                Meine Auflösungen ansehen
              </Link>
            </>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        {me.state === "abgeschlossen" ? (
          <Card className="p-5 sm:p-6" data-testid="party-results">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Trophy className="size-6" aria-hidden="true" /> Punktestand
            </h2>
            {party.waiting && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-sun-soft p-3 text-sm font-medium" data-testid="party-waiting">
                <Hourglass className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Du bist fertig! Sobald jemand anderes die Runde beendet hat, siehst du hier den Vergleich. Teile den Einladungslink, damit andere mitspielen.
              </p>
            )}
            <ol className="mt-3 space-y-2">
              {party.leaderboard.map((l, i) => (
                <li key={`${l.name}-${i}`} className={"flex items-center justify-between rounded-xl border px-3 py-2 " + (l.isMe ? "border-ink bg-sun-soft" : "border-line bg-card")}>
                  <span className="font-semibold">
                    {i + 1}. {l.name}
                    {l.isMe ? " (du)" : ""}
                  </span>
                  <span className="tabular-nums">{formatPoints(l.points)} Punkte</span>
                </li>
              ))}
            </ol>
          </Card>
        ) : (
          <Card className="p-5 sm:p-6">
            <h2 className="text-2xl font-bold">Punktestand</h2>
            <p className="mt-2 text-ink-soft">Die Ergebnisse der anderen siehst du, sobald du selbst fertig bist. So bleiben Tipps und Lösungen für alle spannend.</p>
          </Card>
        )}

        <Card className="p-5 sm:p-6">
          <h2 className="text-xl font-bold">Dabei ({party.memberCount})</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {party.members.map((m, i) => (
              <li key={`${m.name}-${i}`} className="flex justify-between gap-3">
                <span className="font-medium">
                  {m.name}
                  {m.isMe ? " (du)" : ""}
                </span>
                <span className="text-ink-soft">{STATE_LABEL[m.state]}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Problem({ error, onRetry }: { error: Err; onRetry: () => void }) {
  const gone = error.code === "PARTY_UNBEKANNT" || error.code === "PARTY_ABGELAUFEN" || error.code === "CODE_LEER";
  return (
    <Card className="max-w-xl p-6" role="alert" data-testid="party-problem">
      <h2 className="text-2xl font-bold">{gone ? "Diese Party ist nicht verfügbar" : "Die Party konnte nicht geladen werden"}</h2>
      <p className="mt-2 text-ink-soft">{error.message}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {!gone && <Button onClick={onRetry}>Erneut versuchen</Button>}
        <Link href="/party" className={buttonVariants({ variant: gone ? "primary" : "secondary" })}>
          {gone ? "Neue Party erstellen oder Code eingeben" : "Zur Party-Seite"}
        </Link>
      </div>
    </Card>
  );
}
