import Gallery from "./Gallery";
import { getShare } from "@/lib/immich";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const share = await getShare();
  const photos = share.assets
    .filter((a) => a.type === "IMAGE")
    .map(({ id, originalFileName, width, height }) => ({
      id,
      originalFileName,
      width,
      height,
    }));

  return (
    <article>
      <header className="prose prose-neutral dark:prose-invert">
        <h1 className="text-3xl font-semibold tracking-tight">{share.albumName}</h1>
        <p className="text-muted mt-2">{photos.length} photos</p>
      </header>
      <Gallery photos={photos} />
    </article>
  );
}
