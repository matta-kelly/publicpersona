/** The sizes of a picture the site hands out. Immich has more. */
export type ThumbnailSize = "thumbnail" | "preview";

/** A request for one picture that has passed the rules. */
export interface ThumbnailRequest {
  id: string;
  size: ThumbnailSize;
}

/** Which part of a request broke a rule. */
export interface ThumbnailRefusal {
  refused: "id" | "size";
}

/** One asset of the album, as far as the rules read it. */
export interface AlbumAsset {
  id: string;
  type: string;
  originalFileName: string;
  width: number;
  height: number;
}

/** What the gallery gets for one photo. It goes to the browser. */
export interface Photo {
  id: string;
  originalFileName: string;
  width: number;
  height: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_SIZES: ThumbnailSize[] = ["thumbnail", "preview"];

export function thumbnailRequest(
  id: string,
  size: string | null,
): ThumbnailRequest | ThumbnailRefusal {
  if (!UUID_RE.test(id)) {
    return { refused: "id" };
  }
  if (size === null) {
    return { id, size: "thumbnail" };
  }
  if (!ALLOWED_SIZES.includes(size as ThumbnailSize)) {
    return { refused: "size" };
  }
  return { id, size: size as ThumbnailSize };
}

export function galleryPhotos(assets: AlbumAsset[]): Photo[] {
  return assets
    .filter((asset) => asset.type === "IMAGE")
    .map(({ id, originalFileName, width, height }) => ({ id, originalFileName, width, height }));
}
