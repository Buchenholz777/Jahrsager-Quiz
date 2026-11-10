"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { PartyPopper, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { normalizeCode } from "@/lib/party-code";
import { loadName, post, saveName } from "./party-api";

/** Party erstellen oder per Code beitreten (als Gast, ohne Anmeldung). */
export function PartyHub() {
  const router = useRouter();
  const nameId = useId();
  const codeId = useId();
  const [name, setName] = useState(() => loadName());
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"neu" | "join" | null>(null);
  const [error, setError] = useState<{ scope: "neu" | "join"; message: string } | null>(null);

  async function create() {
    if (busy) return;
    setBusy("neu");
    setError(null);
    try {
      saveName(name);
      const r = await post<{ code: string }>("/api/party", { name });
      router.push(`/party/${r.code}`);
    } catch (e) {
      setError({ scope: "neu", message: (e as Error).message });
      setBusy(null);
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const c = normalizeCode(code);
    if (!c) {
      setError({ scope: "join", message: "Bitte gib den Party-Code ein, den du bekommen hast." });
      return;
    }
    setBusy("join");
    setError(null);
    try {
      saveName(name);
      const r = await post<{ code: string }>("/api/party/beitreten", { code: c, name });
      router.push(`/party/${r.code}`);
    } catch (e2) {
      setError({ scope: "join", message: (e2 as Error).message });
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5 sm:p-6 lg:col-span-2">
        <label htmlFor={nameId} className="block text-sm font-semibold">
          Dein Anzeigename (optional)
        </label>
        <input
          id={nameId}
          value={name}
          maxLength={24}
          autoComplete="nickname"
          placeholder="z. B. Anna"
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-12 w-full max-w-sm rounded-xl border-2 border-field bg-card px-3 text-lg focus:border-ink"
        />
        <p className="mt-1 text-sm text-ink-soft">Ohne Namen erscheinst du als „Gast“. Eine Anmeldung ist nicht nötig.</p>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <PartyPopper className="size-6" aria-hidden="true" /> Party erstellen
        </h2>
        <p className="mt-2 text-ink-soft">Du erhältst einen kurzen Code und einen Einladungslink. Alle spielen dieselben fünf Ereignisse, jede Person, wann sie Zeit hat.</p>
        <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={create} disabled={busy !== null} data-testid="party-create">
          {busy === "neu" ? "Party wird erstellt …" : "Party erstellen"}
        </Button>
        {error?.scope === "neu" && (
          <p role="alert" className="mt-3 rounded-xl border border-sun bg-sun-soft p-3 text-sm font-semibold">
            {error.message}{" "}
            <button type="button" onClick={create} className="font-bold underline underline-offset-2">
              Erneut versuchen
            </button>
          </p>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <UserPlus className="size-6" aria-hidden="true" /> Party beitreten
        </h2>
        <form onSubmit={join} className="mt-2">
          <label htmlFor={codeId} className="block text-ink-soft">
            Gib den Code aus der Einladung ein.
          </label>
          <input
            id={codeId}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="ABC123"
            className="mt-2 h-14 w-full rounded-xl border-2 border-field bg-card px-3 text-center font-display text-2xl font-bold uppercase tracking-[0.3em] focus:border-ink"
          />
          <Button type="submit" size="lg" variant="secondary" className="mt-4 w-full sm:w-auto" disabled={busy !== null}>
            {busy === "join" ? "Wird beigetreten …" : "Party beitreten"}
          </Button>
        </form>
        {error?.scope === "join" && (
          <p role="alert" className="mt-3 rounded-xl border border-sun bg-sun-soft p-3 text-sm font-semibold">
            {error.message}
            {(error.message.includes("gibt es nicht") || error.message.includes("abgelaufen")) && (
              <>
                {" "}
                Du kannst auch{" "}
                <button type="button" onClick={create} className="font-bold underline underline-offset-2">
                  eine neue Party erstellen
                </button>
                .
              </>
            )}
          </p>
        )}
      </Card>

      <p className="text-sm text-ink-soft lg:col-span-2">
        Lieber allein?{" "}
        <Link href="/spielen" className="font-semibold text-ink underline decoration-sun decoration-2 underline-offset-2">
          Zum Tagesrätsel
        </Link>
      </p>
    </div>
  );
}
