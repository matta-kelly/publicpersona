import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest's default also matches *.spec.ts, and tests/*.spec.ts belongs to Playwright.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
