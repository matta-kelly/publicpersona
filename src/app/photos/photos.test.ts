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

  test("is refused when it is any other text", () => {
    // Text before the id, text after it, and a first character that is no hexadecimal digit.
    expect(thumbnailRequest("../3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b", "thumbnail")).toEqual({
      refused: "id",
    });
    expect(thumbnailRequest("3f2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b/original", "thumbnail")).toEqual({
      refused: "id",
    });
    expect(thumbnailRequest("gf2b8c1e-9a4d-4e6f-8b1a-0c2d3e4f5a6b", "thumbnail")).toEqual({
      refused: "id",
    });
  });
});

describe("the size of a request", () => {
  test("is preview when the request gives preview", () => {
    expect(thumbnailRequest(ID, "preview")).toEqual({ id: ID, size: "preview" });
  });

  test("is refused when it is original", () => {
    // Immich has this size. The site does not hand it out.
    expect(thumbnailRequest(ID, "original")).toEqual({ refused: "size" });
  });
});

describe("the photos of an album", () => {
  test("keep the order the album gave, with the other assets taken out", () => {
    const photos = galleryPhotos([
      { ...asset, originalFileName: "c.jpg" },
      { ...asset, originalFileName: "clip.mov", type: "VIDEO" },
      { ...asset, originalFileName: "a.jpg" },
      { ...asset, originalFileName: "b.jpg" },
    ]);

    expect(photos.map((p) => p.originalFileName)).toEqual(["c.jpg", "a.jpg", "b.jpg"]);
  });
});
