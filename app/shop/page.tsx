import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  getProducts,
  getCollection,
  formatPrice,
  SHOP_ORDER_COLLECTION_HANDLE,
} from '@/lib/shopify';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Shop rugged tools, gear, and everyday carry from Terra Fieldworks — engineered for the field.',
  alternates: { canonical: '/shop' },
};

export default async function ShopPage() {
  // Display order is curated in Shopify (the hidden "All Products" collection,
  // manual sort) so products can be dragged into place in admin without a
  // deploy. Falls back to the full catalog if that collection is missing or
  // empty, so the page is never blank.
  const shopOrder = await getCollection(SHOP_ORDER_COLLECTION_HANDLE).catch(() => null);
  const products = shopOrder?.products.length ? shopOrder.products : await getProducts();

  return (
    <main className="bg-black text-white px-6 pt-6 pb-24 lg:px-20">
      <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-12">ShØp</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/shop/${product.handle}`}
            className="group flex flex-col"
          >
            <div className="relative aspect-[4/3] bg-[#111] overflow-hidden mb-3">
              {product.featuredImage && (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText ?? product.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <h2 className="font-bold uppercase tracking-tight mb-1">{product.title}</h2>
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
    </main>
  );
}
