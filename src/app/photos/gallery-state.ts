import type { ThumbnailSize } from "./photos";

/** One thing a visitor does in the gallery. */
export type GalleryEvent =
  | { type: "open"; index: number }
  | { type: "close" }
  | { type: "next" }
  | { type: "previous" }
  /** `key` is the `key` of a `KeyboardEvent`. */
  | { type: "key"; key: string };

const KEY_EVENTS = new Map<string, GalleryEvent>([
  ["Escape", { type: "close" }],
  ["ArrowRight", { type: "next" }],
  ["ArrowLeft", { type: "previous" }],
]);

/**
 * The open photo after an event: its place in the list, from 0, or `null` for none.
 * `open` is the open photo before the event, and `count` the number of photos.
 */
export function galleryStep(
  open: number | null,
  event: GalleryEvent,
  count: number,
): number | null {
  switch (event.type) {
    case "open":
      return event.index;
    case "close":
      return null;
    case "next":
      return open === null ? null : (open + 1) % count;
    case "previous":
      return open === null ? null : (open - 1 + count) % count;
    case "key": {
      const meant = KEY_EVENTS.get(event.key);
      return meant ? galleryStep(open, meant, count) : open;
    }
  }
}

const SIZES: Record<"grid" | "open", ThumbnailSize> = { grid: "thumbnail", open: "preview" };

/** The address of the picture of a photo, on this site. */
export function pictureAddress(id: string, place: "grid" | "open"): string {
  return `/photos/img/${id}?size=${SIZES[place]}`;
}
