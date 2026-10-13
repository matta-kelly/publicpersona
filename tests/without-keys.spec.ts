import { expect, test } from "@playwright/test";

// check.sh starts the image with no secret, so the site has no Immich key.
// The page then stops before it calls Immich, and this test does not reach it.

test("shows that the photos are unavailable on /photos when the site has no Immich key", async ({
  page,
}) => {
  await page.goto("/photos");

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "Photos", exact: true })).toBeVisible();
  await expect(
    main.getByText("Photos unavailable right now. Try again later.", { exact: true }),
  ).toBeVisible();
});
