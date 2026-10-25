'use client';

import { useState } from 'react';
import AddToCart from './AddToCart';
import { useProductImageJump } from './ProductImageJump';
import { formatPrice } from '@/lib/shopify';
import type { ProductVariant } from '@/lib/shopify';

// Fallback swatch hexes for colors that have no native swatch set in Shopify.
// Shopify's swatch (product.colorSwatches) is the source of truth; this only
// covers brand-specific names Shopify can't guess. Anything missing from both
// still renders with a neutral swatch — colors are never dropped.
const COLOR_MAP: Record<string, string> = {
  black:        '#1c1c1c',
  'matte black': '#1c1c1c',
  tan:          '#c4a882',
  od:           '#4a5240',
};
const FALLBACK_SWATCH = '#3a3a3a';

type Props = {
  variants: ProductVariant[];
  storeDomain: string;
  productTitle: string;
  productHandle: string;
  colorSwatches?: Record<string, { color: string | null; image: string | null }>;
};

export default function VariantSelector({ variants, storeDomain, productTitle, productHandle, colorSwatches = {} }: Props) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? '');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyState, setNotifyState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { showImage } = useProductImageJump();

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const colorOption = selected?.selectedOptions.find((o) => o.name === 'Color');

  const price = formatPrice(selected.price.amount, selected.price.currencyCode);
  const compareAtPrice = selected.compareAtPrice &&
    parseFloat(selected.compareAtPrice.amount) > parseFloat(selected.price.amount)
      ? formatPrice(selected.compareAtPrice.amount, selected.compareAtPrice.currencyCode)
      : null;

  const hasColors = variants.some((v) => v.selectedOptions.some((o) => o.name === 'Color'));

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    setNotifyState('loading');
    try {
      const res = await fetch('/api/notify-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail,
          productTitle,
          productHandle,
          variantId: selected?.id,
          color: colorOption?.value,
        }),
      });
      if (!res.ok) throw new Error();
      setNotifyState('success');
    } catch {
      setNotifyState('error');
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Price */}
      <div className="flex items-center gap-3">
        <p className="text-2xl font-bold">{price}</p>
        {compareAtPrice && (
          <span data-nosnippet="" className="text-lg text-[#888888] line-through">{compareAtPrice}</span>
        )}
      </div>

      {/* Color selector */}
      {hasColors && (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-white mb-2">
            Color — {colorOption?.value}
          </p>
          <div className="flex flex-wrap gap-3">
            {variants.map((v) => {
              const color = v.selectedOptions.find((o) => o.name === 'Color')?.value ?? '';
              if (!color) return null;
              const swatch = colorSwatches[color.toLowerCase()];
              // Shopify swatch wins; then brand fallback map; then a neutral swatch
              // so a color is never dropped just because it lacks a hex.
              // The swatch's image is deliberately not drawn: Shopify shares color
              // entries across products, so a photo set for one product would
              // show on every product in that color. It steers the carousel instead.
              const hex = swatch?.color ?? COLOR_MAP[color.toLowerCase()] ?? FALLBACK_SWATCH;
              const isSelected = v.id === selectedId;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedId(v.id);
                    setNotifyState('idle');
                    setNotifyEmail('');
                    showImage([swatch?.image, v.image?.url]);
                  }}
                  title={color}
                  aria-label={color}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer ring-offset-2 ring-offset-black
                    ${isSelected ? 'ring-2 ring-white' : 'ring-1 ring-[#444] hover:ring-white'}
                    ${!v.availableForSale ? 'opacity-40' : ''}
                  `}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Add to cart or Notify Me */}
      {selected.availableForSale ? (
        <AddToCart
          merchandiseId={selected.id}
          availableForSale={selected.availableForSale}
          checkoutUrl={`https://${storeDomain}/cart/${selected.id.split('/').pop()}:1`}
          storeDomain={storeDomain}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-[#555]">Out of Stock</p>
          {notifyState === 'success' ? (
            <p className="text-xs uppercase tracking-widest text-[#888888]">We&apos;ll email you when it&apos;s back.</p>
          ) : (
            <form onSubmit={handleNotify} className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="Your email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                className="bg-transparent border border-[#333] text-white text-sm px-4 py-3 placeholder:text-[#555] focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="submit"
                disabled={notifyState === 'loading'}
                className="border border-white text-white text-sm font-bold uppercase tracking-widest py-3 hover:bg-white hover:text-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                {notifyState === 'loading' ? 'Sending...' : 'Notify Me'}
              </button>
              {notifyState === 'error' && (
                <p className="text-xs text-red-400">Something went wrong. Try again.</p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
