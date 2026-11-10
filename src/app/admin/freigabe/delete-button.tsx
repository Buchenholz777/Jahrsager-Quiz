"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { deleteDraftAction } from "../actions";

/** Löschen ohne Rückfrage. Liegt im Formular des Entwurfs (nutzt dessen id), ohne Pflichtfelder. Die Seite scrollt nicht nach oben. */
export function DeleteButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <>
      <button
        type="submit"
        formNoValidate
        disabled={pending}
        className={buttonVariants({ size: "sm", variant: "secondary" })}
        formAction={(fd: FormData) =>
          start(async () => {
            const r = await deleteDraftAction(fd);
            setError(r.ok ? "" : r.message);
          })
        }
      >
        <Trash2 className="size-4" aria-hidden="true" /> {pending ? "Wird gelöscht …" : "Löschen"}
      </button>
      {error && (
        <p role="alert" className="basis-full text-sm font-semibold">
          {error}
        </p>
      )}
    </>
  );
}
