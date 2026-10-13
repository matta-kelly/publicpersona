import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest's default also matches *.spec.ts, and tests/*.spec.ts belongs to Playwright.
    include: ["src/**/*.test.{ts,tsx}"],
    // The pipeline's clock is on UTC, where a rule that reads the local time gives the UTC answer.
    // San Diego is never on UTC, so there it gives a different one, and a test fails.
    env: { TZ: "America/Los_Angeles" },
    // A test left on .only would pass the checks while the others never ran.
    // Vitest's default refuses it only in the pipeline.
    allowOnly: false,
  },
});
