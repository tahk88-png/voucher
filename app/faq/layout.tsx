import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/page-metadata';

// FAQ is a client component (interactive accordions), so SEO metadata lives
// here in a co-located server layout. Indexable: it answers buyer-intent
// questions and removes purchase hesitation.
export const metadata: Metadata = pageMetadata({
  title: 'Frequently Asked Questions',
  description:
    'Answers to common questions about buying, redeeming, and managing vouchers and gift cards — payments, refunds, expiry, and merchant support.',
  path: '/faq',
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
