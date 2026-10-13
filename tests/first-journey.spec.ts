import { expect, test } from "@playwright/test";

test("reaches the Stateball write-up from home, through the projects page", async ({ page }) => {
  await page.goto("/");
  const photo = page.getByRole("img", { name: "Matthew Kelly", exact: true });
  await expect(photo).toBeVisible();
  // A picture that did not load still has a place on the page; only its width tells the two apart.
  await expect
    .poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);

  await page.getByRole("navigation").getByRole("link", { name: "Projects", exact: true }).click();
  await expect(page).toHaveURL("/projects");
  await expect(
    page.getByRole("heading", { level: 1, name: "Projects", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("main")
    .getByRole("link", { name: /^Stateball/ })
    .click();
  await expect(page).toHaveURL("/projects/stateball");
  await expect(page.getByRole("heading", { level: 1, name: /^Stateball/ })).toBeVisible();
});
