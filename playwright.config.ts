import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // The repo folder sits in a notes vault that loads every file in it, so nothing is written there.
  outputDir: "/tmp/publicpersona-playwright",
  reporter: "list",
  // A test left on .only would pass the checks while the others never ran.
  forbidOnly: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    // check.sh publishes the port of the image on this address.
    baseURL: "http://127.0.0.1:3210",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
