import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/page-metadata';
import HubShell from '@/components/layout/hub-shell';

// The contact form is a client component (form state); SEO metadata lives
// here in a co-located server layout.
export const metadata: Metadata = pageMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with the GiftHub team — questions about your vouchers, merchant onboarding, billing, or partnership enquiries.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <HubShell>{children}</HubShell>;
}
