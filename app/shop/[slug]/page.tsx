import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/shopify';
import { SITE_URL } from '@/lib/site';
import ProductImageCarousel from '@/app/components/ProductImageCarousel';
import VariantSelector from '@/app/components/VariantSelector';
import { ProductImageJumpProvider } from '@/app/components/ProductImageJump';
import Breadcrumbs from '@/app/components/Breadcrumbs';

// Deduped so generateMetadata and the page share a single Shopify request per render.
const loadProduct = cache(getProduct);

function metaDescription(product: { seo: { description: string | null }; description: string }): string {
  const text = product.seo.description || product.description || '';
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (!product) return { title: 'Product Not Found' };

  const title = product.seo.title || product.title;
  const description = metaDescription(product);
  const images = product.images[0]?.url ? [product.images[0].url] : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/shop/${product.handle}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/shop/${product.handle}`,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  if (!product) notFound();

  const inStock = product.variants.some((v) => v.availableForSale);
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images.map((img) => img.url),
    ...(product.vendor ? { brand: { '@type': 'Brand', name: product.vendor } } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/shop/${product.handle}`,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      price: product.priceRange.minVariantPrice.amount,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 pt-14 pb-14 lg:px-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          crumbs={[
            { label: 'ShØp', href: '/shop' },
            ...(product.primaryCollection
              ? [{ label: product.primaryCollection.title, href: `/collections/${product.primaryCollection.handle}` }]
              : []),
            { label: product.title },
          ]}
        />
      </div>
      <ProductImageJumpProvider>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-12">

          {/* Images */}
          <ProductImageCarousel images={product.images} title={product.title} />

          {/* Details */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h1 className="text-3xl font-extrabold uppercase tracking-widest">
                {product.title}
              </h1>
              {product.productType && (
                <p className="mt-1 text-sm uppercase tracking-widest text-[#888888]">
                  {product.productType}
                </p>
              )}
            </div>

            <VariantSelector
              variants={product.variants}
              storeDomain={process.env.SHOPIFY_STORE_DOMAIN ?? ''}
              productTitle={product.title}
              productHandle={product.handle}
              colorSwatches={product.colorSwatches}
            />

            {product.descriptionHtml && (
              <div
                className="text-[#888888] mt-8 leading-snug [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}

            {(product.specs.dimensions || product.specs.material || product.specs.weight || product.specs.origin) && (
              <div className="mt-12">
                <div className="flex flex-col gap-3">
                  {product.specs.dimensions && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#555] uppercase tracking-widest text-xs">Dimensions</span>
                      <span className="text-[#888888]">{product.specs.dimensions}</span>
                    </div>
                  )}
                  {product.specs.material && (
                    <div className="flex justify-between text-sm border-t border-[#111] pt-3">
                      <span className="text-[#555] uppercase tracking-widest text-xs">Material</span>
                      <span className="text-[#888888]">{product.specs.material}</span>
                    </div>
                  )}
                  {product.specs.weight && (
                    <div className="flex justify-between text-sm border-t border-[#111] pt-3">
                      <span className="text-[#555] uppercase tracking-widest text-xs">Weight</span>
                      <span className="text-[#888888]">{product.specs.weight}</span>
                    </div>
                  )}
                  {product.specs.origin && (
                    <div className="flex justify-between text-sm border-t border-[#111] pt-3">
                      <span className="text-[#555] uppercase tracking-widest text-xs">Origin</span>
                      <span className="text-[#888888]">{product.specs.origin}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </ProductImageJumpProvider>
    </main>
  );
}
