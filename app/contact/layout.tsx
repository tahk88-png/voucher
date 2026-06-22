import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/page-metadata';

// Contact is a client component (form state), so SEO metadata lives here in
// a co-located server layout.
export const metadata: Metadata = pageMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with our team — questions about your vouchers, merchant onboarding, billing, or partnership enquiries. We typically reply within one business day.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
