import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 60000,
    hookTimeout: 120000,
    env: {
      DATABASE_URL: "",
      PGLITE_MEMORY: "1",
      ADMIN_PASSWORD: "test-passwort",
      ADMIN_PASSWORD_HASH: "",
      SESSION_SECRET: "test-secret-test-secret-test-secret-123",
      ALLOW_DEMO_CONTENT: "true",
      DEMO_AUTOSCHEDULE: "false",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      STORAGE_DRIVER: "local",
      ZEITSPUR_FAKE_NOW: "",
    },
  },
});
