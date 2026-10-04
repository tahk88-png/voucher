/**
 * Demo content created by scripts/demo-content.cjs.
 *
 * Demo merchants are identified ONLY by this slug prefix (the script's own
 * `remove` deletes by it too) — keep the two in sync. Demo pages stay visible
 * to visitors, who are told they are samples, but must never be offered to
 * search engines as real offers: they are excluded from the sitemap and their
 * pages are marked noindex.
 */
export const DEMO_SLUG_PREFIX = 'demo-';

export function isDemoMerchantSlug(slug: string | null | undefined): boolean {
  return typeof slug === 'string' && slug.startsWith(DEMO_SLUG_PREFIX);
}

/** Prisma `where` fragment for a Merchant: excludes demo merchants. */
export const notDemoMerchant = {
  NOT: { slug: { startsWith: DEMO_SLUG_PREFIX } },
} as const;
