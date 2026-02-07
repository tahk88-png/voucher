'use client';

// NextAuth v5 doesn't require SessionProvider for server components
// This is kept for client components that might need it
import { CountryProvider } from '@/components/contexts/country-context';
import { LanguageProvider } from '@/components/contexts/language-context';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CountryProvider>{children}</CountryProvider>
    </LanguageProvider>
  );
}
