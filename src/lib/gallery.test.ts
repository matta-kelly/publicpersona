import { describe, expect, test } from "vitest";
import { galleryStep, pictureAddress } from "./gallery";

// The open photo is its place in the list, from 0; null is the gallery with no photo open.
// The last argument is the number of photos in the gallery.

describe("opening a photo", () => {
  test("opens a photo in the middle when it is chosen", () => {
    expect(galleryStep(null, { type: "open", index: 2 }, 5)).toBe(2);
  });

  test("opens the photo that is chosen when another one is open", () => {
    expect(galleryStep(1, { type: "open", index: 3 }, 5)).toBe(3);
  });
});

describe("closing", () => {
  test("leaves no photo open", () => {
    expect(galleryStep(2, { type: "close" }, 5)).toBe(null);
  });

  test("changes nothing when no photo is open", () => {
    expect(galleryStep(null, { type: "close" }, 5)).toBe(null);
  });
});

describe("next", () => {
  test("opens the photo after the open one", () => {
    expect(galleryStep(0, { type: "next" }, 5)).toBe(1);
  });

  test("opens the first photo from the last one", () => {
    expect(galleryStep(4, { type: "next" }, 5)).toBe(0);
  });

  test("changes nothing when no photo is open", () => {
    expect(galleryStep(null, { type: "next" }, 5)).toBe(null);
  });
});

describe("previous", () => {
  test("opens the photo before the open one", () => {
    expect(galleryStep(3, { type: "previous" }, 5)).toBe(2);
  });

  test("opens the last photo from the first one", () => {
    expect(galleryStep(0, { type: "previous" }, 5)).toBe(4);
  });

  test("changes nothing when no photo is open", () => {
    expect(galleryStep(null, { type: "previous" }, 5)).toBe(null);
  });
});

describe("the Escape key", () => {
  test("closes the open photo", () => {
    expect(galleryStep(2, { type: "key", key: "Escape" }, 5)).toBe(null);
  });
});

describe("the right arrow key", () => {
  test("opens the photo after the open one", () => {
    expect(galleryStep(2, { type: "key", key: "ArrowRight" }, 5)).toBe(3);
  });
});

describe("the left arrow key", () => {
  test("opens the photo before the open one", () => {
    expect(galleryStep(2, { type: "key", key: "ArrowLeft" }, 5)).toBe(1);
  });
});

describe("any other key", () => {
  test("leaves the open photo open", () => {
    expect(galleryStep(2, { type: "key", key: "a" }, 5)).toBe(2);
    expect(galleryStep(2, { type: "key", key: "Enter" }, 5)).toBe(2);
    expect(galleryStep(2, { type: "key", key: "ArrowUp" }, 5)).toBe(2);
    expect(galleryStep(2, { type: "key", key: "ArrowDown" }, 5)).toBe(2);
  });

  test("opens no photo when none is open", () => {
    expect(galleryStep(null, { type: "key", key: "Enter" }, 5)).toBe(null);
  });
});

describe("the address of a picture", () => {
  test("asks for the thumbnail of the photo, in the grid", () => {
    expect(pictureAddress("3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b", "grid")).toBe(
      "/photos/img/3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b?size=thumbnail",
    );
  });

  test("asks for the preview of the photo, when the photo is open", () => {
    expect(pictureAddress("3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b", "open")).toBe(
      "/photos/img/3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b?size=preview",
    );
  });
});
