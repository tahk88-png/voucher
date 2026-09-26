import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/page-metadata';
import HubShell from '@/components/layout/hub-shell';

// The search page is a client component, so its metadata lives here.
export const metadata: Metadata = pageMetadata({
  title: 'Search',
  description: 'Search live campaigns and vouchers from merchants on GiftHub.',
  path: '/search',
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <HubShell>{children}</HubShell>;
}
