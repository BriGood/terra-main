import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from '@/app/components/HoverPrefetchLink';
import { getCollection, getCollections, formatPrice, isHiddenCollection } from '@/lib/shopify';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import FitHeading from '@/app/components/FitHeading';

// Deduped so generateMetadata and the page share a single Shopify request per render.
const loadCollection = cache(getCollection);

// Prerendered at build and cached; collections added later render on first visit.
export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ handle: c.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  if (isHiddenCollection(handle)) return { title: 'Collection Not Found' };

  const collection = await loadCollection(handle);

  if (!collection) return { title: 'Collection Not Found' };

  const description =
    collection.description ||
    `Shop the ${collection.title} collection from Terra Fieldworks.`;

  return {
    title: collection.title,
    description,
    alternates: { canonical: `/collections/${collection.handle}` },
    openGraph: { title: collection.title, description, type: 'website' },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  // Curation-only collections aren't browsable categories. notFound() also emits
  // noindex, so the route can't be indexed as a duplicate of /shop.
  if (isHiddenCollection(handle)) notFound();

  const collection = await loadCollection(handle);

  if (!collection) notFound();

  return (
    <main className="bg-black text-white px-6 pt-14 pb-24 lg:px-20">
      <Breadcrumbs crumbs={[{ label: 'ShØp', href: '/shop' }, { label: collection.title }]} />
      {/* The mb-12 lives on the wrapper, not the description — collections without
          one would otherwise collapse to the title's own margin and sit tighter to
          the grid than /shop does. */}
      {/* Inline-size container so the heading's pre-hydration estimate can size
          itself against this box rather than the viewport. */}
      <div className="mb-12 [container-type:inline-size]">
        <FitHeading
          text={collection.title}
          className="font-extrabold uppercase tracking-tight leading-none"
        />
        {collection.description && (
          <p className="text-[#888888] mt-2">{collection.description}</p>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        {collection.products.map((product) => (
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
