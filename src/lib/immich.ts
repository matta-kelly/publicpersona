const IMMICH_BASE = "https://immich.monk3y.xyz";

export type AssetType = "IMAGE" | "VIDEO" | "AUDIO" | "OTHER";

export type ThumbnailSize = "preview" | "thumbnail";

export interface ImmichAsset {
  id: string;
  type: AssetType;
  originalFileName: string;
  width: number;
  height: number;
  fileCreatedAt: string;
}

export interface Share {
  albumName: string;
  assets: ImmichAsset[];
}

function getKey(): string {
  const key = process.env.IMMICH_SHARE_KEY;
  if (!key) {
    throw new Error("IMMICH_SHARE_KEY is not set");
  }
  return key;
}

interface SharedLinkMeResponse {
  album: { id: string; albumName: string } | null;
  type: "ALBUM" | "INDIVIDUAL";
}

interface AlbumResponse {
  albumName: string;
  assets: ImmichAsset[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${IMMICH_BASE}${path}${sep}key=${encodeURIComponent(getKey())}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600, tags: ["immich-share"] },
  });
  if (!res.ok) {
    throw new Error(`Immich ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getShare(): Promise<Share> {
  const link = await fetchJson<SharedLinkMeResponse>("/api/shared-links/me");
  if (link.type !== "ALBUM" || !link.album) {
    throw new Error(`Share is not an album-type link (type=${link.type})`);
  }
  const album = await fetchJson<AlbumResponse>(`/api/albums/${link.album.id}`);
  return { albumName: album.albumName, assets: album.assets };
}

export function upstreamThumbnailUrl(id: string, size: ThumbnailSize): string {
  const params = new URLSearchParams({ key: getKey(), size });
  return `${IMMICH_BASE}/api/assets/${id}/thumbnail?${params.toString()}`;
}
