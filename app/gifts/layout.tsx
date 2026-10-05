import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/page-metadata';
import HubShell from '@/components/layout/hub-shell';
import { getTranslations } from 'next-intl/server';

// Gifts catalogue is a client component (filters/search), so SEO metadata
// lives here in a co-located server layout. Highly indexable commerce page.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('giftsPages.meta');
  return pageMetadata({
    title: t('title'),
    description: t('description'),
    path: '/gifts',
  });
}

export default function GiftsLayout({ children }: { children: React.ReactNode }) {
  return <HubShell>{children}</HubShell>;
}
