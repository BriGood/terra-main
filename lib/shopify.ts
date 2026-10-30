import { createStorefrontApiClient } from '@shopify/storefront-api-client';

export type ProductListItem = {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  productType: string | null;
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  compareAtPriceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  } | null;
  featuredImage: {
    url: string;
    altText: string | null;
  } | null;
};

export type ProductVariant = {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice: {
    amount: string;
    currencyCode: string;
  } | null;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  image: { url: string } | null;
};

export type ProductSpecs = {
  dimensions: string | null;
  material: string | null;
  weight: string | null;
  origin: string | null;
};

export type Product = {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  productType: string | null;
  description: string;
  descriptionHtml: string;
  images: { url: string; altText: string | null }[];
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: ProductVariant[];
  specs: ProductSpecs;
  options: { name: string; values: string[] }[];
  // Native Shopify swatches for the "Color" option, keyed by lowercased value
  // (e.g. "black"). Merchant-controlled in admin, so new colors flow through
  // automatically without code changes. `color` is a hex and fills the swatch;
  // `image` isn't drawn — when it's one of the product's photos, picking that
  // color jumps the carousel to it.
  colorSwatches: Record<string, { color: string | null; image: string | null }>;
  // Category for the breadcrumb trail. Curation-only collections are skipped so
  // the trail never exposes one; null when the product isn't in a public one.
  primaryCollection: { title: string; handle: string } | null;
  seo: { title: string | null; description: string | null };
};

export type CollectionListItem = {
  id: string;
  title: string;
  handle: string;
};

export type Collection = {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: ProductListItem[];
};

// Curation-only collections. They must stay published to the Storefront sales
// channel for getCollection() to read them, so they're hidden in code rather
// than in Shopify: getCollections() — which feeds both the nav and the sitemap —
// filters them out, while getCollection(handle) still fetches them by name.
export const FEATURED_COLLECTION_HANDLE = 'featured';
export const SHOP_ORDER_COLLECTION_HANDLE = 'all-products';

const HIDDEN_COLLECTION_HANDLES = new Set<string>([
  FEATURED_COLLECTION_HANDLE,
  SHOP_ORDER_COLLECTION_HANDLE,
]);

export function isHiddenCollection(handle: string): boolean {
  return HIDDEN_COLLECTION_HANDLES.has(handle);
}

