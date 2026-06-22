import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/page-metadata';

// Gifts catalogue is a client component (filters/search), so SEO metadata
// lives here in a co-located server layout. Highly indexable commerce page.
export const metadata: Metadata = pageMetadata({
  title: 'Gift Cards & Gifting',
  description:
    'Browse and buy digital gift cards from local merchants. Send a thoughtful gift in seconds — delivered by email, redeemable in-store or online.',
  path: '/gifts',
});

export default function GiftsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
