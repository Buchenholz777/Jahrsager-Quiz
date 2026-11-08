import { OG_SIZE, ogCard } from "@/server/og";

export const alt = "JAHRSAGER Tagesrätsel – Schaffst du mehr?";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ nummer: string }> }) {
  const n = Number((await params).nummer);
  return ogCard({
    headline: "Schaffst du mehr?",
    sub: "5 Bilder. 5 Ereignisse. Rate das Jahr.",
    badge: Number.isInteger(n) ? `Tagesrätsel #${n}` : "Tagesrätsel",
  });
}
