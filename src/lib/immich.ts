import type { AlbumAsset, ThumbnailRequest } from "./photos";

const IMMICH_BASE = "https://immich.monk3y.xyz";

/** The album of the share, as far as the site reads it. */
export interface Share {
  albumName: string;
  assets: AlbumAsset[];
}

/** One picture, as Immich sent it. The body can be read once. */
export interface Thumbnail {
  body: ReadableStream<Uint8Array>;
  contentType: string | null;
  etag: string | null;
}

/** Why there is no picture: Immich does not have it for the share, or Immich failed. */
export interface ThumbnailFailure {
  failed: "not-found" | "upstream";
}

function getKey(): string {
  const key = process.env.IMMICH_SHARE_KEY;
  if (!key) {
    throw new Error("IMMICH_SHARE_KEY is not set");
  }
  return key;
}

interface SharedLinkMeResponse {
  album: { id: string } | null;
  type: "ALBUM" | "INDIVIDUAL";
}

interface AlbumResponse {
  albumName: string;
  assets: AlbumAsset[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${IMMICH_BASE}${path}?key=${encodeURIComponent(getKey())}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600, tags: ["immich-share"] },
  });
  if (!res.ok) {
    throw new Error(`Immich ${path}: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getShare(): Promise<Share> {
  const link = await fetchJson<SharedLinkMeResponse>("/api/shared-links/me");
  if (link.type !== "ALBUM" || !link.album) {
    throw new Error("Immich /api/shared-links/me: the share is not an album");
  }
  const album = await fetchJson<AlbumResponse>(`/api/albums/${link.album.id}`);
  return {
    albumName: album.albumName,
    assets: album.assets.map(({ id, type, originalFileName, width, height }) => ({
      id,
      type,
      originalFileName,
      width,
      height,
    })),
  };
}

export async function getThumbnail(
  request: ThumbnailRequest,
): Promise<Thumbnail | ThumbnailFailure> {
  let res: Response;
  try {
    const params = new URLSearchParams({ key: getKey(), size: request.size });
    const url = `${IMMICH_BASE}/api/assets/${encodeURIComponent(request.id)}/thumbnail?${params.toString()}`;
    res = await fetch(url, { cache: "no-store", redirect: "manual" });
  } catch {
    return { failed: "upstream" };
  }
  if (res.status === 400) {
    return { failed: "not-found" };
  }
  if (!res.ok || !res.body) {
    return { failed: "upstream" };
  }
  return {
    body: res.body,
    contentType: res.headers.get("content-type"),
    etag: res.headers.get("etag"),
  };
}
