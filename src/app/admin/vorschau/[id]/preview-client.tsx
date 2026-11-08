"use client";

import { useState } from "react";
import type { RoundState } from "@/lib/game-types";
import { RoundQuestion } from "@/components/game/round-question";
import { RoundReveal } from "@/components/game/round-reveal";
import { Button } from "@/components/ui/button";

export function PreviewClient({ round }: { round: RoundState }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="mt-6">
      <div className="mb-6 flex gap-2">
        <Button size="sm" variant={reveal ? "quiet" : "secondary"} onClick={() => setReveal(false)}>Aufgabe</Button>
        <Button size="sm" variant={reveal ? "secondary" : "quiet"} onClick={() => setReveal(true)}>Auflösung</Button>
      </div>
      {reveal ? (
        <RoundReveal round={round} total={5} gameId="preview" isLast={false} onNext={() => setReveal(false)} />
      ) : (
        <RoundQuestion round={{ ...round, result: undefined, status: "offen" }} total={5} busy={false} error={null} onGuess={() => setReveal(true)} onResolve={() => setReveal(true)} onRetry={() => undefined} />
      )}
    </div>
  );
}
