'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import type { CollectionListItem } from '@/lib/shopify';

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

export default function Nav({
  collections = [],
  freeShippingThreshold = null,
}: {
  collections?: CollectionListItem[];
  freeShippingThreshold?: string | null;
}) {
  const sortedCollections = [...collections].sort((a, b) => a.title.localeCompare(b.title));
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const { itemCount } = useCart();

  if (pathname === '/coming-soon') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-[#222]">
      {/* Announcement bar. The bar keeps its height when the threshold is unset
          so NavSpacer's offset stays right; only the text drops out. */}
      <div className="h-8 flex items-center justify-center border-b border-[#222]">
        {freeShippingThreshold && (
          <p className="text-xs uppercase tracking-widest text-[#888888]">
            Free shipping on orders over {freeShippingThreshold}
          </p>
        )}
      </div>

      <div className="px-3 lg:px-20 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Branding/Terra_Round%20Logo%20Only.svg"
            alt="Terra Fieldworks"
            width={40}
            height={40}
            className="block"
          />
          <Image
            src="/Branding/Terra_Stacked%20Text%20Only.svg"
            alt=""
            width={120}
            height={120}
            className="block md:hidden h-auto"
          />
          <Image
            src="/Branding/Terra_Text%20Only.svg"
            alt=""
            width={360}
            height={16}
            className="hidden md:block"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`text-xs uppercase tracking-widest transition-colors ${
              pathname === '/' ? 'text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            HØme
          </Link>

          {/* ShØp with dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            {/* `block` is doing real work: its siblings are direct children of
                the flex row, so flexbox blockifies them and they take the 16px
                line box. This one sits inside the relative wrapper that anchors
                the dropdown, so it stays inline and its box hugs the glyphs —
                1.3px lower than the rest. */}
            <Link
              href="/shop"
              className={`block text-xs uppercase tracking-widest transition-colors ${
                pathname.startsWith('/shop') || pathname.startsWith('/collections')
                  ? 'text-white'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              ShØp
            </Link>

            {shopOpen && collections.length > 0 && (
              <div className="absolute top-full left-0 pt-4 w-48">
                <div className="bg-black border border-[#222] py-2">
                  <Link
                    href="/shop"
                    className="block px-4 py-2 text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors"
                  >
                    All Products
                  </Link>
                  <div className="border-t border-[#222] my-1" />
                  {sortedCollections.map((c) => (
                    <Link
                      key={c.id}
                      href={`/collections/${c.handle}`}
                      className={`block px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                        pathname === `/collections/${c.handle}` ? 'text-white' : 'text-[#888888] hover:text-white'
                      }`}
                    >
                      {c.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/about"
            className={`text-xs uppercase tracking-widest transition-colors ${
              pathname === '/about' ? 'text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            AbØut
          </Link>

          <Link
            href="/contact"
            className={`text-xs uppercase tracking-widest transition-colors ${
              pathname === '/contact' ? 'text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            CØntact
          </Link>

          <Link
            href="/cart"
            className={`relative transition-colors ${
              pathname === '/cart' ? 'text-white' : 'text-[#888888] hover:text-white'
            }`}
            aria-label="Cart"
          >
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="md:hidden flex items-center gap-4">
          <Link href="/cart" className="relative text-white" aria-label="Cart">
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            className="text-white w-8 h-8 flex flex-col items-center justify-center gap-[5px] cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {/* Three bars that fold into an X. The outer bars travel one bar
                plus one gap (7px) to meet in the middle before rotating. */}
            <span
              className={`block h-[2px] w-6 bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
                mobileOpen ? 'translate-y-[7px] rotate-45' : ''
              }`}
            />
            <span
              className={`block h-[2px] w-6 bg-current transition-opacity duration-200 ease-out motion-reduce:transition-none ${
                mobileOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`block h-[2px] w-6 bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
                mobileOpen ? '-translate-y-[7px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu. Kept mounted so it can animate both ways; the 0fr -> 1fr
          grid row expands to the real content height without hardcoding one. */}
      <div
        id="mobile-menu"
        inert={!mobileOpen}
        className={`md:hidden grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          mobileOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0">
          <div className="bg-black border-t border-[#222] px-6 py-6 flex flex-col gap-4">
            <Link
              href="/"
              className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              HØme
            </Link>
            <Link
              href="/shop"
              className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              ShØp
            </Link>
            {sortedCollections.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.handle}`}
                className="text-xs uppercase tracking-widest text-[#555] hover:text-white transition-colors pl-3"
                onClick={() => setMobileOpen(false)}
              >
                {c.title}
              </Link>
            ))}
            <Link
              href="/about"
              className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              AbØut
            </Link>
            <Link
              href="/contact"
              className="text-xs uppercase tracking-widest text-[#888888] hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              CØntact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
