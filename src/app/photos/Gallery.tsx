"use client";

import { useCallback, useEffect, useState } from "react";
import { galleryStep, pictureAddress, type GalleryEvent } from "./gallery-state";
import type { Photo } from "./photos";

export default function Gallery({ photos }: { photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const count = photos.length;
  const send = useCallback(
    (event: GalleryEvent) => setOpenIndex((open) => galleryStep(open, event, count)),
    [count],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => send({ type: "key", key: e.key });
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, send]);

  const current = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id} className="bg-tile aspect-square overflow-hidden rounded-md">
            <button
              type="button"
              onClick={() => send({ type: "open", index: i })}
              className="block h-full w-full cursor-zoom-in"
              aria-label={`Open ${p.originalFileName}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pictureAddress(p.id, "grid")}
                alt={p.originalFileName}
                width={p.width}
                height={p.height}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {current !== null && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${openIndex + 1} of ${photos.length}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => send({ type: "close" })}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              send({ type: "previous" });
            }}
            aria-label="Previous photo"
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              send({ type: "next" });
            }}
            aria-label="Next photo"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              send({ type: "close" });
            }}
            aria-label="Close"
            className="absolute top-2 right-2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:top-4 sm:right-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white sm:bottom-4"
            aria-live="polite"
          >
            {openIndex + 1} / {photos.length}
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.id}
            src={pictureAddress(current.id, "open")}
            alt={current.originalFileName}
            width={current.width}
            height={current.height}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[92vw] object-contain"
          />
        </div>
      )}
    </>
  );
}
