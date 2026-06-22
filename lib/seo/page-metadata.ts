/**
 * Shared metadata factory for pages that need basic SEO.
 *
 * Usage in any page.tsx:
 * ```ts
 * import { pageMetadata } from '@/lib/seo/page-metadata';
 * export const metadata = pageMetadata({ title: 'Dashboard', description: '...' });
 * ```
 */

import type { Metadata } from 'next';
import { SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE, buildLocaleAlternates, getBaseUrl } from '@/lib/seo';

type PageMetadataOpts = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function pageMetadata(opts: PageMetadataOpts): Metadata {
  const { title, description = SITE_DESCRIPTION, path, noIndex } = opts;
  const baseUrl = getBaseUrl();

  return {
    title,
    description,
    ...(noIndex && { robots: { index: false, follow: false } }),
    ...(path && {
      alternates: {
        canonical: path,
        languages: buildLocaleAlternates(path),
      },
    }),
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      ...(path && { url: path }),
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
    },
  };
}
