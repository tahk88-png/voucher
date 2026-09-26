
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FigmaProviders } from './providers';
import { isDesignPreviewEnabled } from './design-preview';

export const metadata: Metadata = {
  title: 'Figma Design Preview',
  robots: {
    index: false,
    follow: false,
  },
};

// Check the gate on every request. A statically prerendered segment would
// bake the build machine's environment into the output instead of reading
// the server's ENABLE_DESIGN_PREVIEW.
export const dynamic = 'force-dynamic';

export default function FigmaLayout({ children }: { children: React.ReactNode }) {
  if (!isDesignPreviewEnabled()) notFound();

  return (
    <FigmaProviders>
      {children}
    </FigmaProviders>
  );
}
