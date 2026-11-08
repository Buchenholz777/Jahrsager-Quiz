"use client";

import { Container } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container>
      <div className="mx-auto max-w-xl text-center" role="alert">
        <h1 className="text-3xl font-semibold">Da ist etwas schiefgelaufen</h1>
        <p className="mt-3 text-ink-soft">Dein Spielstand ist gespeichert. Bitte versuche es noch einmal.</p>
        <Button className="mt-6" onClick={reset}>
          Erneut versuchen
        </Button>
      </div>
    </Container>
  );
}
