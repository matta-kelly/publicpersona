import { describe, expect, test } from "vitest";
import { galleryPhotos, thumbnailRequest, type AlbumAsset } from "./photos";

// An asset id as Immich gives it: 8, 4, 4, 4 and 12 hexadecimal digits, with a hyphen between.
const ID = "3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b";

// An image with nothing special about it. A test names only the fields its promise is about.
const asset: AlbumAsset = {
  id: ID,
  type: "IMAGE",
  originalFileName: "IMG_0001.jpg",
  width: 4032,
  height: 3024,
};

describe("the asset id of a request", () => {
  test("is accepted as 8, 4, 4, 4 and 12 hexadecimal digits with a hyphen between", () => {
    expect(thumbnailRequest("3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b", "thumbnail")).toEqual({
      id: "3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b",
      size: "thumbnail",
    });
  });

  test("is accepted with its letters in upper case, and goes on as it was given", () => {
    expect(thumbnailRequest("3F2B8C1E-9A4D-4E6F-8B1A-0C2D3E4F5A6B", "thumbnail")).toEqual({
      id: "3F2B8C1E-9A4D-4E6F-8B1A-0C2D3E4F5A6B",
      size: "thumbnail",
    });
  });

  test("is accepted whatever the version of the UUID", () => {
    // The third group starts with 7: a version 7 UUID. Immich gives version 4 today.
    expect(thumbnailRequest("0192f3a4-5b6c-7d8e-9f01-23456789abcd", "thumbnail")).toEqual({
      id: "0192f3a4-5b6c-7d8e-9f01-23456789abcd",
      size: "thumbnail",
    });
  });

  test("is refused when it is empty", () => {
    expect(thumbnailRequest("", "thumbnail")).toEqual({ refused: "id" });
  });

  test("is refused when it is one digit short", () => {
    // The last group has 11 digits.
    expect(thumbnailRequest("3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6", "thumbnail")).toEqual({
      refused: "id",
    });
  });

  test("is refused when it is one digit long", () => {
    // The last group has 13 digits.
    expect(thumbnailRequest("3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b7", "thumbnail")).toEqual({
      refused: "id",
    });
  });

  test("is refused when it has no hyphens", () => {
    expect(thumbnailRequest("3f2b8c1e9a4d4e6f8b1a0c2d3e4f5a6b", "thumbnail")).toEqual({
      refused: "id",
    });
  });

  test("is refused when a hyphen is in another place", () => {
    // Groups of 9, 3, 4, 4 and 12: the same 36 characters, with the first hyphen one place later.
    expect(thumbnailRequest("3f2b8c1e9-a4d-4e6f-8b1a-0c2d3e4f5a6b", "thumbnail")).toEqual({
      refused: "id",
    });
  });

  test("is refused when it holds a letter after f", () => {
    // The first character is g.
    expect(thumbnailRequest("gf2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b", "thumbnail")).toEqual({
      refused: "id",
    });
  });

  test("is refused when text comes before it", () => {
    expect(thumbnailRequest("../3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b", "thumbnail")).toEqual({
      refused: "id",
    });
  });

  test("is refused when text comes after it", () => {
    expect(thumbnailRequest("3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b/original", "thumbnail")).toEqual({
      refused: "id",
    });
  });

  test("is refused when a space comes before it", () => {
    expect(thumbnailRequest(" 3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b", "thumbnail")).toEqual({
      refused: "id",
    });
  });

  test("is refused when a line end comes after it", () => {
    expect(thumbnailRequest("3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b\n", "thumbnail")).toEqual({
      refused: "id",
    });
  });

  test("is refused when it is in braces", () => {
    expect(thumbnailRequest("{3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b}", "thumbnail")).toEqual({
      refused: "id",
    });
  });
});

