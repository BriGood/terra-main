'use client';

import Image from 'next/image';
import Link from '@/app/components/HoverPrefetchLink';
import { useRef, useState, useEffect, useCallback } from 'react';
import { formatPrice, type ProductListItem } from '@/lib/shopify';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

export default function FeaturedCarousel({ products }: { products: ProductListItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [stopCount, setStopCount] = useState(1);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Width of one card slot. Cards have an exact 1/2 (mobile) or 1/4 (desktop)
  // basis with no flex gap, so slots tile the track edge to edge.
  function slotWidth(el: HTMLDivElement): number {
    return (el.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? 0;
  }

  const sync = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const slot = slotWidth(el);
    const maxScroll = el.scrollWidth - el.clientWidth;
    // The track snaps per card (snap-start on every slide), so every card
    // position is a real stop — not every screenful. Counting stops by the
    // screenful made a half-swipe light the last dot while products were still
    // off-screen. The final stop is the one that pulls the last card flush with
    // the right edge, hence products - visible + 1.
    const visible = slot > 0 ? Math.round(el.clientWidth / slot) : 1;
    const stops = Math.max(1, products.length - visible + 1);
    setStopCount(stops);
    setIndex(slot > 0 ? Math.min(stops - 1, Math.round(el.scrollLeft / slot)) : 0);
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= maxScroll - 1);
  }, [products.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync]);

  // Relative scroll — robust against snap/rounding drift in the index. Steps one
  // card so the arrows land on the same stops the dots advertise.
  function scrollByCard(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * slotWidth(el), behavior: 'smooth' });
  }

  function goToStop(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: slotWidth(el) * i, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      {/* Arrows — desktop only; mobile uses swipe + dots */}
      <button
        type="button"
        aria-label="Previous product"
        onClick={() => scrollByCard(-1)}
        disabled={atStart}
        className="hidden lg:flex absolute left-0 top-[38%] -translate-y-1/2 -translate-x-1/2 z-10 h-12 w-12 items-center justify-center bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeftIcon size={20} />
      </button>
      <button
        type="button"
        aria-label="Next product"
        onClick={() => scrollByCard(1)}
        disabled={atEnd}
        className="hidden lg:flex absolute right-0 top-[38%] -translate-y-1/2 translate-x-1/2 z-10 h-12 w-12 items-center justify-center bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronRightIcon size={20} />
      </button>

      {/* Track */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/shop/${product.handle}`}
            className="group flex flex-col shrink-0 snap-start basis-1/2 lg:basis-1/4 px-2 lg:px-4"
          >
            <div className="relative aspect-[4/3] bg-[#111] overflow-hidden mb-3">
              {product.featuredImage && (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText ?? product.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <h3 className="font-bold uppercase tracking-tight mb-1">{product.title}</h3>
            {product.productType && (
              <p className="text-xs uppercase tracking-widest text-[#888888] mb-1">{product.productType}</p>
            )}
            <div className="mt-auto flex items-center gap-2">
              <p className="text-white">
                {formatPrice(
                  product.priceRange.minVariantPrice.amount,
                  product.priceRange.minVariantPrice.currencyCode
                )}
              </p>
              {product.compareAtPriceRange?.minVariantPrice &&
                parseFloat(product.compareAtPriceRange.minVariantPrice.amount) >
                  parseFloat(product.priceRange.minVariantPrice.amount) && (
                  <span data-nosnippet="" className="text-[#888888] line-through text-sm">
                    {formatPrice(
                      product.compareAtPriceRange.minVariantPrice.amount,
                      product.compareAtPriceRange.minVariantPrice.currencyCode
                    )}
                  </span>
                )}
            </div>
          </Link>
        ))}
      </div>

      {/* Position dots — one per card stop, not per screenful */}
      {stopCount > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: stopCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to product ${i + 1}`}
              onClick={() => goToStop(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === index ? 'bg-white' : 'bg-[#444] hover:bg-[#666]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
