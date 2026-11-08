"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { importImageAction, type FormState } from "../actions";

const initial: FormState = { messages: [] };

export function ImportButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(importImageAction, initial);
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Wird geladen …" : "Kandidatenbild importieren"}
      </Button>
      <p className="mt-1 text-xs text-ink-soft">Lädt das Bild von upload.wikimedia.org, verarbeitet es und setzt den Status auf „noch zu prüfen“. Keine Freigabe.</p>
      <div aria-live="polite">
        {state.messages.map((m, i) => (
          <p key={i} role={state.ok ? "status" : "alert"} className={`mt-2 rounded-xl p-3 text-sm font-medium ${state.ok ? "bg-good-soft text-good" : "bg-sun-soft text-ink"}`}>{m}</p>
        ))}
      </div>
    </form>
  );
}
