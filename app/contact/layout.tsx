import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/page-metadata';
import HubShell from '@/components/layout/hub-shell';

// The contact form is a client component (form state); SEO metadata lives
// here in a co-located server layout.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contact');
  return pageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/contact',
  });
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <HubShell>{children}</HubShell>;
}
