"use client";

import { Flag } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** „Fehler melden“ zu einem aufgelösten Ereignis (sachliche Hinweise an die Redaktion). */
export function ReportDialog({ eventId, gameId }: { eventId: string; gameId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/meldung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, gameId, message }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStatus("idle");
          ref.current?.showModal();
        }}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
      >
        <Flag className="size-4" aria-hidden="true" /> Fehler melden
      </button>
      <dialog ref={ref} className="m-auto w-[min(32rem,94vw)] rounded-card border border-line bg-card p-6 backdrop:bg-black/50" aria-labelledby={`${id}-t`}>
        <h2 id={`${id}-t`} className="text-xl font-semibold">
          Sachlichen Fehler melden
        </h2>
        {status === "done" ? (
          <div className="mt-4">
            <p>Danke! Wir prüfen deinen Hinweis. Bestätigte Fehler werden transparent korrigiert.</p>
            <Button className="mt-4" onClick={() => ref.current?.close()}>
              Schließen
            </Button>
          </div>
        ) : (
          <form onSubmit={send} className="mt-4">
            <label htmlFor={`${id}-m`} className="text-sm font-medium">
              Was stimmt nicht? (z. B. falsches Jahr, falsche Angabe, Bildzuordnung)
            </label>
            <textarea
              id={`${id}-m`}
              required
              minLength={5}
              maxLength={2000}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 w-full rounded-xl border-2 border-line bg-paper p-3 focus:border-ink"
            />
            {status === "error" && (
              <p role="alert" className="mt-2 text-sm font-medium text-ink">
                Das Senden hat nicht geklappt. Bitte versuche es später erneut.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Wird gesendet …" : "Hinweis senden"}
              </Button>
              <Button variant="ghost" onClick={() => ref.current?.close()}>
                Abbrechen
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
