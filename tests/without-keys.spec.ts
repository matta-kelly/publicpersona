import { expect, test } from "@playwright/test";

// check.sh starts the image with no secret, so the site has no GitHub token and no Immich key.
// Each page then stops before it calls its outside service, and these tests reach neither one.

test("shows where the code is, and that the activity is unavailable, on /code when the site has no GitHub token", async ({
  page,
}) => {
  await page.goto("/code");

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "Code", exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/matta-kelly",
  );
  await expect(
    main.getByText("Activity unavailable right now. Try again later.", { exact: true }),
  ).toBeVisible();
});

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
