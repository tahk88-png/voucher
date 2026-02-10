import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Language = 'et' | 'en';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: LanguageOption[] = [
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: 'ET' },
  { code: 'en', name: 'English', nativeName: 'English', flag: 'EN' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  availableLanguages: LanguageOption[];
}

const translations: Record<Language, Record<string, string>> = {
  et: {
    'common.welcome': 'Tere tulemast',
    'common.loading': 'Laadimine...',
    'common.save': 'Salvesta',
    'common.cancel': 'Tyhista',
    'common.delete': 'Kustuta',
    'common.edit': 'Muuda',
    'common.close': 'Sulge',
    'common.search': 'Otsi',
    'common.filter': 'Filtreeri',
    'common.viewAll': 'Vaata koiki',
    'common.learnMore': 'Loe rohkem',
    'common.getStarted': 'Alusta',
    'nav.dashboard': 'Toolaud',
    'nav.campaigns': 'Kampaaniad',
    'nav.vouchers': 'Vautserid',
    'nav.giftCards': 'Kinkekaardid',
    'nav.events': 'Sundmused',
    'nav.analytics': 'Analyytika',
    'nav.settings': 'Seaded',
    'nav.logout': 'Logi valja',
    'nav.wallet': 'Rahakott',
    'nav.referrals': 'Soovitused',
    'nav.notifications': 'Teated',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Jaga, teeni, lunasta ule Euroopa',
    'platform.description': 'Euroopa SaaS vautseri- ja soovituste platvorm',
    'b2b.badge': 'PARTNER',
    'b2b.nav.features': 'Voimalused',
    'b2b.nav.pricing': 'Hinnakiri',
    'b2b.nav.faq': 'KKK',
    'b2b.hero.tag': 'Koik-uhes ariplatvorm Euroopa kaupmeestele',
    'b2b.hero.title_start': 'Sinu ari.',
    'b2b.hero.title_end': 'Sinu reeglid.',
    'b2b.hero.desc': 'Uhenda e-pood, renditeenus ja vautserite muuk uhtseks tervikuks. Halda koike uhest mugavast toolauast. Liitu enam kui 1000 kaupmehega.',
    'b2b.hero.cta_primary': 'Loo konto (tasuta)',
    'b2b.hero.cta_secondary': 'Vaata hinnakirja',
    'b2b.stats.merchants': 'Aktiivset kaupmeest',
    'b2b.stats.revenue': 'Genereeritud tulu',
    'b2b.stats.uptime': 'Tookindlus',
    'b2b.stats.support': 'Klienditugi',
    'b2b.features.title': 'Mida me pakume?',
    'b2b.features.subtitle': 'Terviklahendus igat tuupi ettevotlusele',
    'b2b.pricing.title': 'Partneri hinnakiri',
    'b2b.pricing.subtitle': 'Vali sobiv pakett ja alusta kasvamist. Esimesed 2 kuud on tasuta.',
    'b2b.pricing.starter': 'Starter',
    'b2b.pricing.ecommerce': 'E-pood ja ladu',
    'b2b.pricing.rental': 'Rendiplatvorm',
    'b2b.cta.ready': 'Valmis alustama?',
    'b2b.cta.desc': 'Liitu tana ja saa 2 kuud tasuta prooviperioodi. Krediitkaarti pole vaja.',
    'b2b.cta.button': 'Loo tasuta konto',
  },
  en: {
    'common.welcome': 'Welcome',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.viewAll': 'View all',
    'common.learnMore': 'Learn more',
    'common.getStarted': 'Get started',
    'nav.dashboard': 'Dashboard',
    'nav.campaigns': 'Campaigns',
    'nav.vouchers': 'Vouchers',
    'nav.giftCards': 'Gift Cards',
    'nav.events': 'Events',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.logout': 'Log out',
    'nav.wallet': 'Wallet',
    'nav.referrals': 'Referrals',
    'nav.notifications': 'Notifications',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Share, earn, redeem across Europe',
    'platform.description': 'European SaaS voucher and referral platform',
    'b2b.badge': 'PARTNER',
    'b2b.nav.features': 'Features',
    'b2b.nav.pricing': 'Pricing',
    'b2b.nav.faq': 'FAQ',
    'b2b.hero.tag': 'All-in-one business platform for European merchants',
    'b2b.hero.title_start': 'Your business.',
    'b2b.hero.title_end': 'Your rules.',
    'b2b.hero.desc': 'Combine e-commerce, rentals, and voucher sales in one platform. Manage everything from one dashboard. Join over 1000 merchants.',
    'b2b.hero.cta_primary': 'Create account (free)',
    'b2b.hero.cta_secondary': 'View pricing',
    'b2b.stats.merchants': 'Active merchants',
    'b2b.stats.revenue': 'Generated revenue',
    'b2b.stats.uptime': 'Uptime',
    'b2b.stats.support': 'Customer support',
    'b2b.features.title': 'What we offer',
    'b2b.features.subtitle': 'Complete solution for every business type',
    'b2b.pricing.title': 'Partner pricing',
    'b2b.pricing.subtitle': 'Choose the right plan and start growing. The first 2 months are free.',
    'b2b.pricing.starter': 'Starter',
    'b2b.pricing.ecommerce': 'E-commerce and stock',
    'b2b.pricing.rental': 'Rental platform',
    'b2b.cta.ready': 'Ready to start?',
    'b2b.cta.desc': 'Join today and get a 2-month free trial. No credit card required.',
    'b2b.cta.button': 'Create free account',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('et');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const saved = window.localStorage.getItem('selectedLanguage');
    if (saved === 'et' || saved === 'en') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('selectedLanguage', lang);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        availableLanguages: languages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