// Shopify's Product.productType is a non-null String that comes back as "" when
// the merchant hasn't set one, so blanks collapse to null at the boundary and
// callers only ever branch on null.
function normalizeProductType(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function normalizeListItem(node: ProductListItem): ProductListItem {
  return { ...node, productType: normalizeProductType(node.productType) };
}

function getClient() {
  return createStorefrontApiClient({
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN!,
    apiVersion: '2026-04',
    publicAccessToken: process.env.SHOPIFY_STOREFRONT_TOKEN!,
  });
}

export async function getProducts(): Promise<ProductListItem[]> {
  const client = getClient();
  const { data, errors } = await client.request(`
    {
      products(first: 50) {
        nodes {
          id
          title
          handle
          vendor
          productType
          availableForSale
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
          }
        }
      }
    }
  `);

  if (errors) throw new Error(errors.message);
  return (data.products.nodes as ProductListItem[]).map(normalizeListItem);
}

export async function getProduct(handle: string): Promise<Product | null> {
  const client = getClient();
  const { data, errors } = await client.request(
    `
    query Product($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        vendor
        productType
        description
        descriptionHtml
        seo {
          title
          description
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 10) {
          nodes {
            url
            altText
          }
        }
        collections(first: 10) {
          nodes {
            title
            handle
          }
        }
        options {
          name
          optionValues {
            name
            swatch {
              color
              image {
                ... on MediaImage { image { url } }
              }
            }
          }
        }
        variants(first: 20) {
          nodes {
            id
            title
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            availableForSale
            selectedOptions {
              name
              value
            }
            image {
              url
            }
          }
        }
        metafields(identifiers: [
          { namespace: "custom", key: "dimensions" },
          { namespace: "custom", key: "material" },
          { namespace: "custom", key: "weight" },
          { namespace: "custom", key: "origin" }
        ]) {
          key
          value
        }
      }
    }
  `,
    { variables: { handle } }
  );

  if (errors) throw new Error(errors.message);
  if (!data.product) return null;

  const metafields: { key: string; value: string }[] = data.product.metafields?.filter(Boolean) ?? [];
  const getMeta = (key: string) => metafields.find((m) => m.key === key)?.value ?? null;

  type RawOptionValue = {
    name: string;
    swatch: { color: string | null; image: { image: { url: string } | null } | null } | null;
  };
  type RawOption = { name: string; optionValues: RawOptionValue[] };
  const rawOptions: RawOption[] = data.product.options ?? [];

  const colorSwatches: Record<string, { color: string | null; image: string | null }> = {};
  for (const ov of rawOptions.find((o) => o.name === 'Color')?.optionValues ?? []) {
    colorSwatches[ov.name.toLowerCase()] = {
      color: ov.swatch?.color ?? null,
      image: ov.swatch?.image?.image?.url ?? null,
    };
  }

  const rawCollections: { title: string; handle: string }[] = data.product.collections?.nodes ?? [];

  return {
    ...data.product,
    primaryCollection: rawCollections.find((c) => !isHiddenCollection(c.handle)) ?? null,
    productType: normalizeProductType(data.product.productType),
    images: data.product.images.nodes,
    variants: data.product.variants.nodes,
    options: rawOptions.map((o) => ({ name: o.name, values: o.optionValues.map((v) => v.name) })),
    colorSwatches,
    specs: {
      dimensions: getMeta('dimensions'),
      material: getMeta('material'),
      weight: getMeta('weight'),
      origin: getMeta('origin'),
    },
  };
}

export type FeedVariant = {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
  selectedOptions: { name: string; value: string }[];
  weight: number | null;
  weightUnit: string | null;
};

export type FeedProduct = {
  id: string;
  title: string;
  handle: string;
  description: string;
  productType: string | null;
  vendor: string;
  images: { url: string; altText: string | null }[];
  variants: FeedVariant[];
};

// Every product published to this sales channel, following cursor pagination to
// the end. The rest of the app caps at `first: 50`; a feed that silently dropped
// products past that ceiling would be worse than one that failed loudly.
export async function getAllProductsForFeed(): Promise<FeedProduct[]> {
  const client = getClient();
  const all: FeedProduct[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < 20; page++) {
    const { data, errors } = await client.request(
      `
      query FeedProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            title
            handle
            description
            productType
            vendor
            images(first: 10) { nodes { url altText } }
            variants(first: 100) {
              nodes {
                id
                title
                sku
                availableForSale
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                selectedOptions { name value }
                weight
                weightUnit
              }
            }
          }
        }
      }
    `,
      { variables: { cursor } }
    );

    if (errors) throw new Error(errors.message);

    type RawNode = Omit<FeedProduct, 'images' | 'variants' | 'productType'> & {
      productType: string;
      images: { nodes: { url: string; altText: string | null }[] };
      variants: { nodes: FeedVariant[] };
    };
    const conn = data.products as { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: RawNode[] };

    for (const node of conn.nodes) {
      all.push({
        ...node,
        productType: normalizeProductType(node.productType),
        images: node.images.nodes,
        variants: node.variants.nodes,
      });
    }

    if (!conn.pageInfo.hasNextPage) return all;
    cursor = conn.pageInfo.endCursor;
  }

  return all;
}

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    product: {
      title: string;
      handle: string;
      featuredImage: { url: string; altText: string | null } | null;
    };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
  totalAmount: { amount: string; currencyCode: string };
};

const CART_FIELDS = `
  id
  checkoutUrl
  lines(first: 100) {
    nodes {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          title
          price { amount currencyCode }
          product {
            title
            handle
            featuredImage { url altText }
          }
        }
      }
    }
  }
  cost {
    totalAmount { amount currencyCode }
  }
`;

function parseCart(cart: Record<string, unknown>): Cart {
  const lines = cart.lines as { nodes: CartLine[] };
  const cost = cart.cost as { totalAmount: { amount: string; currencyCode: string } };
  return {
    id: cart.id as string,
    checkoutUrl: cart.checkoutUrl as string,
    lines: lines.nodes,
    totalAmount: cost.totalAmount,
  };
}

export async function createCart(merchandiseId: string, quantity: number): Promise<Cart> {
  const client = getClient();
  const { data, errors } = await client.request(
    `
    mutation CartCreate($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart { ${CART_FIELDS} }
      }
    }
  `,
    { variables: { lines: [{ merchandiseId, quantity }] } }
  );
  if (errors) throw new Error(errors.message);
  return parseCart(data.cartCreate.cart);
}

