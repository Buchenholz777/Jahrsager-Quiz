import type { MetadataRoute } from "next";

/** PWA-Grundlage (installierbar vorbereitet; kein Service Worker im ersten Release). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JAHRSAGER – Das tägliche Geschichtsquiz",
    short_name: "JAHRSAGER",
    description: "5 Bilder. 5 Ereignisse. Rate das Jahr.",
    start_url: "/spielen",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#f7f5ef",
    lang: "de",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
