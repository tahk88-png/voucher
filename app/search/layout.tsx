import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/page-metadata';
import HubShell from '@/components/layout/hub-shell';

// The search page is a client component, so its metadata lives here.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('searchPage');
  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/search',
  });
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <HubShell>{children}</HubShell>;
}
