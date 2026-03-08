'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import {
  isSupportedLocale,
  languageOptions,
  languageStorageKey,
  localeCookieName,
  supportedLocales,
  type SupportedLocale,
} from '@/lib/locale-config';

const languageNames = Object.fromEntries(
  languageOptions.map((language) => [language.code, language.nativeName]),
) as Record<SupportedLocale, string>;

const languageEmojis = Object.fromEntries(
  languageOptions.map((language) => [language.code, language.emoji]),
) as Record<SupportedLocale, string>;

function persistLocaleSelection(locale: SupportedLocale) {
  const oneYear = 60 * 60 * 24 * 365;
  const cookieAttributes = `path=/; max-age=${oneYear}; samesite=lax`;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(languageStorageKey, locale);
  }

  if (typeof document !== 'undefined') {
    document.cookie = `${localeCookieName}=${encodeURIComponent(locale)}; ${cookieAttributes}`;
    document.cookie = `selectedLanguage=${encodeURIComponent(locale)}; ${cookieAttributes}`;
  }
}

export default function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    if (!isSupportedLocale(newLocale)) {
      return;
    }

    persistLocaleSelection(newLocale);

    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
    const newPath = newLocale === 'en' ? pathWithoutLocale : `/${newLocale}${pathWithoutLocale}`;

    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-[var(--text-faint)]" />
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[180px]" aria-label="Select language">
          <SelectValue>
            {languageEmojis[locale as SupportedLocale] || ''} {languageNames[locale as SupportedLocale] || locale}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedLocales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              <span className="inline-flex items-center gap-2">
                <span>{languageEmojis[loc] || ''}</span>
                <span>{languageNames[loc] || loc}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
