"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { scheduleAction, type FormState } from "../actions";

const initial: FormState = { messages: [] };
const input = "mt-1 w-full rounded-xl border-2 border-line bg-card px-3 py-2.5 focus:border-ink";

export function ScheduleForm({ events, minDate, defaultDate }: { events: { id: string; label: string }[]; minDate: string; defaultDate: string }) {
  const [state, action, pending] = useActionState(scheduleAction, initial);
  return (
    <form action={action} className="mt-4 space-y-4">
      <label className="block max-w-xs">
        <span className="text-sm font-semibold">Datum (Europe/Berlin)</span>
        <input type="date" name="date" required min={minDate} defaultValue={defaultDate} className={input} />
      </label>
      {[1, 2, 3, 4, 5].map((i) => (
        <label key={i} className="block">
          <span className="text-sm font-semibold">Position {i}</span>
          <select name={`event${i}`} required defaultValue="" className={input}>
            <option value="" disabled>Ereignis wählen …</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
        </label>
      ))}
      <div aria-live="polite">
        {state.messages.map((m, i) => (
          <p key={i} role={state.ok ? "status" : "alert"} className={`rounded-xl p-3 text-sm font-medium ${state.ok ? "bg-good-soft text-good" : "bg-sun-soft text-ink"}`}>{m}</p>
        ))}
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Wird geplant …" : "Paket einplanen"}</Button>
    </form>
  );
}
