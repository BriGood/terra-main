'use client';

import Image from 'next/image';
import Link from '@/app/components/HoverPrefetchLink';
import { useCart } from '@/app/context/CartContext';
import { formatPrice } from '@/lib/shopify';
import Breadcrumbs from '@/app/components/Breadcrumbs';

export default function CartPage() {
  const { cart, itemCount, loading, updateQuantity, removeItem, checkoutUrl } = useCart();

  if (itemCount === 0) {
    return (
      <main className="bg-black text-white px-6 pt-14 pb-24 lg:px-20">
      <Breadcrumbs crumbs={[{ label: 'HØme', href: '/' }, { label: 'Cart' }]} />
        <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-12">Cart</h1>
        <p className="text-[#888888] mb-6">Your cart is empty.</p>
        <Link
          href="/shop"
          className="text-xs uppercase tracking-widest text-white border border-white px-6 py-3 hover:bg-white hover:text-black transition-colors"
        >
          Continue ShØpping
        </Link>
      </main>
    );
  }

  return (
    <main className="bg-black text-white px-6 pt-14 pb-24 lg:px-20">
      <Breadcrumbs crumbs={[{ label: 'HØme', href: '/' }, { label: 'Cart' }]} />
      <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-12">Cart</h1>

      <div className="max-w-3xl flex flex-col gap-8">
        {cart?.lines.map((line) => (
          <div key={line.id} className="flex gap-6 items-start">
            {/* Image */}
            <div className="relative w-24 h-24 flex-none bg-[#111] overflow-hidden">
              {line.merchandise.product.featuredImage && (
                <Image
                  src={line.merchandise.product.featuredImage.url}
                  alt={line.merchandise.product.featuredImage.altText ?? line.merchandise.product.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col gap-2">
              <Link
                href={`/shop/${line.merchandise.product.handle}`}
                className="font-bold uppercase tracking-widest hover:text-[#888888] transition-colors"
              >
                {line.merchandise.product.title}
              </Link>
              {line.merchandise.title !== 'Default Title' && (
                <p className="text-sm text-[#888888]">{line.merchandise.title}</p>
              )}
              <p className="text-sm text-[#888888]">
                {formatPrice(line.merchandise.price.amount, line.merchandise.price.currencyCode)}
              </p>

              {/* Quantity controls */}
              <div className="flex items-center gap-0 w-fit border border-[#333] mt-1">
                <button
                  onClick={() => line.quantity > 1 ? updateQuantity(line.id, line.quantity - 1) : removeItem(line.id)}
                  disabled={loading}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#222] transition-colors cursor-pointer disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-8 h-8 flex items-center justify-center text-sm">
                  {line.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(line.id, line.quantity + 1)}
                  disabled={loading}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#222] transition-colors cursor-pointer disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            {/* Line total + remove */}
            <div className="flex flex-col items-end gap-2">
              <p className="font-bold">
                {formatPrice(
                  (parseFloat(line.merchandise.price.amount) * line.quantity).toString(),
                  line.merchandise.price.currencyCode
                )}
              </p>
              <button
                onClick={() => removeItem(line.id)}
                disabled={loading}
                className="text-xs text-[#555] hover:text-white transition-colors cursor-pointer disabled:opacity-30"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* Divider + total */}
        <div className="border-t border-[#222] pt-6 flex justify-between items-center">
          <span className="text-sm uppercase tracking-widest text-[#888888]">Total</span>
          <span className="text-xl font-bold">
            {cart && formatPrice(cart.totalAmount.amount, cart.totalAmount.currencyCode)}
          </span>
        </div>

        {/* Checkout */}
        <a
          href={checkoutUrl ?? '#'}
          className="bg-white text-black text-sm font-bold uppercase tracking-widest px-8 py-4 text-center hover:bg-[#ccc] transition-colors"
        >
          Checkout
        </a>
      </div>
    </main>
  );
}
