import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Tag } from "lucide-react";

import { SmartImage } from "@/components/real-estate/SmartImage";
import type { PublicProperty as Property } from "@/hooks/use-published-properties";
import { formatAED } from "@/components/real-estate/format";
import { cn } from "@/lib/utils";

export function CuratedLaunchCard({
  property,
  primaryBadge,
  secondaryBadge,
  onOpen,
  className,
}: {
  property: Property;
  primaryBadge: string;
  secondaryBadge: string;
  onOpen: () => void;
  className?: string;
}) {
  const images = useMemo(
    () =>
      Array.from(
        new Set(
          [property.coverImage, ...(property.gallery ?? [])].filter(Boolean),
        ),
      ),
    [property.coverImage, property.gallery],
  );
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const hasMany = images.length > 1;
  const current = images[Math.min(index, images.length - 1)] ?? property.coverImage;

  const go = (event: { stopPropagation: () => void }, step: number) => {
    event.stopPropagation();
    setIndex((i) => (i + step + images.length) % images.length);
  };

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[28px]",
        "ring-1 ring-white/10",
        "bg-white/5",
        "shadow-[0_26px_90px_-65px_rgba(0,0,0,0.7)]",
        className,
      )}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (!hasMany || touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > 40) {
          setIndex((i) => (i + (dx < 0 ? 1 : -1) + images.length) % images.length);
        }
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-[2] focus:outline-none"
        aria-label={`Open ${property.title}`}
      />

      <div className="relative z-[1]">
        <SmartImage
          key={current}
          src={current}
          alt={property.title}
          className="h-[440px] w-full object-cover transition duration-700 group-hover:scale-[1.03] sm:h-[520px]"
          loading="lazy"
        />

        <div className="pointer-events-none absolute inset-0 bg-black/10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
      </div>

      {hasMany ? (
        <>
          <button
            type="button"
            onClick={(e) => go(e, -1)}
            aria-label="Previous photo"
            className={cn(
              "absolute left-3 top-[42%] z-[4] inline-flex h-10 w-10 items-center justify-center rounded-full",
              "bg-black/35 text-white ring-1 ring-white/40 backdrop-blur transition",
              "hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
              "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => go(e, 1)}
            aria-label="Next photo"
            className={cn(
              "absolute right-3 top-[42%] z-[4] inline-flex h-10 w-10 items-center justify-center rounded-full",
              "bg-black/35 text-white ring-1 ring-white/40 backdrop-blur transition",
              "hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
              "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="pointer-events-none absolute left-1/2 top-[84px] z-[4] -translate-x-1/2 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white ring-1 ring-white/25 backdrop-blur">
            {Math.min(index, images.length - 1) + 1} / {images.length}
          </div>
        </>
      ) : null}

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-[3] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="pointer-events-none inline-flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
              <span className="text-lg font-black tracking-tight text-white">
                Z
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-extrabold tracking-[0.08em] text-white">
                LIVE LISTING
              </div>
              <div className="text-[10px] font-semibold tracking-[0.22em] text-white/70">
                ZAIN INTERNATIONAL GROUP
              </div>
            </div>
          </div>

          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={onOpen}
              className={cn(
                "inline-flex h-12 w-12 items-center justify-center rounded-2xl",
                "bg-white/0 text-white",
                "ring-1 ring-white/60",
                "backdrop-blur",
                "transition",
                "hover:bg-white/10",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              )}
              aria-label="Open"
            >
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[3] p-5">
        <div className="max-w-[90%]">
          <div className="font-serif text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
            {property.title}
          </div>
          <div className="mt-1 text-sm font-medium text-white/80">
            {property.location}
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2",
              "text-[13px] font-semibold text-[hsl(var(--brand-ink))]",
              "shadow-sm ring-1 ring-black/5",
            )}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand-ink))] ring-1 ring-black/5">
              <Tag className="h-4 w-4" />
            </span>
            <span className="whitespace-nowrap">
              Price from {formatAED(property.price)}
            </span>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2",
              "text-[13px] font-semibold text-[hsl(var(--brand-ink))]",
              "shadow-sm ring-1 ring-black/5",
            )}
          >
            <span>{primaryBadge}</span>
            <span className="text-[hsl(var(--brand-ink))]/35">•</span>
            <span>{secondaryBadge}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
