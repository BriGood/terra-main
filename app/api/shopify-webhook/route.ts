import { revalidateTag } from 'next/cache';
import { after } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getCollections, getProducts, SHOPIFY_CACHE_TAG } from '@/lib/shopify';

// Shopify calls this when a product or collection is created, updated or
// deleted (Settings → Notifications → Webhooks). Rather than work out which
// pages a change touches, it marks every page built from Shopify data stale.
// Stale, not expired: each Cloudflare region keeps its own copy of a page, so
// expiring would make the first visitor in every region wait on a render.
// Stale pages are served as-is once while a background request re-renders them.
export async function POST(req: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    return new Response('SHOPIFY_WEBHOOK_SECRET is not set', { status: 500 });
  }

  // The signature covers the raw body, so read it as text before anything parses it.
  const body = await req.text();
  const signature = req.headers.get('x-shopify-hmac-sha256');
  if (!signature || !(await isValidSignature(body, signature, secret))) {
    return new Response('Invalid signature', { status: 401 });
  }

  revalidateTag(SHOPIFY_CACHE_TAG, 'max');
  // after() runs once the response is sent, by which point the stale marker
  // above has been recorded — warming any earlier would be undone by it.
  after(() => warmStorefront(new URL(req.url).origin));
  return new Response(null, { status: 204 });
}

// Re-renders each page through the WORKER_SELF_REFERENCE binding, the same way
// OpenNext's revalidation queue does: the x-prerender-revalidate header forces
// a fresh render that skips cached Shopify responses and saves the result.
// Each call is its own Worker invocation with its own CPU budget. This makes
// the region Shopify called from fresh straight away; other regions, and pages
// left out here (policies, a deleted product), refresh in the background on
// their next visit.
async function warmStorefront(origin: string) {
  const service = getCloudflareContext().env.WORKER_SELF_REFERENCE;
  const previewModeId = process.env.NEXT_PREVIEW_MODE_ID;
  if (!service || !previewModeId) return;

  const [products, collections] = await Promise.all([getProducts().catch(() => []), getCollections()]);
  const paths = [
    '/',
    '/shop',
    ...products.map((p) => `/shop/${p.handle}`),
    ...collections.map((c) => `/collections/${c.handle}`),
  ];

  await Promise.all(
    paths.map(async (path) => {
      try {
        const res = await service.fetch(`${origin}${path}`, {
          method: 'HEAD',
          headers: { 'x-prerender-revalidate': previewModeId, 'x-isr': '1' },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.headers.get('x-nextjs-cache') !== 'REVALIDATED') {
          console.error(`Warming ${path} failed: ${res.status}`);
        }
      } catch (e) {
        console.error(`Warming ${path} failed:`, e);
      }
    })
  );
}

// Shopify signs each webhook with base64(HMAC-SHA256(body, secret)).
// crypto.subtle.verify compares in constant time.
async function isValidSignature(body: string, signature: string, secret: string): Promise<boolean> {
  let expected: Uint8Array<ArrayBuffer>;
  try {
    expected = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return crypto.subtle.verify('HMAC', key, expected, encoder.encode(body));
}
