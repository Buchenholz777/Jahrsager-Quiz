"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { LogoLarge } from "@/components/logo";
import { loginAction, type FormState } from "../actions";

const initial: FormState = { messages: [] };

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <div className="mx-auto max-w-sm py-10">
      <LogoLarge className="mb-4 h-28" />
      <h1 className="text-3xl font-semibold">Redaktion</h1>
      <p className="mt-2 text-ink-soft">Geschützter Bereich. Bitte melde dich an.</p>
      <form action={action} className="mt-6 space-y-4">
        <div>
          <label htmlFor="pw" className="text-sm font-medium">Passwort</label>
          <input id="pw" name="password" type="password" required autoComplete="current-password" className="mt-1 h-12 w-full rounded-xl border-2 border-line bg-card px-3 focus:border-ink" />
        </div>
        {state.messages.length > 0 && <p role="alert" className="text-sm font-medium text-ink">{state.messages[0]}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Prüfe …" : "Anmelden"}</Button>
      </form>
    </div>
  );
}
