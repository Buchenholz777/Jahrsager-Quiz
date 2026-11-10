import Link from "next/link";
import { CalendarCheck, Infinity as InfinityIcon, PartyPopper } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";

/** Modusauswahl: Tagesrätsel und Party sind direkt erreichbar; „Endlos“ ist eine Vorschau und startet kein Spiel. */
export function ModeSelect() {
  return (
    <section aria-labelledby="modi" className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-14" data-testid="mode-select">
      <h2 id="modi" className="text-3xl font-bold sm:text-4xl">
        Wie möchtest du spielen?
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col p-5 sm:p-6">
          <CalendarCheck className="size-7" aria-hidden="true" />
          <h3 className="mt-3 text-2xl font-bold">Tagesrätsel</h3>
          <p className="mt-2 flex-1 text-ink-soft">Fünf Ereignisse, fünf Schätzungen. Jeden Tag neu, für alle gleich.</p>
          <Link href="/spielen" className={buttonVariants({ className: "mt-4 w-full" })}>
            Tagesrätsel spielen
          </Link>
        </Card>
        <Card className="flex flex-col p-5 sm:p-6">
          <PartyPopper className="size-7" aria-hidden="true" />
          <h3 className="mt-3 text-2xl font-bold">Party</h3>
          <p className="mt-2 flex-1 text-ink-soft">Mit Freunden: dieselben Fragen, ein Einladungslink oder Code, jede Person spielt, wann sie Zeit hat.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            <Link href="/party" className={buttonVariants({ variant: "secondary", className: "w-full" })} data-testid="home-party-create">
              Party erstellen
            </Link>
            <Link href="/party" className={buttonVariants({ variant: "quiet", className: "w-full" })} data-testid="home-party-join">
              Party beitreten
            </Link>
          </div>
        </Card>
        <Card className="flex flex-col border-dashed bg-paper-2/60 p-5 sm:p-6" data-testid="mode-endless" aria-disabled="true">
          <InfinityIcon className="size-7 text-ink-soft" aria-hidden="true" />
          <h3 className="mt-3 flex flex-wrap items-center gap-2 text-2xl font-bold">
            Endlos <Badge tone="warn">Bald verfügbar</Badge>
          </h3>
          <p className="mt-2 flex-1 text-ink-soft">Vorschau: Spiele so viele Runden, wie du möchtest. Der Modus startet noch nicht.</p>
          <span className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full border-2 border-dashed border-line-strong px-5 text-base font-semibold text-ink-soft" role="note">
            Noch nicht spielbar
          </span>
        </Card>
      </div>
    </section>
  );
}
