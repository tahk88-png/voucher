import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/page-metadata';

// Subscription-box listing is a client component, so SEO metadata lives here
// in a co-located server layout. Indexable recurring-commerce page.
export const metadata: Metadata = pageMetadata({
  title: 'Subscription Boxes',
  description:
    'Subscribe to curated monthly voucher boxes from your favourite local merchants — new offers delivered every cycle, cancel anytime.',
  path: '/subscription-boxes',
});

export default function SubscriptionBoxesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
