import { defineConfig, devices } from "@playwright/test";
import { hashPassword } from "./src/server/auth";

export const E2E_ADMIN_PASSWORD = "e2e-passwort-12345";
const PORT = 3100;

// Nutzt den installierten Microsoft Edge (kein separater Browser-Download nötig).
// Mit `PW_CHANNEL=chrome` bzw. `PW_CHANNEL=chromium` (nach `npx playwright install chromium`) umstellbar.
const channel = process.env.PW_CHANNEL ?? "msedge";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", locale: "de-DE", timezoneId: "Europe/Berlin" },
  projects: [
    { name: "desktop", testIgnore: /mobil\./, use: { ...devices["Desktop Chrome"], channel } },
    { name: "mobil", testMatch: /mobil\..*\.ts/, use: { ...devices["Pixel 7"], channel } },
  ],
  webServer: {
    command: `npx tsx e2e/prepare.ts && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 400_000,
    reuseExistingServer: false,
    env: {
      PGLITE_DIR: ".data/e2e",
      ALLOW_DEMO_CONTENT: "true",
      DEMO_AUTOSCHEDULE: "false",
      ADMIN_PASSWORD_HASH: hashPassword(E2E_ADMIN_PASSWORD, "e2esalt"),
      SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-1234",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
    },
  },
});
