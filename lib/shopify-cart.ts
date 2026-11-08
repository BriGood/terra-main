import { createStorefrontApiClient, type StorefrontApiClient } from '@shopify/storefront-api-client';

// Cart calls run in the browser, straight against Shopify's Storefront API, so
// adding to or reading the cart never touches the Worker. The Storefront token
// is a public token, meant to ship to browsers; CartProvider receives it from
// the root layout.

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

export function createCartClient(storeDomain: string, publicAccessToken: string): StorefrontApiClient {
  return createStorefrontApiClient({ storeDomain, apiVersion: '2026-04', publicAccessToken });
}

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

export async function createCart(client: StorefrontApiClient, merchandiseId: string, quantity: number): Promise<Cart> {
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

export async function addCartLine(
  client: StorefrontApiClient,
  cartId: string,
  merchandiseId: string,
  quantity: number
): Promise<Cart> {
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

export async function updateCartLine(
  client: StorefrontApiClient,
  cartId: string,
  lineId: string,
  quantity: number
): Promise<Cart> {
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

export async function removeCartLine(client: StorefrontApiClient, cartId: string, lineId: string): Promise<Cart> {
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

export async function getCart(client: StorefrontApiClient, cartId: string): Promise<Cart | null> {
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
