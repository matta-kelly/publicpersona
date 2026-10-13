import { expect, test } from "@playwright/test";

test("links a tab icon from the home page that answers with a PNG image", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const href = await page.locator('link[rel="icon"][type="image/png"]').getAttribute("href", {
    timeout: 5_000,
  });

  const response = await request.get(href ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
});

// A browser asks for this address by itself when a document names no icon.
test("answers GET /favicon.ico with an icon image", async ({ request }) => {
  const response = await request.get("/favicon.ico");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/x-icon");
});
