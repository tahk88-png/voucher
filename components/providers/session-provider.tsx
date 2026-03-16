'use client';

// NextAuth v5 doesn't require SessionProvider for server components
// This is kept for client components that might need it
import { CountryProvider } from '@/components/contexts/country-context';
import { LanguageProvider } from '@/components/contexts/language-context';
import { ThemeProvider } from '@/components/providers/theme-provider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CountryProvider>{children}</CountryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
