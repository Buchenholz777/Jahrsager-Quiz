import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Users } from "lucide-react";
import { Container } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { getDb } from "@/server/db/client";
import { getPublicPack } from "@/server/services/packs";
import { todayKey } from "@/server/clock";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = Number((await params).nummer);
  return {
    title: `Tagesrätsel #${n}`,
    description: `Fünf historische Fotos, fünf Jahre schätzen. Spiele Tagesrätsel #${n} und vergleiche dein Ergebnis mit deinen Freunden.`,
    // Einstiegsseite für geteilte Links, nicht für die Suche gedacht (vermeidet inhaltsarme Duplikate)
    robots: { index: false, follow: true },
    alternates: { canonical: "/spielen" },
  };
}

/** Landeseite für geteilte Links und Freundesherausforderungen – spoilerfrei. */
export default async function TagesraetselLanding({ params }: Props) {
  const n = Number((await params).nummer);
  if (!Number.isInteger(n) || n < 1) notFound();
  const db = await getDb();
  const pack = await getPublicPack(db, n);
  if (!pack) notFound();
  const isToday = pack.pack.pack_date === todayKey();
  return (
    <Container>
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>Du wurdest herausgefordert</Eyebrow>
        <h1 className="mt-3 text-5xl font-semibold">Tagesrätsel #{n}</h1>
        <p className="mx-auto mt-5 max-w-lg text-xl text-ink-soft">
          Fünf historische Fotos, fünf Jahre schätzen. Wer liegt näher an der Wahrheit – du oder deine Freunde?
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href={isToday ? "/spielen" : `/archiv/${n}`} className={buttonVariants({ size: "lg" })}>
            {isToday ? "Jetzt Tagesrätsel spielen" : `Tagesrätsel #${n} spielen`}
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
          <p className="text-sm text-ink-soft">Kostenlos und ohne Anmeldung · etwa 5 Minuten</p>
        </div>
        <Card className="mt-12 p-6 text-left">
          <p className="flex items-center gap-2 font-display text-xl font-semibold">
            <Users className="size-5 text-ink" aria-hidden="true" /> So läuft’s
          </p>
          <p className="mt-2 text-ink-soft">
            Du siehst ein Foto und eine kurze Beschreibung und schätzt das Jahr. Je näher dein Tipp, desto mehr Punkte (bis zu 1.000 pro Ereignis, 5.000 insgesamt).
            Danach vergleichst du deine Punkte – ohne dass Lösungen verraten werden.
          </p>
        </Card>
      </div>
    </Container>
  );
}
