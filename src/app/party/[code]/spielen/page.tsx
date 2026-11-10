import type { Metadata } from "next";
import { GameClient } from "@/components/game/game-client";

export const metadata: Metadata = {
  title: "Party spielen",
  robots: { index: false, follow: false },
};

export default async function PartySpielenPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <GameClient partyCode={decodeURIComponent(code).toUpperCase().replace(/[^A-Z0-9]/g, "")} />;
}