describe("the size of a request", () => {
  test("is thumbnail when the request gives thumbnail", () => {
    expect(thumbnailRequest(ID, "thumbnail")).toEqual({ id: ID, size: "thumbnail" });
  });

  test("is preview when the request gives preview", () => {
    expect(thumbnailRequest(ID, "preview")).toEqual({ id: ID, size: "preview" });
  });

  test("is thumbnail when the request gives no size", () => {
    expect(thumbnailRequest(ID, null)).toEqual({ id: ID, size: "thumbnail" });
  });

  test("is refused when it is fullsize", () => {
    // Immich has this size. The site does not hand it out.
    expect(thumbnailRequest(ID, "fullsize")).toEqual({ refused: "size" });
  });

  test("is refused when it is original", () => {
    // Immich has this size. The site does not hand it out.
    expect(thumbnailRequest(ID, "original")).toEqual({ refused: "size" });
  });

  test("is refused when it is empty", () => {
    expect(thumbnailRequest(ID, "")).toEqual({ refused: "size" });
  });

  test("is refused when it is an allowed size in another case", () => {
    expect(thumbnailRequest(ID, "Preview")).toEqual({ refused: "size" });
  });

  test("is refused when a space comes before an allowed size", () => {
    expect(thumbnailRequest(ID, " preview")).toEqual({ refused: "size" });
  });

  test("is refused when it is the name of something every object has", () => {
    expect(thumbnailRequest(ID, "constructor")).toEqual({ refused: "size" });
  });
});

describe("a request with a bad id and a bad size", () => {
  test("is refused for its id", () => {
    expect(thumbnailRequest("not-an-id", "fullsize")).toEqual({ refused: "id" });
  });
});

describe("the photos of an album", () => {
  test("hold an asset of the type IMAGE", () => {
    const photos = galleryPhotos([{ ...asset, type: "IMAGE" }]);

    expect(photos).toEqual([
      { id: ID, originalFileName: "IMG_0001.jpg", width: 4032, height: 3024 },
    ]);
  });

  test("leave out a video", () => {
    const photos = galleryPhotos([{ ...asset, type: "VIDEO" }]);

    expect(photos).toEqual([]);
  });

  test("leave out an asset of the type AUDIO, and one of the type OTHER", () => {
    const photos = galleryPhotos([
      { ...asset, type: "AUDIO" },
      { ...asset, type: "OTHER" },
    ]);

    expect(photos).toEqual([]);
  });

  test("leave out an asset of a type that is not one of Immich's four", () => {
    // A type in lower case, and one Immich does not have.
    const photos = galleryPhotos([
      { ...asset, type: "image" },
      { ...asset, type: "LIVE_PHOTO" },
    ]);

    expect(photos).toEqual([]);
  });

  test("keep the order the album gave, with the other assets taken out", () => {
    const photos = galleryPhotos([
      { ...asset, originalFileName: "c.jpg" },
      { ...asset, originalFileName: "clip.mov", type: "VIDEO" },
      { ...asset, originalFileName: "a.jpg" },
      { ...asset, originalFileName: "b.jpg" },
    ]);

    expect(photos.map((p) => p.originalFileName)).toEqual(["c.jpg", "a.jpg", "b.jpg"]);
  });

  test("give the id, file name, width and height of an image as the album gave them, and nothing else", () => {
    // An album asset from Immich holds more than the gallery shows: here, the moment it was taken.
    const fromImmich = {
      id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      type: "IMAGE",
      originalFileName: "PXL_20260704_183000.jpg",
      width: 3072,
      height: 4080,
      fileCreatedAt: "2026-07-04T18:30:00.000Z",
    };

    const photos = galleryPhotos([fromImmich]);

    expect(photos).toEqual([
      {
        id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        originalFileName: "PXL_20260704_183000.jpg",
        width: 3072,
        height: 4080,
      },
    ]);
  });

  test("are an empty list for an album with no asset", () => {
    expect(galleryPhotos([])).toEqual([]);
  });

  test("are an empty list for an album with no image", () => {
    const photos = galleryPhotos([
      { ...asset, type: "VIDEO" },
      { ...asset, type: "VIDEO" },
    ]);

    expect(photos).toEqual([]);
  });
});
