import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameClient } from "@/components/game/game-client";

export const metadata: Metadata = {
  title: "Tagesrätsel als Übung",
  robots: { index: false, follow: true },
};

export default async function ArchivSpielPage({ params }: { params: Promise<{ nummer: string }> }) {
  const n = Number((await params).nummer);
  if (!Number.isInteger(n) || n < 1) notFound();
  return <GameClient packNumber={n} practice />;
}
