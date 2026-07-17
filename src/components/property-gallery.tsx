"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useState } from "react";

export function PropertyGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const safeImages = images.length > 0 ? images : ["/property-placeholder.svg"];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = safeImages[Math.min(activeIndex, safeImages.length - 1)];

  const previous = () => {
    setActiveIndex((current) =>
      current === 0 ? safeImages.length - 1 : current - 1,
    );
  };
  const next = () => {
    setActiveIndex((current) => (current + 1) % safeImages.length);
  };

  return (
    <div className="flex h-full min-h-[340px] flex-col bg-stone-950 sm:min-h-[460px] lg:min-h-[570px]">
      <div className="relative min-h-[300px] flex-1 bg-stone-200 sm:min-h-[400px]">
        <Image
          alt={`${title} photograph ${activeIndex + 1}`}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          src={activeImage}
        />

        <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur">
          <Images aria-hidden="true" className="size-4" />
          {activeIndex + 1} / {safeImages.length}
        </span>

        {safeImages.length > 1 ? (
          <>
            <button
              aria-label="Previous photograph"
              className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-950 shadow-lg backdrop-blur hover:bg-white"
              onClick={previous}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              aria-label="Next photograph"
              className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-950 shadow-lg backdrop-blur hover:bg-white"
              onClick={next}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </>
        ) : null}
      </div>

      {safeImages.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto bg-stone-950 p-3">
          {safeImages.map((image, index) => (
            <button
              aria-label={`Show photograph ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                index === activeIndex
                  ? "border-[#f2c45b]"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
              key={`${image}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="96px"
                src={image}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
