'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { imagePath, useProductImageJump } from './ProductImageJump';

type Props = {
  images: { url: string; altText: string | null }[];
  title: string;
};

export default function ProductImageCarousel({ images, title }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [animate, setAnimate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const { register } = useProductImageJump();

  // Picking a color shows that color's photo: the desktop track moves (sliding
  // only for a single step, like the thumbnails) and the mobile strip scrolls.
  useEffect(() => {
    return register((urls) => {
      const paths = images.map((image) => imagePath(image.url));
      for (const url of urls) {
        const index = url ? paths.indexOf(imagePath(url)) : -1;
        if (index === -1) continue;
        if (index === activeIndex) return;
        setAnimate(Math.abs(index - activeIndex) === 1);
        setActiveIndex(index);
        const main = scrollRef.current;
        if (main) main.scrollTo({ left: main.clientWidth * index, behavior: 'smooth' });
        return;
      }
    });
  }, [register, images, activeIndex]);

  useEffect(() => {
    if (!zoomed) return;
    // Jump the lightbox carousel to the current image on open (no smooth scroll).
    const container = lightboxRef.current;
    if (container) container.scrollLeft = container.clientWidth * activeIndex;

    // Lock the page behind the lightbox. position:fixed is the only lock iOS
    // Safari honours for touch scrolling — overflow:hidden alone still lets the
    // background scroll. The offset is restored when the lightbox closes.
    const { body } = document;
    const scrollY = window.scrollY;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const restore = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      body.style.position = restore.position;
      body.style.top = restore.top;
      body.style.width = restore.width;
      body.style.paddingRight = restore.paddingRight;
      window.scrollTo(0, scrollY);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomed]);

  function scrollTo(index: number) {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ left: container.clientWidth * index, behavior: 'smooth' });
    setActiveIndex(index);
  }

  // Derive the visible slide from a scroll container. A zero clientWidth (a
  // display:none or collapsed container) would make the division NaN and index
  // past the end of `images`, so fall back to the current slide instead.
  function indexFromScroll(container: HTMLDivElement | null, fallback: number) {
    if (!container || container.clientWidth === 0) return fallback;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    return Math.max(0, Math.min(index, images.length - 1));
  }

  function onScroll() {
    setActiveIndex(indexFromScroll(scrollRef.current, activeIndex));
  }

  function scrollLightboxTo(index: number) {
    const container = lightboxRef.current;
    if (!container) return;
    container.scrollTo({ left: container.clientWidth * index, behavior: 'smooth' });
    setActiveIndex(index);
  }

  function onLightboxScroll() {
    setActiveIndex(indexFromScroll(lightboxRef.current, activeIndex));
  }

  function closeLightbox() {
    const idx = indexFromScroll(lightboxRef.current, activeIndex);
    setActiveIndex(idx);
    // Keep the mobile scroll carousel in sync with wherever the lightbox left off.
    const main = scrollRef.current;
    if (main) main.scrollLeft = main.clientWidth * idx;
    setZoomed(false);
  }

  if (images.length === 0) {
    return <div className="aspect-[4/3] bg-[#111]" />;
  }

  // Desktop slides a track rather than swapping the src. Only single-step moves
  // animate: wrapping from the last image to the first, or jumping several
  // thumbnails along, would otherwise sweep the whole strip past the viewer.
  function goTo(index: number) {
    const step = Math.abs(index - activeIndex);
    setAnimate(step === 1);
    setActiveIndex(index);
  }

  const prev = () => goTo((activeIndex - 1 + images.length) % images.length);
  const next = () => goTo((activeIndex + 1) % images.length);

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* Mobile: scroll-snap carousel */}
        <div className="md:hidden">
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={onScroll}
              className="flex overflow-x-scroll snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none' }}
            >
              {images.map((image, i) => (
                <div
                  key={i}
                  onClick={() => setZoomed(true)}
                  className="relative aspect-[4/3] flex-none w-full snap-start bg-[#111] overflow-hidden cursor-zoom-in"
                >
                  <Image
                    src={image.url}
                    alt={image.altText ?? title}
                    fill
                    className="object-cover"
                    priority={i === 0}
                    sizes="100vw"
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <>
                <button onClick={() => scrollTo((activeIndex - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center transition-colors cursor-pointer" aria-label="Previous">‹</button>
                <button onClick={() => scrollTo((activeIndex + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-8 h-8 flex items-center justify-center transition-colors cursor-pointer" aria-label="Next">›</button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${
                    i === activeIndex ? 'bg-white' : 'bg-[#444]'
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop: large featured image + thumbnail strip */}
        <div className="hidden md:flex flex-col gap-3">
          <div
            onClick={() => setZoomed(true)}
            className="relative aspect-[4/3] bg-[#111] overflow-hidden cursor-zoom-in"
          >
            {/* translateX percentages resolve against the track's own width,
                which is one slide wide — the slides overflow it — so each step
                is exactly one image. */}
            <div
              className={`flex h-full ${animate ? 'transition-transform duration-[400ms] ease-out motion-reduce:transition-none' : ''}`}
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {images.map((image, i) => (
                <div key={i} className="relative flex-none w-full h-full">
                  <Image
                    src={image.url}
                    alt={image.altText ?? title}
                    fill
                    className="object-cover"
                    priority={i === 0}
                    sizes="(min-width: 1024px) 600px, 100vw"
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-10 h-10 flex items-center justify-center text-xl transition-colors cursor-pointer" aria-label="Previous">‹</button>
                <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-10 h-10 flex items-center justify-center text-xl transition-colors cursor-pointer" aria-label="Next">›</button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((image, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`relative aspect-[4/3] w-16 flex-none bg-[#111] overflow-hidden border transition-colors ${
                    i === activeIndex ? 'border-white cursor-default' : 'border-transparent hover:border-[#444] cursor-pointer'
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image
                    src={image.url}
                    alt={image.altText ?? title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Lightbox */}
      {zoomed && (
        <div className="fixed inset-0 z-50 bg-black/95">
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 z-10 text-white text-2xl w-10 h-10 flex items-center justify-center hover:text-[#888] transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
          <div
            ref={lightboxRef}
            onScroll={onLightboxScroll}
            className="flex h-full w-full overflow-x-scroll snap-x snap-mandatory overscroll-contain"
            style={{ scrollbarWidth: 'none' }}
          >
            {images.map((image, i) => (
              <div
                key={i}
                onClick={closeLightbox}
                className="relative flex-none w-full h-full snap-center cursor-zoom-out"
              >
                <Image
                  src={image.url}
                  alt={image.altText ?? title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            ))}
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={() => scrollLightboxTo((activeIndex - 1 + images.length) % images.length)}
                className="absolute left-5 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white w-10 h-10 flex items-center justify-center text-2xl transition-colors cursor-pointer"
                aria-label="Previous"
              >‹</button>
              <button
                onClick={() => scrollLightboxTo((activeIndex + 1) % images.length)}
                className="absolute right-5 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white w-10 h-10 flex items-center justify-center text-2xl transition-colors cursor-pointer"
                aria-label="Next"
              >›</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
