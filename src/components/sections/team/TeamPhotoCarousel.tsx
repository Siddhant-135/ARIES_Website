"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";
import type { TeamYear } from "@/lib/types";

const ACTIVE_SCALE = 0.9;

/**
 * Stacked full-team photo switcher. Only the hero photo changes per year;
 * rosters elsewhere stay on the current year entry.
 */
export function TeamPhotoCarousel({ years }: { years: TeamYear[] }) {
  const [idx, setIdx] = useState(0);

  const goTo = useCallback(
    (next: number) => setIdx(Math.max(0, Math.min(years.length - 1, next))),
    [years.length],
  );

  const goOlder = useCallback(() => goTo(idx + 1), [goTo, idx]);
  const goNewer = useCallback(() => goTo(idx - 1), [goTo, idx]);

  const year = years[idx];
  if (!year) return null;

  const hasOlder = idx < years.length - 1;
  const hasNewer = idx > 0;

  return (
    <section className="mx-auto max-w-4xl">
      <div
        role="region"
        aria-label="Full team photos"
        className="relative"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" && hasOlder) goOlder();
          if (e.key === "ArrowLeft" && hasNewer) goNewer();
        }}
      >
        {/* External arrows — reliable fallback for Safari */}
        <button
          type="button"
          aria-label={`Newer team photo${hasNewer ? `: ${years[idx - 1].year}` : ""}`}
          disabled={!hasNewer}
          onClick={goNewer}
          className="absolute left-0 top-1/2 z-50 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-card transition hover:text-purple disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          aria-label={`Older team photo${hasOlder ? `: ${years[idx + 1].year}` : ""}`}
          disabled={!hasOlder}
          onClick={goOlder}
          className="absolute right-0 top-1/2 z-50 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-card transition hover:text-purple disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>

        <div
          className="relative mx-12 aspect-[16/9] w-auto sm:mx-14"
          style={{ perspective: "1200px" }}
        >
          {/* Peek cards behind the active slide */}
          {years.map((y, i) => {
            const offset = i - idx;
            if (offset === 0 || Math.abs(offset) > 2) return null;

            const baseX = offset * 14;
            const scale = 0.86 - Math.abs(offset) * 0.04;
            const opacity = 0.72 - Math.abs(offset) * 0.1;
            const zIndex = 10 - Math.abs(offset);

            return (
              <div
                key={y.year}
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden bg-[#e6e0d6] shadow-card transition-[transform,opacity] duration-500 ease-out"
                style={{
                  transform: `translateX(${baseX}%) scale(${scale})`,
                  opacity,
                  zIndex,
                }}
              >
                {y.photo ? (
                  <Image src={y.photo} alt="" fill draggable={false} className="object-cover" />
                ) : (
                  <p className="grid h-full place-items-center px-10 text-center text-lg font-bold uppercase tracking-wide text-[#a49f93] md:text-2xl">
                    Add full team photo for {y.year}
                  </p>
                )}
                <span
                  className={`absolute bottom-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink shadow-card-sm ${
                    offset > 0 ? "right-3" : "left-3"
                  }`}
                >
                  {y.year}
                </span>
              </div>
            );
          })}

          {/* Active slide — 10% smaller so peeks show around it */}
          <div
            className="absolute inset-0 z-20 overflow-hidden bg-[#e6e0d6] shadow-card transition-transform duration-500 ease-out"
            style={{ transform: `scale(${ACTIVE_SCALE})` }}
          >
            {year.photo ? (
              <Image
                src={year.photo}
                alt={`ARIES full team ${year.year}`}
                fill
                draggable={false}
                className="object-cover"
                priority
              />
            ) : (
              <p className="grid h-full place-items-center px-10 text-center text-xl font-bold uppercase tracking-wide text-[#a49f93] md:text-3xl">
                Add full team photo for {year.year}
              </p>
            )}

            {/* Left 20% — hover/tap overlay with arrow */}
            {hasNewer && (
              <button
                type="button"
                aria-label={`View ${years[idx - 1].year} team photo`}
                onClick={goNewer}
                className="group absolute left-0 top-0 z-30 h-full w-1/5 cursor-pointer focus-visible:outline-none"
              >
                <span className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/45 group-focus-visible:bg-black/45 group-active:bg-black/45" />
                <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
                  <ChevronLeft size={28} className="text-white drop-shadow-md" strokeWidth={2.5} />
                </span>
              </button>
            )}

            {/* Right 20% — hover/tap overlay with arrow */}
            {hasOlder && (
              <button
                type="button"
                aria-label={`View ${years[idx + 1].year} team photo`}
                onClick={goOlder}
                className="group absolute right-0 top-0 z-30 h-full w-1/5 cursor-pointer focus-visible:outline-none"
              >
                <span className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/45 group-focus-visible:bg-black/45 group-active:bg-black/45" />
                <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
                  <ChevronRight size={28} className="text-white drop-shadow-md" strokeWidth={2.5} />
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-lg font-bold text-ink">{year.year}</p>

      {years.length > 1 && (
        <div className="mt-3 flex justify-center gap-2" aria-label="Select team year">
          {years.map((item, i) => (
            <button
              key={item.year}
              type="button"
              aria-label={`View ${item.year}`}
              aria-current={i === idx ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === idx ? "w-7 bg-purple" : "w-2 bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
