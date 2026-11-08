import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  // `npm run build` ist der Pages-Build (ruft OpenNext auf) – OpenNext selbst baut mit reinem Next.
  buildCommand: "npm run build:next",
};
