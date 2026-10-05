import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/page-metadata';

// Subscription-box listing is a client component, so SEO metadata lives here
// in a co-located server layout. Indexable recurring-commerce page.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('shop.boxes');
  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/subscription-boxes',
  });
}

export default function SubscriptionBoxesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
