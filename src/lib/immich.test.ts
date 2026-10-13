import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getShare, getThumbnail, type Thumbnail } from "./immich";
import album from "./immich-captured/album.json";
import shareLink from "./immich-captured/share-link.json";
import shareLinkWrongKey from "./immich-captured/share-link-wrong-key.json";
import thumbnail from "./immich-captured/thumbnail.json";
import thumbnailIdWithAPath from "./immich-captured/thumbnail-id-with-a-path.json";
import thumbnailNotInShare from "./immich-captured/thumbnail-not-in-share.json";
import thumbnailWrongKey from "./immich-captured/thumbnail-wrong-key.json";

// The share key the tests give the client. It is no key of Immich: every answer is a captured one.
const KEY = "the-share-key-of-the-tests";

// One call to the live Immich and its answer, as a file under immich-captured/ holds it.
// The share key was taken out of the call when it was captured.
interface Captured {
  request: { method: string; url: string; query: Record<string, string> };
  response: {
    status: number;
    headers: Record<string, string>;
    body?: unknown;
    bodyFile?: string;
  };
}

// The calls of the client that no captured answer is for.
let unanswered: string[];

// Puts captured answers in the place of Immich. A call gets the answer that was captured for
// that method, address and query, and only when it also carries the share key.
function immichAnswers(...captured: Captured[]) {
  vi.stubGlobal("fetch", async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    const method = init?.method ?? "GET";
    const query = Object.fromEntries(url.searchParams);
    const match = captured.find(
      ({ request }) =>
        request.method === method &&
        request.url === url.origin + url.pathname &&
        isDeepStrictEqual(query, { ...request.query, key: KEY }),
    );
    if (!match) {
      unanswered.push(`${method} ${input}`);
      throw new TypeError("no captured answer for this call");
    }
    const { status, headers, body, bodyFile } = match.response;
    const sent = bodyFile
      ? readFileSync(new URL(`./immich-captured/${bodyFile}`, import.meta.url))
      : JSON.stringify(body);
    return new Response(sent, { status, headers });
  });
}

beforeEach(() => {
  unanswered = [];
  vi.stubEnv("IMMICH_SHARE_KEY", KEY);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  // The client hides a call that fails, so a call Immich was never seen to answer is caught here.
  expect(unanswered).toEqual([]);
});

describe("the album of the share", () => {
  test("has the name of the album, and of each asset the id, type, file name, width and height, in the order Immich gave", async () => {
    immichAnswers(shareLink, album);

    const share = await getShare();

    // The captured album holds its first three assets. Immich sends more of each one:
    // the path of the file, the camera, the place. None of that is in the result.
    expect(share).toEqual({
      albumName: "sentimentalsunshine",
      assets: [
        {
          id: "275b5255-cd18-4df2-bf4f-589145fa32fb",
          type: "IMAGE",
          originalFileName: "9-000098590004.jpg",
          width: 3089,
          height: 2048,
        },
        {
          id: "3d8aeec1-38a1-45f8-9c70-0cad6877ca95",
          type: "IMAGE",
          originalFileName: "2-000098590028.jpg",
          width: 2985,
          height: 1979,
        },
        {
          id: "6d3f8b33-7228-4fd0-9402-3ea789b7183f",
          type: "IMAGE",
          originalFileName: "2-000088200007.jpg",
          width: 2892,
          height: 1917,
        },
      ],
    });
  });

  test("fails with the call and the status, and nothing else, when Immich answers with a failure", async () => {
    // Immich answered 401 to a share key it does not know.
    immichAnswers(shareLinkWrongKey);

    const failure = await getShare().catch((error: Error) => error.message);

    expect(failure).toBe("Immich /api/shared-links/me: 401");
  });
});

describe("the picture of a request", () => {
  test("is the bytes, the content type and the etag that Immich sent", async () => {
    immichAnswers(thumbnail);

    const picture = await getThumbnail({
      id: "fbe63138-5d28-4273-a650-8fca7f097640",
      size: "thumbnail",
    });

    expect(picture).toEqual({
      body: expect.any(ReadableStream),
      contentType: "image/webp",
      etag: 'W/"37f4-19c54d20d0d"',
    });
    const bytes = await new Response((picture as Thumbnail).body).arrayBuffer();
    // The SHA-256 of immich-captured/thumbnail.webp, by sha256sum.
    expect(createHash("sha256").update(new Uint8Array(bytes)).digest("hex")).toBe(
      "d5aaccd2a8c35b7aba5a44fc518a26977c5decd000f27fb8c91c88a6d6059c34",
    );
  });

  test("is not found when Immich answers 400: the share does not hold the asset", async () => {
    // This call was captured with the size preview, and the one above with thumbnail.
    // So a client that asks for another size than the request gives gets no answer.
    immichAnswers(thumbnailNotInShare);

    const picture = await getThumbnail({
      id: "00000000-0000-4000-8000-000000000000",
      size: "preview",
    });

    expect(picture).toEqual({ failed: "not-found" });
  });

  test("is an upstream failure when Immich answers with any other failure", async () => {
    // Immich answered 401 to a share key it does not know.
    immichAnswers(thumbnailWrongKey);

    const picture = await getThumbnail({
      id: "fbe63138-5d28-4273-a650-8fca7f097640",
      size: "thumbnail",
    });

    expect(picture).toEqual({ failed: "upstream" });
  });

  test("stays in the place of the id in the address, whatever text the id is", async () => {
    // The rules refuse this id. The type of a request is text, so a caller can skip the rules.
    // The captured call has the id as one part of the path: ..%2F..%2Fshared-links%2Fme.
    // Sent as it is, the same text is the address of the share link.
    immichAnswers(thumbnailIdWithAPath);

    const picture = await getThumbnail({ id: "../../shared-links/me", size: "thumbnail" });

    expect(picture).toEqual({ failed: "not-found" });
  });
});
