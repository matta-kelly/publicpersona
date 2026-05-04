import { NextRequest } from "next/server";
import { ThumbnailSize, upstreamThumbnailUrl } from "@/lib/immich";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_SIZES: ThumbnailSize[] = ["preview", "thumbnail"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return new Response("Bad asset id", { status: 400 });
  }

  const sizeParam = req.nextUrl.searchParams.get("size") ?? "thumbnail";
  if (!ALLOWED_SIZES.includes(sizeParam as ThumbnailSize)) {
    return new Response("Bad size", { status: 400 });
  }
  const size = sizeParam as ThumbnailSize;

  const upstream = await fetch(upstreamThumbnailUrl(id, size), {
    cache: "no-store",
    redirect: "manual",
  });

  if (upstream.status === 404) {
    return new Response("Not found", { status: 404 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const etag = upstream.headers.get("etag");
  if (etag) headers.set("etag", etag);
  headers.set("cache-control", "public, max-age=86400, s-maxage=86400, immutable");

  return new Response(upstream.body, { status: 200, headers });
}
