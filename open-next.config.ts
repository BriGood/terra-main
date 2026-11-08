import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";
import kvNextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache";
import { withFilter } from "@opennextjs/cloudflare/overrides/tag-cache/tag-cache-filter";

// Pages are rendered once and served from cache until their `revalidate`
// window passes, instead of a full Next.js render on every request — rendering
// is what pushed requests past the Worker CPU limit (Error 1102) at launch.
// KV holds the rendered pages; the regional cache (Cache API) sits in front so
// most hits never reach KV. The memory queue re-renders stale pages in the
// background through the WORKER_SELF_REFERENCE binding.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(kvIncrementalCache, { mode: "long-lived" }),
  // The Shopify webhook calls revalidateTag("shopify", "max"), which marks every
  // page built from Shopify data stale through this one tag (see
  // SHOPIFY_CACHE_TAG in lib/shopify.ts). Every cache hit checks the tag cache,
  // so filtering to just that tag keeps it to a single KV read per request
  // instead of one per route segment.
  tagCache: withFilter({
    tagCache: kvNextTagCache,
    filterFn: (tag) => (typeof tag === "string" ? tag : tag.tag) === "shopify",
  }),
  queue: memoryQueue,
  // Serve cached pages before the Next.js server is even loaded.
  enableCacheInterception: true,
});