export async function addCartLine(cartId: string, merchandiseId: string, quantity: number): Promise<Cart> {
  const client = getClient();
  const { data, errors } = await client.request(
    `
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
      }
    }
  `,
    { variables: { cartId, lines: [{ merchandiseId, quantity }] } }
  );
  if (errors) throw new Error(errors.message);
  return parseCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  const client = getClient();
  const { data, errors } = await client.request(
    `
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
      }
    }
  `,
    { variables: { cartId, lines: [{ id: lineId, quantity }] } }
  );
  if (errors) throw new Error(errors.message);
  return parseCart(data.cartLinesUpdate.cart);
}

export async function removeCartLine(cartId: string, lineId: string): Promise<Cart> {
  const client = getClient();
  const { data, errors } = await client.request(
    `
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ${CART_FIELDS} }
      }
    }
  `,
    { variables: { cartId, lineIds: [lineId] } }
  );
  if (errors) throw new Error(errors.message);
  return parseCart(data.cartLinesRemove.cart);
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const client = getClient();
  const { data, errors } = await client.request(
    `
    query GetCart($cartId: ID!) {
      cart(id: $cartId) { ${CART_FIELDS} }
    }
  `,
    { variables: { cartId } }
  );
  if (errors) throw new Error(errors.message);
  if (!data.cart) return null;
  return parseCart(data.cart);
}

export async function getCollections(): Promise<CollectionListItem[]> {
  try {
    const client = getClient();
    const { data, errors } = await client.request(`
      {
        collections(first: 20) {
          nodes {
            id
            title
            handle
          }
        }
      }
    `);
    if (errors) return [];
    return (data.collections.nodes as CollectionListItem[]).filter(
      (c) => !isHiddenCollection(c.handle)
    );
  } catch {
    return [];
  }
}

export async function getCollection(handle: string): Promise<Collection | null> {
  const client = getClient();
  const { data, errors } = await client.request(
    `
    query Collection($handle: String!) {
      collection(handle: $handle) {
        id
        title
        handle
        description
        products(first: 50, sortKey: COLLECTION_DEFAULT) {
          nodes {
            id
            title
            handle
            vendor
            productType
            availableForSale
            priceRange {
              minVariantPrice { amount currencyCode }
            }
            compareAtPriceRange {
              minVariantPrice { amount currencyCode }
            }
            featuredImage { url altText }
          }
        }
      }
    }
  `,
    { variables: { handle } }
  );
  if (errors) throw new Error(errors.message);
  if (!data.collection) return null;
  return {
    ...data.collection,
    products: (data.collection.products.nodes as ProductListItem[]).map(normalizeListItem),
  };
}

export type ShopPolicy = {
  title: string;
  body: string;
  handle: string;
};

export async function getPolicy(handle: string): Promise<ShopPolicy | null> {
  const client = getClient();
  const { data, errors } = await client.request(`
    {
      shop {
        privacyPolicy { title body handle }
        termsOfService { title body handle }
        refundPolicy { title body handle }
        shippingPolicy { title body handle }
      }
    }
  `);
  if (errors) return null;
  const { shop } = data;
  const all: (ShopPolicy | null)[] = [
    shop.privacyPolicy,
    shop.termsOfService,
    shop.refundPolicy,
    shop.shippingPolicy,
  ];
  return all.filter(Boolean).find((p) => p!.handle === handle) ?? null;
}

// Shop metafield `custom.free_shipping_threshold` (Money), edited in admin under
// Settings → Custom data → Shop. The Storefront API can't read shipping rates,
// so this is a separate value the merchant keeps in sync with the free-shipping
// minimum on the rate itself. Returns the header-ready string ("$40"), or null
// when it's unset so the header shows nothing rather than a stale number.
export async function getFreeShippingThreshold(): Promise<string | null> {
  try {
    const client = getClient();
    const { data, errors } = await client.request(`
      {
        shop {
          metafield(namespace: "custom", key: "free_shipping_threshold") { value }
        }
      }
    `);
    const value = data?.shop?.metafield?.value;
    if (errors || !value) return null;
    // Money metafields come back as JSON: {"amount":"40.0","currency_code":"USD"}
    const { amount, currency_code } = JSON.parse(value) as { amount: string; currency_code: string };
    const number = parseFloat(amount);
    if (!Number.isFinite(number)) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency_code,
      minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    }).format(number);
  } catch {
    return null;
  }
}

export function formatPrice(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}
