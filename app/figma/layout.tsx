import type { Metadata } from 'next';
import { FigmaProviders } from './providers';

export const metadata: Metadata = {
  title: 'Figma Design Preview',
  robots: {
    index: false,
    follow: false,
  },
};

export default function FigmaLayout({ children }: { children: React.ReactNode }) {
  return (
    <FigmaProviders>
      {children}
    </FigmaProviders>
  );
}
