import { describe, expect, test } from "vitest";
import { isActiveLink } from "./nav";

// The links of the site are Home at /, Projects at /projects, Code at /code and Photos at /photos.

describe("the Home link", () => {
  test("is not active on the page of another link", () => {
    expect(isActiveLink("/projects", "/")).toBe(false);
  });
});

describe("a link other than Home", () => {
  test("is active on its own page", () => {
    expect(isActiveLink("/projects", "/projects")).toBe(true);
  });

  test("is active on a page directly below its own", () => {
    expect(isActiveLink("/projects/stateball", "/projects")).toBe(true);
  });
});
