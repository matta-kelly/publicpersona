import { NextRequest } from "next/server";
import { getThumbnail } from "@/app/photos/immich";
import { thumbnailRequest } from "@/app/photos/photos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = thumbnailRequest(id, req.nextUrl.searchParams.get("size"));
  if ("refused" in request) {
    const text = request.refused === "id" ? "Bad asset id" : "Bad size";
    return new Response(text, { status: 400 });
  }

  const thumbnail = await getThumbnail(request);
  if ("failed" in thumbnail) {
    return thumbnail.failed === "not-found"
      ? new Response("Not found", { status: 404 })
      : new Response("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  if (thumbnail.contentType) headers.set("content-type", thumbnail.contentType);
  if (thumbnail.etag) headers.set("etag", thumbnail.etag);
  headers.set("cache-control", "public, max-age=86400, s-maxage=86400, immutable");

  return new Response(thumbnail.body, { status: 200, headers });
}
