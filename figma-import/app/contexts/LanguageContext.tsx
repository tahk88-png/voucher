import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'et' | 'ru' | 'en' | 'lv' | 'lt' | 'fi' | 'sv' | 'no' | 'da' | 'pl' | 'de' | 'nl' | 'fr' | 'cs' | 'sk';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: LanguageOption[] = [
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  availableLanguages: LanguageOption[];
}

// Base translations (Estonian, Russian, English are complete, others have basic translations)
const translations: Record<Language, Record<string, string>> = {
  et: {
    // Common
    'common.welcome': 'Tere tulemast',
    'common.loading': 'Laadimine...',
    'common.save': 'Salvesta',
    'common.cancel': 'Tühista',
    'common.delete': 'Kustuta',
    'common.edit': 'Muuda',
    'common.close': 'Sulge',
    'common.search': 'Otsi',
    'common.filter': 'Filtreeri',
    'common.viewAll': 'Vaata kõiki',
    'common.learnMore': 'Loe rohkem',
    'common.getStarted': 'Alusta',
    
    // Navigation
    'nav.dashboard': 'Töölaud',
    'nav.campaigns': 'Kampaaniad',
    'nav.vouchers': 'Vautšerid',
    'nav.giftCards': 'Kinkekaardid',
    'nav.events': 'Üritused',
    'nav.analytics': 'Analüütika',
    'nav.settings': 'Seaded',
    'nav.logout': 'Logi välja',
    'nav.wallet': 'Rahakott',
    'nav.referrals': 'Soovitused',
    'nav.notifications': 'Teated',
    
    // Dashboard
    'dashboard.merchant': 'Kaupmehe Töölaud',
    'dashboard.user': 'Minu Auhindad',
    'dashboard.admin': 'Admin Kontroll',
    'dashboard.welcomeBack': 'Tere tulemast tagasi',
    'dashboard.totalRevenue': 'Kogutulu',
    'dashboard.activeUsers': 'Aktiivsed Kasutajad',
    'dashboard.conversionRate': 'Konversioonimäär',
    'dashboard.activeCampaigns': 'Aktiivsed Kampaaniad',
    'dashboard.totalRedemptions': 'Kokku Lunastusi',
    'dashboard.todayRedemptions': 'Täna Lunastusi',
    
    // Campaigns
    'campaigns.create': 'Loo Kampaania',
    'campaigns.title': 'Kampaaniad',
    'campaigns.active': 'Aktiivsed',
    'campaigns.draft': 'Mustandid',
    'campaigns.expired': 'Aegunud',
    'campaigns.viewDetails': 'Vaata Detaile',
    'campaigns.shareCampaign': 'Jaga Kampaaniat',
    
    // Vouchers
    'vouchers.myVouchers': 'Minu Vautšerid',
    'vouchers.available': 'Saadaval',
    'vouchers.used': 'Kasutatud',
    'vouchers.expired': 'Aegunud',
    'vouchers.expiresIn': 'Aegub',
    'vouchers.copyCode': 'Kopeeri Kood',
    
    // Gift Cards
    'giftCards.myGiftCards': 'Minu Kinkekaardid',
    'giftCards.balance': 'Saldo',
    'giftCards.reload': 'Laadi Uuesti',
    
    // Referrals
    'referrals.title': 'Soovitusprogramm',
    'referrals.yourLink': 'Sinu Link',
    'referrals.totalEarned': 'Kokku Teenitud',
    'referrals.shareAndEarn': 'Jaga ja Teeni',
    
    // Stats
    'stats.thisMonth': 'See Kuu',
    'stats.thisWeek': 'See Nädal',
    'stats.today': 'Täna',
    'stats.total': 'Kokku',
    
    // Actions
    'actions.share': 'Jaga',
    'actions.redeem': 'Lunasta',
    'actions.download': 'Laadi Alla',
    'actions.upgrade': 'Uuenda',
    'actions.manage': 'Halda',
    
    // Platform
    'platform.name': 'GiftHub',
    'platform.tagline': 'Jaga, Teeni, Lunasta Euroopas',
    'platform.description': 'Euroopa SaaS vautšeri- ja soovituste platvorm',

    // B2B Landing
    'b2b.badge': 'PARTNER',
    'b2b.nav.features': 'Võimalused',
    'b2b.nav.pricing': 'Hinnakiri',
    'b2b.nav.faq': 'KKK',
    'b2b.hero.tag': 'Kõik-ühes äriplatvorm Euroopa kaupmeestele',
    'b2b.hero.title_start': 'Sinu Äri.',
    'b2b.hero.title_end': 'Sinu Reeglid.',
    'b2b.hero.desc': 'Ühenda e-pood, renditeenus ja vautšerite müük ühtseks tervikuks. Halda kõike ühest mugavast töölauast. Liitu enam kui 1000 kaupmehega.',
    'b2b.hero.cta_primary': 'Loo konto (Tasuta)',
    'b2b.hero.cta_secondary': 'Vaata Hinnakirja',
    'b2b.stats.merchants': 'Aktiivset kaupmeest',
    'b2b.stats.revenue': 'Genereeritud tulu',
    'b2b.stats.uptime': 'Töökindlus',
    'b2b.stats.support': 'Klienditugi',
    'b2b.features.title': 'Mida me pakume?',
    'b2b.features.subtitle': 'Terviklahendus igat tüüpi ettevõtlusele',
    'b2b.pricing.title': 'Partneri Hinnakiri',
    'b2b.pricing.subtitle': 'Vali endale sobiv pakett ja alusta kasvamist. Esimesed 2 kuud on tasuta.',
    'b2b.pricing.starter': 'Starter',
    'b2b.pricing.ecommerce': 'E-pood & Ladu',
    'b2b.pricing.rental': 'Rendiplatvorm',
    'b2b.cta.ready': 'Valmis alustama?',
    'b2b.cta.desc': 'Liitu täna ja saa 2 kuud tasuta prooviperioodi. Krediitkaarti pole vaja.',
    'b2b.cta.button': 'Loo Tasuta Konto',
  },
  
  ru: {
    // Common
    'common.welcome': 'Добро пожаловать',
    'common.loading': 'Загрузка...',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Изменить',
    'common.close': 'Закрыть',
    'common.search': 'Поиск',
    'common.filter': 'Фильтр',
    'common.viewAll': 'Посмотреть все',
    'common.learnMore': 'Узнать больше',
    'common.getStarted': 'Начать',
    
    // Navigation
    'nav.dashboard': 'Панель',
    'nav.campaigns': 'Кампании',
    'nav.vouchers': 'Ваучеры',
    'nav.giftCards': 'Подарочные карты',
    'nav.events': 'События',
    'nav.analytics': 'Аналитика',
    'nav.settings': 'Настройки',
    'nav.logout': 'Выйти',
    'nav.wallet': 'Кошелек',
    'nav.referrals': 'Рефералы',
    'nav.notifications': 'Уведомления',
    
    // Dashboard
    'dashboard.merchant': 'Панель Продавца',
    'dashboard.user': 'Мои Награды',
    'dashboard.admin': 'Админ Панель',
    'dashboard.welcomeBack': 'С возвращением',
    'dashboard.totalRevenue': 'Общий Доход',
    'dashboard.activeUsers': 'Активные Пользователи',
    'dashboard.conversionRate': 'Конверсия',
    'dashboard.activeCampaigns': 'Активные Кампании',
    'dashboard.totalRedemptions': 'Всего Погашений',
    'dashboard.todayRedemptions': 'Сегодня Погашений',
    
    // Campaigns
    'campaigns.create': 'Создать Кампанию',
    'campaigns.title': 'Кампании',
    'campaigns.active': 'Активные',
    'campaigns.draft': 'Черновики',
    'campaigns.expired': 'Истекшие',
    'campaigns.viewDetails': 'Подробнее',
    'campaigns.shareCampaign': 'Поделиться',
    
    // Vouchers
    'vouchers.myVouchers': 'Мои Ваучеры',
    'vouchers.available': 'Доступно',
    'vouchers.used': 'Использовано',
    'vouchers.expired': 'Истекло',
    'vouchers.expiresIn': 'Истекает через',
    'vouchers.copyCode': 'Копировать Код',
    
    // Gift Cards
    'giftCards.myGiftCards': 'Мои Подарочные Карты',
    'giftCards.balance': 'Баланс',
    'giftCards.reload': 'Пополнить',
    
    // Referrals
    'referrals.title': 'Реферальная Программа',
    'referrals.yourLink': 'Ваша Ссылка',
    'referrals.totalEarned': 'Всего Заработано',
    'referrals.shareAndEarn': 'Делитесь и Зарабатывайте',
    
    // Stats
    'stats.thisMonth': 'Этот Месяц',
    'stats.thisWeek': 'Эта Неделя',
    'stats.today': 'Сегодня',
    'stats.total': 'Всего',
    
    // Actions
    'actions.share': 'Поделиться',
    'actions.redeem': 'Погасить',
    'actions.download': 'Скачать',
    'actions.upgrade': 'Обновить',
    'actions.manage': 'Управлять',
    
    // Platform
    'platform.name': 'GiftHub',
    'platform.tagline': 'Делитесь, Зарабатывайте, Погашайте в Европе',
    'platform.description': 'Европейская SaaS платформа ваучеров и рекомендаций',
  },
  
  en: {
    // Common
    'common.welcome': 'Welcome',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.viewAll': 'View All',
    'common.learnMore': 'Learn More',
    'common.getStarted': 'Get Started',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.campaigns': 'Campaigns',
    'nav.vouchers': 'Vouchers',
    'nav.giftCards': 'Gift Cards',
    'nav.events': 'Events',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.wallet': 'Wallet',
    'nav.referrals': 'Referrals',
    'nav.notifications': 'Notifications',
    
    // Dashboard
    'dashboard.merchant': 'Merchant Dashboard',
    'dashboard.user': 'My Rewards',
    'dashboard.admin': 'Admin Control',
    'dashboard.welcomeBack': 'Welcome back',
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.activeUsers': 'Active Users',
    'dashboard.conversionRate': 'Conversion Rate',
    'dashboard.activeCampaigns': 'Active Campaigns',
    'dashboard.totalRedemptions': 'Total Redemptions',
    'dashboard.todayRedemptions': 'Today Redemptions',
    
    // Campaigns
    'campaigns.create': 'Create Campaign',
    'campaigns.title': 'Campaigns',
    'campaigns.active': 'Active',
    'campaigns.draft': 'Draft',
    'campaigns.expired': 'Expired',
    'campaigns.viewDetails': 'View Details',
    'campaigns.shareCampaign': 'Share Campaign',
    
    // Vouchers
    'vouchers.myVouchers': 'My Vouchers',
    'vouchers.available': 'Available',
    'vouchers.used': 'Used',
    'vouchers.expired': 'Expired',
    'vouchers.expiresIn': 'Expires in',
    'vouchers.copyCode': 'Copy Code',
    
    // Gift Cards
    'giftCards.myGiftCards': 'My Gift Cards',
    'giftCards.balance': 'Balance',
    'giftCards.reload': 'Reload',
    
    // Referrals
    'referrals.title': 'Referral Program',
    'referrals.yourLink': 'Your Link',
    'referrals.totalEarned': 'Total Earned',
    'referrals.shareAndEarn': 'Share and Earn',
    
    // Stats
    'stats.thisMonth': 'This Month',
    'stats.thisWeek': 'This Week',
    'stats.today': 'Today',
    'stats.total': 'Total',
    
    // Actions
    'actions.share': 'Share',
    'actions.redeem': 'Redeem',
    'actions.download': 'Download',
    'actions.upgrade': 'Upgrade',
    'actions.manage': 'Manage',
    
    // Platform
    'platform.name': 'GiftHub',
    'platform.tagline': 'Share, Earn, Redeem Across Europe',
    'platform.description': 'European SaaS Voucher & Referral Platform',

    // B2B Landing
    'b2b.badge': 'PARTNER',
    'b2b.nav.features': 'Features',
    'b2b.nav.pricing': 'Pricing',
    'b2b.nav.faq': 'FAQ',
    'b2b.hero.tag': 'All-in-one business platform for European merchants',
    'b2b.hero.title_start': 'Your Business.',
    'b2b.hero.title_end': 'Your Rules.',
    'b2b.hero.desc': 'Combine e-commerce, rentals, and voucher sales in one unified platform. Manage everything from one dashboard. Join over 1000 merchants.',
    'b2b.hero.cta_primary': 'Create Account (Free)',
    'b2b.hero.cta_secondary': 'View Pricing',
    'b2b.stats.merchants': 'Active Merchants',
    'b2b.stats.revenue': 'Generated Revenue',
    'b2b.stats.uptime': 'Uptime',
    'b2b.stats.support': 'Customer Support',
    'b2b.features.title': 'What we offer?',
    'b2b.features.subtitle': 'Complete solution for every type of business',
    'b2b.pricing.title': 'Partner Pricing',
    'b2b.pricing.subtitle': 'Choose the right plan and start growing. First 2 months are free.',
    'b2b.pricing.starter': 'Starter',
    'b2b.pricing.ecommerce': 'E-commerce & Stock',
    'b2b.pricing.rental': 'Rental Platform',
    'b2b.cta.ready': 'Ready to start?',
    'b2b.cta.desc': 'Join today and get 2 months free trial. No credit card required.',
    'b2b.cta.button': 'Create Free Account',
  },

  // Latvian
  lv: {
    'common.welcome': 'Laipni lūdzam',
    'common.loading': 'Ielādē...',
    'common.save': 'Saglabāt',
    'common.cancel': 'Atcelt',
    'nav.dashboard': 'Pārvaldība',
    'nav.campaigns': 'Kampaņas',
    'nav.vouchers': 'Kuponi',
    'nav.giftCards': 'Dāvanu kartes',
    'nav.wallet': 'Maks',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Dalies, Pelni, Izmanto Eiropā',
  },

  // Lithuanian
  lt: {
    'common.welcome': 'Sveiki atvykę',
    'common.loading': 'Kraunama...',
    'common.save': 'Išsaugoti',
    'common.cancel': 'Atšaukti',
    'nav.dashboard': 'Valdymas',
    'nav.campaigns': 'Kampanijos',
    'nav.vouchers': 'Kuponai',
    'nav.giftCards': 'Dovanų kortelės',
    'nav.wallet': 'Piniginė',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Dalinkis, Uždirbk, Iškeisk Europoje',
  },

  // Finnish
  fi: {
    'common.welcome': 'Tervetuloa',
    'common.loading': 'Ladataan...',
    'common.save': 'Tallenna',
    'common.cancel': 'Peruuta',
    'nav.dashboard': 'Hallinta',
    'nav.campaigns': 'Kampanjat',
    'nav.vouchers': 'Kupongit',
    'nav.giftCards': 'Lahjakortit',
    'nav.wallet': 'Lompakko',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Jaa, Ansaitse, Lunasta Euroopassa',
  },

  // Swedish
  sv: {
    'common.welcome': 'Välkommen',
    'common.loading': 'Laddar...',
    'common.save': 'Spara',
    'common.cancel': 'Avbryt',
    'nav.dashboard': 'Instrumentpanel',
    'nav.campaigns': 'Kampanjer',
    'nav.vouchers': 'Kuponger',
    'nav.giftCards': 'Presentkort',
    'nav.wallet': 'Plånbok',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Dela, Tjäna, Lös in i Europa',
  },

  // Norwegian
  no: {
    'common.welcome': 'Velkommen',
    'common.loading': 'Laster...',
    'common.save': 'Lagre',
    'common.cancel': 'Avbryt',
    'nav.dashboard': 'Dashbord',
    'nav.campaigns': 'Kampanjer',
    'nav.vouchers': 'Kuponger',
    'nav.giftCards': 'Gavekort',
    'nav.wallet': 'Lommebok',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Del, Tjen, Løs inn i Europa',
  },

  // Danish
  da: {
    'common.welcome': 'Velkommen',
    'common.loading': 'Indlæser...',
    'common.save': 'Gem',
    'common.cancel': 'Annuller',
    'nav.dashboard': 'Dashboard',
    'nav.campaigns': 'Kampagner',
    'nav.vouchers': 'Kuponer',
    'nav.giftCards': 'Gavekort',
    'nav.wallet': 'Tegnebog',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Del, Tjen, Indløs i Europa',
  },

  // Polish
  pl: {
    'common.welcome': 'Witamy',
    'common.loading': 'Ładowanie...',
    'common.save': 'Zapisz',
    'common.cancel': 'Anuluj',
    'nav.dashboard': 'Panel',
    'nav.campaigns': 'Kampanie',
    'nav.vouchers': 'Kupony',
    'nav.giftCards': 'Karty podarunkowe',
    'nav.wallet': 'Portfel',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Udostępniaj, Zarabiaj, Wykorzystuj w Europie',
  },

  // German
  de: {
    'common.welcome': 'Willkommen',
    'common.loading': 'Lädt...',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'nav.dashboard': 'Dashboard',
    'nav.campaigns': 'Kampagnen',
    'nav.vouchers': 'Gutscheine',
    'nav.giftCards': 'Geschenkkarten',
    'nav.wallet': 'Geldbörse',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Teilen, Verdienen, Einlösen in Europa',
  },

  // Dutch
  nl: {
    'common.welcome': 'Welkom',
    'common.loading': 'Laden...',
    'common.save': 'Opslaan',
    'common.cancel': 'Annuleren',
    'nav.dashboard': 'Dashboard',
    'nav.campaigns': 'Campagnes',
    'nav.vouchers': 'Vouchers',
    'nav.giftCards': 'Cadeaukaarten',
    'nav.wallet': 'Portemonnee',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Deel, Verdien, Verzilver in Europa',
  },

  // French
  fr: {
    'common.welcome': 'Bienvenue',
    'common.loading': 'Chargement...',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'nav.dashboard': 'Tableau de bord',
    'nav.campaigns': 'Campagnes',
    'nav.vouchers': 'Bons',
    'nav.giftCards': 'Cartes cadeaux',
    'nav.wallet': 'Portefeuille',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Partager, Gagner, Échanger en Europe',
  },

  // Czech
  cs: {
    'common.welcome': 'Vítejte',
    'common.loading': 'Načítání...',
    'common.save': 'Uložit',
    'common.cancel': 'Zrušit',
    'nav.dashboard': 'Panel',
    'nav.campaigns': 'Kampaně',
    'nav.vouchers': 'Kupóny',
    'nav.giftCards': 'Dárkové karty',
    'nav.wallet': 'Peněženka',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Sdílejte, Vydělejte, Uplatněte v Evropě',
  },

  // Slovak
  sk: {
    'common.welcome': 'Vitajte',
    'common.loading': 'Načítava sa...',
    'common.save': 'Uložiť',
    'common.cancel': 'Zrušiť',
    'nav.dashboard': 'Panel',
    'nav.campaigns': 'Kampane',
    'nav.vouchers': 'Kupóny',
    'nav.giftCards': 'Darčekové karty',
    'nav.wallet': 'Peňaženka',
    'platform.name': 'GiftHub',
    'platform.tagline': 'Zdieľajte, Zarábajte, Uplatňujte v Európe',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('selectedLanguage');
    return (saved as Language) || 'et';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('selectedLanguage', lang);
  };

  const t = (key: string): string => {
    // Try to get translation from current language
    const translation = translations[language]?.[key];
    
    // Fallback to English if not found
    if (!translation && language !== 'en') {
      return translations['en'][key] || key;
    }
    
    return translation || key;
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
