import Gallery from "./Gallery";
import { getShare } from "@/lib/immich";
import { galleryPhotos } from "@/lib/photos";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  let share;
  try {
    share = await getShare();
  } catch (err) {
    console.error("immich share fetch failed", err);
    return (
      <article>
        <h1>Photos</h1>
        <p className="text-muted mt-4">Photos unavailable right now. Try again later.</p>
      </article>
    );
  }
  const photos = galleryPhotos(share.assets);

  return (
    <article>
      <header>
        <h1>{share.albumName}</h1>
        <p className="text-muted mt-2">{photos.length} photos</p>
      </header>
      <Gallery photos={photos} />
    </article>
  );
}
