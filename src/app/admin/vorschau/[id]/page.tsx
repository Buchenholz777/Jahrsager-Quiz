import { notFound } from "next/navigation";
import { requireAdminPage } from "@/server/admin-session";
import { getDb } from "@/server/db/client";
import { getEvent } from "@/server/services/events";
import { isUuid } from "@/server/services/games";
import type { RoundState } from "@/lib/game-types";
import { PreviewClient } from "./preview-client";

export const metadata = { title: "Vorschau" };

export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const e = await getEvent(await getDb(), id);
  if (!e) notFound();
  const round: RoundState = {
    position: 1,
    status: "getippt",
    eventId: e.id,
    question: {
      title: e.neutral_title,
      description: e.description,
      alt: e.image_alt,
      creditShort: e.image_credit_short,
      license: e.image_license,
      licenseUrl: e.image_license_url,
      image: { id: e.image_id ?? "", ext: e.image_ext ?? "svg", width: e.image_width ?? 1200, height: e.image_height ?? 800, placeholder: e.image_is_placeholder },
    },
    result: {
      guess: Math.min(2020, e.correct_year + 4),
      correct: e.correct_year,
      difference: Math.min(2020, e.correct_year + 4) - e.correct_year,
      points: 800,
      reveal: {
        publicTitle: e.public_title,
        what: e.explanation_what,
        why: e.explanation_why,
        detail: e.explanation_detail,
        sources: e.sources,
        creditFull: e.image_credit_full,
        license: e.image_license,
        licenseUrl: e.image_license_url,
        sourceUrl: e.image_source_url,
        isDemo: e.is_demo,
      },
    },
  };
  return (
    <div>
      <h1 className="text-3xl font-semibold">Vorschau (Spieleransicht)</h1>
      <p className="mt-1 text-sm text-ink-soft">Erst die Aufgabe, dann die Auflösung mit einem Beispieltipp. Nichts wird gespeichert.</p>
      <PreviewClient round={round} />
    </div>
  );
}
