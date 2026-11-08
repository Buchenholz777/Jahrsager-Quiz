import { OG_SIZE, ogCard } from "@/server/og";

export const alt = "JAHRSAGER – 5 Bilder. 5 Ereignisse. Rate das Jahr. Das tägliche Geschichtsquiz";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return ogCard({});
}
