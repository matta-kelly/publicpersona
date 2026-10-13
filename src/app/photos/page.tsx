import Gallery from "./Gallery";
import { getShare } from "@/lib/immich";
import { galleryPhotos } from "@/lib/photos";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const share = await getShare();
  const photos = galleryPhotos(share.assets);

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
