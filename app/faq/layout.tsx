import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/page-metadata';
import HubShell from '@/components/layout/hub-shell';

// FAQ is a client component (interactive accordions), so SEO metadata lives
// here in a co-located server layout. Indexable: it answers buyer-intent
// questions and removes purchase hesitation.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('faq');
  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/faq',
  });
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <HubShell>{children}</HubShell>;
}
