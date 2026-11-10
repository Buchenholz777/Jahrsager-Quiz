import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/page-header";
import { PartyHub } from "@/components/party/party-hub";

export const metadata: Metadata = {
  title: "Party – gemeinsam Geschichte raten",
  description: "Erstelle eine Party oder tritt mit einem Code bei: dieselben fünf Ereignisse für alle, ohne Anmeldung.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/party" },
};

export default function PartyPage() {
  return (
    <Container>
      <PageHeader eyebrow="Party" title="Gemeinsam spielen" lead="Lade Freunde ein: Alle schätzen dieselben fünf Ereignisse und vergleichen am Ende ihre Punkte – jede Person, wann sie Zeit hat." />
      <PartyHub />
    </Container>
  );
}
