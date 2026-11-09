import type { Metadata } from "next";
import { GameClient } from "@/components/game/game-client";

export const metadata: Metadata = {
  title: "Tagesrätsel spielen",
  description: "Fünf historische Fotos, fünf Jahre schätzen: das tägliche Geschichtsrätsel von JAHRSAGER.",
  robots: { index: false, follow: true }, // Spielzustände werden nicht indexiert
};

export default async function SpielenPage({ searchParams }: { searchParams: Promise<{ uebung?: string }> }) {
  const sp = await searchParams;
  return <GameClient practice={sp.uebung === "1"} />;
}
