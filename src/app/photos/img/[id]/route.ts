import { NextRequest } from "next/server";
import { upstreamThumbnailUrl } from "@/lib/immich";
import { thumbnailRequest } from "@/lib/photos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = thumbnailRequest(id, req.nextUrl.searchParams.get("size"));
  if ("refused" in request) {
    const text = request.refused === "id" ? "Bad asset id" : "Bad size";
    return new Response(text, { status: 400 });
  }

  const upstream = await fetch(upstreamThumbnailUrl(request.id, request.size), {
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
