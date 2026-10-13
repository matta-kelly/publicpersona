import { expect, test, type Locator } from "@playwright/test";

// Every number is in CSS pixels. The column of the site is 768 wide at most, with 24 of padding
// on each side: on a phone 375 wide it runs from 24 to 351, on a desktop 1280 wide from 280 to 1000.
const phone = { width: 375, height: 812 };
const desktop = { width: 1280, height: 800 };

/** The box of the one element that the locator finds. */
async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (found === null) throw new Error("the element has no box: it is not shown");
  return found;
}

/** The shorter side of the element's box: a finger needs 44 each way. */
async function shorterSide(locator: Locator) {
  const { width, height } = await box(locator);
  return Math.min(width, height);
}

/** Where the letters are, which is not where the link's box is when the box has room around them. */
async function letters(locator: Locator) {
  return locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const { top, bottom, right } = range.getBoundingClientRect();
    return { top, bottom, right };
  });
}

test("keeps the two nav icons at the right edge of the column on a phone", async ({ page }) => {
  await page.setViewportSize(phone);
  await page.goto("/");
  const nav = page.getByRole("navigation");
  const name = await box(nav.getByRole("link", { name: "Matthew Kelly", exact: true }));
  const github = await box(nav.getByRole("link", { name: "GitHub", exact: true }));
  const theme = await box(nav.getByRole("button", { name: "Toggle theme", exact: true }));

  expect(theme.x + theme.width).toBeCloseTo(351, 0);
  expect(github.x + github.width).toBeCloseTo(theme.x, 0);
  // On the row of the name, not on the row of the links below it.
  expect(theme.y + theme.height / 2).toBeCloseTo(name.y + name.height / 2, 0);
  expect(github.y + github.height / 2).toBeCloseTo(name.y + name.height / 2, 0);
});

test("puts the name, the links and the icons on one row on a desktop", async ({ page }) => {
  await page.setViewportSize(desktop);
  await page.goto("/");
  const nav = page.getByRole("navigation");
  const name = await box(nav.getByRole("link", { name: "Matthew Kelly", exact: true }));
  const photos = await box(nav.getByRole("link", { name: "Photos", exact: true }));
  const github = await box(nav.getByRole("link", { name: "GitHub", exact: true }));
  const theme = await box(nav.getByRole("button", { name: "Toggle theme", exact: true }));

  expect(name.x).toBeCloseTo(280, 0);
  expect(theme.x + theme.width).toBeCloseTo(1000, 0);
  expect(github.x + github.width).toBeCloseTo(theme.x, 0);
  expect(photos.x + photos.width).toBeLessThanOrEqual(github.x);
  expect(photos.y + photos.height / 2).toBeCloseTo(name.y + name.height / 2, 0);
  expect(theme.y + theme.height / 2).toBeCloseTo(name.y + name.height / 2, 0);
});

test("gives each link of the nav, the footer and the way back a box that a finger can hit", async ({
  page,
}) => {
  await page.setViewportSize(phone);
  // A write-up has all three: the nav, the footer, and the link back to the projects.
  await page.goto("/projects/stateball");
  const nav = page.getByRole("navigation");
  const footer = page.getByRole("contentinfo");

  expect(
    await shorterSide(nav.getByRole("link", { name: "Matthew Kelly", exact: true })),
  ).toBeGreaterThanOrEqual(44);
  expect(
    await shorterSide(nav.getByRole("link", { name: "Home", exact: true })),
  ).toBeGreaterThanOrEqual(44);
  expect(
    await shorterSide(nav.getByRole("link", { name: "Projects", exact: true })),
  ).toBeGreaterThanOrEqual(44);
  expect(
    await shorterSide(nav.getByRole("link", { name: "Photos", exact: true })),
  ).toBeGreaterThanOrEqual(44);
  expect(
    await shorterSide(nav.getByRole("link", { name: "GitHub", exact: true })),
  ).toBeGreaterThanOrEqual(44);
  expect(
    await shorterSide(nav.getByRole("button", { name: "Toggle theme", exact: true })),
  ).toBeGreaterThanOrEqual(44);
  expect(
    await shorterSide(footer.getByRole("link", { name: "email", exact: true })),
  ).toBeGreaterThanOrEqual(44);
  expect(
    await shorterSide(footer.getByRole("link", { name: "linkedin", exact: true })),
  ).toBeGreaterThanOrEqual(44);
  expect(
    await shorterSide(
      page.getByRole("main").getByRole("link", { name: "← Projects", exact: true }),
    ),
  ).toBeGreaterThanOrEqual(44);
});

test("leaves the gap of the header between the way back and the title of a write-up", async ({
  page,
}) => {
  await page.setViewportSize(phone);
  await page.goto("/projects/stateball");
  const main = page.getByRole("main");
  const wayBack = await letters(main.getByRole("link", { name: "← Projects", exact: true }));
  const title = await box(main.getByRole("heading", { level: 1 }));

  // 16 is the gap between the title and the line under it. The letters of the way back are
  // 16 tall in a line 20 tall, so they end 2 above the line's own edge.
  expect(title.y - wayBack.bottom).toBeGreaterThanOrEqual(16);
  expect(title.y - wayBack.bottom).toBeLessThanOrEqual(20);
});

test("spaces the paragraphs of the Sabermetric write-up 16 apart, as the other write-ups do", async ({
  page,
}) => {
  await page.setViewportSize(desktop);
  await page.goto("/projects/sabermetric-networks");
  const main = page.getByRole("main");
  const first = await box(
    main.getByText("Traditional baseball stats are agnostic to game impact."),
  );
  const second = await box(main.getByText("This project models the 2023 MLB season"));

  expect(second.y - (first.y + first.height)).toBeCloseTo(16, 0);
});

test("keeps a page title of one long word inside the column on a phone", async ({ page }) => {
  await page.setViewportSize(phone);
  await page.goto("/photos");
  const title = page.getByRole("main").getByRole("heading", { level: 1 });
  // The title of /photos is the name of the album, which Immich gives, and check.sh starts
  // the site with no Immich key. So the test writes the name that the album has into the
  // title: the letters are then laid out by the site's own styles, as on the live page.
  await title.evaluate((heading) => {
    heading.textContent = "sentimentalsunshine";
  });

  expect((await letters(title)).right).toBeLessThanOrEqual(351);
});

test("fits every page in the width of a phone, with nothing to scroll sideways", async ({
  page,
}) => {
  await page.setViewportSize(phone);
  const widthOfThePage = () => page.evaluate(() => document.documentElement.scrollWidth);

  await page.goto("/");
  expect(await widthOfThePage()).toBe(375);
  await page.goto("/projects");
  expect(await widthOfThePage()).toBe(375);
  await page.goto("/projects/stateball");
  expect(await widthOfThePage()).toBe(375);
  await page.goto("/projects/dazoo");
  expect(await widthOfThePage()).toBe(375);
  await page.goto("/projects/sabermetric-networks");
  expect(await widthOfThePage()).toBe(375);
  await page.goto("/photos");
  expect(await widthOfThePage()).toBe(375);
});
