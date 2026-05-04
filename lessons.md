# Lessons

## Immich shared-link API: assets aren't in `/shared-links/me` for ALBUM shares

`GET /api/shared-links/me?key=…` returns the link metadata but the top-level `assets[]` is empty for `type: "ALBUM"` shares — only `album.id` and `album.assetCount` come back. To get the actual asset list, follow up with `GET /api/albums/{album.id}?key=…`. The OpenAPI schema lists `assets` on the response and gives no hint that it's empty in this case.

## Immich `size=fullsize` is gated by `allowDownload`

The thumbnail endpoint accepts sizes `original | fullsize | preview | thumbnail`. `fullsize` 302-redirects to `/api/assets/{id}/original`, which 400s when the share's `allowDownload` flag is off. The two sizes that work without the download flag are `preview` (full-resolution JPEG) and `thumbnail` (small webp). For a public gallery that doesn't want to allow downloads, `preview` is the largest viewable variant.

## Pages that depend on runtime secrets must be `force-dynamic`

Next 16 prerenders pages with `revalidate` at build time. If the page's data fetch requires a secret (env var) that's only present in the deployed pod, the build will run the fetch with whatever placeholder you set (or no value) and fail. Fix: `export const dynamic = "force-dynamic"`. The fetch's own `next: { revalidate: N }` cache still gives you per-request cache reuse — the page just isn't statically pre-rendered.
