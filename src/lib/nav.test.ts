import { describe, expect, test } from "vitest";
import { isActiveLink } from "./nav";

// The links of the site are Home at /, Projects at /projects, Code at /code and Photos at /photos.

describe("the Home link", () => {
  test("is active on the home page", () => {
    expect(isActiveLink("/", "/")).toBe(true);
  });

  test("is not active on the page of another link", () => {
    expect(isActiveLink("/projects", "/")).toBe(false);
  });

  test("is not active on a page below another link", () => {
    expect(isActiveLink("/projects/stateball", "/")).toBe(false);
  });
});

describe("a link other than Home", () => {
  test("is active on its own page", () => {
    expect(isActiveLink("/projects", "/projects")).toBe(true);
  });

  test("is active on a page directly below its own", () => {
    expect(isActiveLink("/projects/stateball", "/projects")).toBe(true);
  });

  test("is active on a page two levels below its own", () => {
    expect(isActiveLink("/projects/stateball/models", "/projects")).toBe(true);
  });

  test("is active on its own page written with a slash at the end", () => {
    expect(isActiveLink("/projects/", "/projects")).toBe(true);
  });

  test("is not active on the home page", () => {
    expect(isActiveLink("/", "/projects")).toBe(false);
  });

  test("is not active on the page of another link", () => {
    expect(isActiveLink("/photos", "/projects")).toBe(false);
  });

  test("is not active on a page whose name only starts with the same letters", () => {
    expect(isActiveLink("/codex", "/code")).toBe(false);
  });

  test("is not active on a page below another link that has its name", () => {
    expect(isActiveLink("/projects/code", "/code")).toBe(false);
  });

  test("is not active on its own page written in another case", () => {
    expect(isActiveLink("/Projects", "/projects")).toBe(false);
  });
});

describe("a page that no link leads to", () => {
  test("has no active link", () => {
    expect(isActiveLink("/nope", "/")).toBe(false);
    expect(isActiveLink("/nope", "/projects")).toBe(false);
    expect(isActiveLink("/nope", "/code")).toBe(false);
    expect(isActiveLink("/nope", "/photos")).toBe(false);
  });
});

describe("a page below a link", () => {
  test("has that link as its only active link", () => {
    expect(isActiveLink("/projects/stateball", "/")).toBe(false);
    expect(isActiveLink("/projects/stateball", "/projects")).toBe(true);
    expect(isActiveLink("/projects/stateball", "/code")).toBe(false);
    expect(isActiveLink("/projects/stateball", "/photos")).toBe(false);
  });
});
