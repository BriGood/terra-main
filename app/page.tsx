import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts, getCollection, FEATURED_COLLECTION_HANDLE } from '@/lib/shopify';
import FeaturedCarousel from '@/app/components/FeaturedCarousel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  // Which products are featured, and in what order, is curated in Shopify (the
  // hidden "Featured" collection, manual sort) so it can be changed in admin
  // without a deploy. Falls back to the full catalog if that collection is
  // missing or empty, so the carousel is never blank.
  const featured = await getCollection(FEATURED_COLLECTION_HANDLE).catch(() => null);
  const products = featured?.products.length ? featured.products : await getProducts();

  return (
    <main className="bg-black text-white">

      {/* Hero — full-width banner with text overlay */}
      <section className="relative w-full md:mt-6 h-[38vh] md:h-auto md:aspect-[3.75/1] md:min-h-[264px] overflow-hidden">
        {/* Hand-written <picture> rather than next/image: this needs art
            direction (a different crop below 768px), which next/image cannot
            express, and the variants are pre-built by `npm run images` anyway
            since nothing optimises local assets at request time. AVIF first,
            WebP for the rest, JPEG master as the last resort. */}
        <picture>
          <source
            media="(max-width: 767px)"
            type="image/avif"
            srcSet="/Branding/responsive/hero-mobile-500.avif 500w, /Branding/responsive/hero-mobile-750.avif 750w, /Branding/responsive/hero-mobile-1000.avif 1000w"
            sizes="100vw"
          />
          <source
            media="(max-width: 767px)"
            type="image/webp"
            srcSet="/Branding/responsive/hero-mobile-500.webp 500w, /Branding/responsive/hero-mobile-750.webp 750w, /Branding/responsive/hero-mobile-1000.webp 1000w"
            sizes="100vw"
          />
          <source
            type="image/avif"
            srcSet="/Branding/responsive/hero-desktop-1280.avif 1280w, /Branding/responsive/hero-desktop-1920.avif 1920w, /Branding/responsive/hero-desktop-2560.avif 2560w, /Branding/responsive/hero-desktop-3000.avif 3000w"
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet="/Branding/responsive/hero-desktop-1280.webp 1280w, /Branding/responsive/hero-desktop-1920.webp 1920w, /Branding/responsive/hero-desktop-2560.webp 2560w, /Branding/responsive/hero-desktop-3000.webp 3000w"
            sizes="100vw"
          />
          <img
            src="/Branding/Hero_Desktop.jpg"
            alt="Terra Fieldworks"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-bottom md:object-contain"
          />
        </picture>
        {/* Scrim for the headline, not a look. It stops at 55% because the
            left of the frame is already near-black (mean 1-8 of 255 where the
            type sits), so reaching further only dimmed the lit ground and the
            figure — the one bright thing in the shot — by a fifth. */}
        <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/20 via-28% to-transparent to-55%" />
        {/* Mobile crops the figure in from the bottom, so centring in the box
            leaves the copy low over the brightest part of the frame. The bottom
            pad lifts the centre line into the dark upper half. */}
        <div className="absolute inset-0 flex flex-col justify-center items-start gap-5 lg:gap-10 px-6 lg:px-20 pb-20 md:pb-0">
          <h1 className="text-[1.75rem] lg:text-[88px] xl:text-[96px] font-extrabold uppercase tracking-tight leading-none">
            <span className="block">Solutions for</span>
            <span className="block">the Field.</span>
          </h1>
          <Link
            href="/shop"
            className="inline-block bg-white text-black text-[11px] lg:text-sm font-bold uppercase tracking-widest px-6 py-2.5 lg:px-9 lg:py-4 hover:bg-[#d9d9d9] transition-colors"
          >
            Shop the Collection
          </Link>
        </div>
      </section>


      {/* Featured Products */}
      {products.length > 0 && (
        <section className="px-6 pt-8 pb-16 lg:px-20 lg:pt-10">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-center mb-8">
            Featured Products
          </h2>
          <FeaturedCarousel products={products} />
          <div className="flex justify-center mt-8">
            <Link
              href="/shop"
              className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors"
            >
              View All →
            </Link>
          </div>
        </section>
      )}

    </main>
  );
}
