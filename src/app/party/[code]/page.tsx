import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/page-header";
import { PartyRoom } from "@/components/party/party-room";

export const metadata: Metadata = {
  title: "Party",
  robots: { index: false, follow: false },
};

export default async function PartyRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <Container>
      <PageHeader eyebrow="Party" title="Deine Party" />
      <PartyRoom code={decodeURIComponent(code).toUpperCase().replace(/[^A-Z0-9]/g, "")} />
    </Container>
  );
}
