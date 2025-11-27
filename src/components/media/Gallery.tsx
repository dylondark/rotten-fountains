"use client";
import { useMemo, useState } from "react";
import Image from "next/image";

type Props = {
  images?: string[];
  videos?: string[];
};

type Item = { kind: "image" | "video"; src: string };

export default function Gallery({ images = [], videos = [] }: Props) {
  const items: Item[] = useMemo(() => {
    const imgItems = (images || []).filter(Boolean).map((src) => ({ kind: "image" as const, src }));
    const vidItems = (videos || []).filter(Boolean).map((src) => ({ kind: "video" as const, src }));
    return [...imgItems, ...vidItems];
  }, [images, videos]);

  const [index, setIndex] = useState(0);
  if (!items.length) return null;

  const current = items[Math.min(index, items.length - 1)];

  const goPrev = () => setIndex((i) => (i > 0 ? i - 1 : items.length - 1));
  const goNext = () => setIndex((i) => (i < items.length - 1 ? i + 1 : 0));

  return (
    <div className="mt-6">
      <div className="relative bg-black rounded-xl overflow-hidden">
        {current.kind === "image" ? (
          <Image
            src={current.src}
            alt={"Media item"}
            width={960}
            height={540}
            className="w-full h-auto object-contain"
            priority
          />
        ) : (
          <video controls className="w-full h-auto">
            <source src={current.src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}

        {items.length > 1 && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous"
              className="bg-white/80 hover:bg-white text-black rounded-full px-3 py-2"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next"
              className="bg-white/80 hover:bg-white text-black rounded-full px-3 py-2"
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {items.length > 1 && (
        <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {items.map((it, i) => (
            <button
              key={`${it.kind}-${it.src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`border rounded-lg overflow-hidden ${i === index ? "border-blue-500" : "border-gray-300"}`}
              aria-label={`Go to item ${i + 1}`}
            >
              {it.kind === "image" ? (
                <Image src={it.src} alt="thumb" width={160} height={90} className="w-full h-auto object-cover" />
              ) : (
                <video className="w-full h-auto" muted>
                  <source src={it.src} type="video/mp4" />
                </video>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
