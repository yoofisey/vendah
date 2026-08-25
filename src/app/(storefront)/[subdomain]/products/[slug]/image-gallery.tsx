"use client";

import { useState } from "react";
import Image from "next/image";

export function ImageGallery({
  images,
  alts,
  alt,
}: {
  images: string[];
  alts?: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[Math.min(active, Math.max(images.length - 1, 0))];
  const currentAlt = alts?.[active] || alt;

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-cream-soft text-muted">
        No image
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-cream-soft">
        <Image
          src={current}
          alt={currentAlt}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1}`}
              className={`relative h-16 w-16 overflow-hidden rounded-lg border bg-cream-soft transition ${
                index === active
                  ? "border-pine ring-2 ring-pine/20"
                  : "border-charcoal/15 opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
