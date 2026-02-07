'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { locales } from '@/i18n';

const languageNames: Record<string, string> = {
  en: 'English',
  et: 'Eesti',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  fi: 'Suomi',
  sv: 'Svenska',
  no: 'Norsk',
  da: 'Dansk',
  lv: 'Latviešu',
  lt: 'Lietuvių',
  pl: 'Polski',
  uk: 'Українська',
  it: 'Italiano',
  ru: 'Russian',
};

export default function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
    const newPath = newLocale === 'en'
      ? pathWithoutLocale
      : `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-[#8B7355]" />
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px]" aria-label="Select language">
          <SelectValue>
            {languageNames[locale] || locale}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {languageNames[loc] || loc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
