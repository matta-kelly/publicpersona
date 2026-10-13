import { expect, test } from "@playwright/test";

// Neither test follows the link or the redirect, so neither one reaches GitHub.

test("offers a link named GitHub to my profile in the nav", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("navigation").getByRole("link", { name: "GitHub", exact: true }),
  ).toHaveAttribute("href", "https://github.com/matta-kelly");
});

test("sends a visitor of /code to my GitHub profile", async ({ request }) => {
  const response = await request.get("/code", { maxRedirects: 0 });

  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toBe("https://github.com/matta-kelly");
});
