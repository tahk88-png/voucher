export const localeCookieName = "NEXT_LOCALE"
export const languageCookieName = "selectedLanguage"
export const languageStorageKey = "selectedLanguage"
export const countryStorageKey = "selectedCountry"

export const supportedLocales = [
  "en",
  "et",
  "es",
  "fr",
  "de",
  "fi",
  "sv",
  "no",
  "da",
  "lv",
  "lt",
  "pl",
  "uk",
  "it",
  "ru",
  "pt",
  "nl",
  "cs",
  "ro",
  "hu",
  "tr",
  "ja",
  "ko",
  "zh",
  "ar",
] as const

export type SupportedLocale = (typeof supportedLocales)[number]

export const defaultLocale: SupportedLocale = "en"

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return (supportedLocales as readonly string[]).includes(locale)
}

export interface LanguageOption {
  code: SupportedLocale
  name: string
  nativeName: string
  flag: string
  emoji: string
}

export const languageOptions: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "US", emoji: "\u{1F1FA}\u{1F1F8}" },
  { code: "et", name: "Estonian", nativeName: "Eesti", flag: "EE", emoji: "\u{1F1EA}\u{1F1EA}" },
  { code: "es", name: "Spanish", nativeName: "Espa\u00f1ol", flag: "ES", emoji: "\u{1F1EA}\u{1F1F8}" },
  { code: "fr", name: "French", nativeName: "Fran\u00e7ais", flag: "FR", emoji: "\u{1F1EB}\u{1F1F7}" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "DE", emoji: "\u{1F1E9}\u{1F1EA}" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "FI", emoji: "\u{1F1EB}\u{1F1EE}" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "SE", emoji: "\u{1F1F8}\u{1F1EA}" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "NO", emoji: "\u{1F1F3}\u{1F1F4}" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "DK", emoji: "\u{1F1E9}\u{1F1F0}" },
  { code: "lv", name: "Latvian", nativeName: "Latvie\u0161u", flag: "LV", emoji: "\u{1F1F1}\u{1F1FB}" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvi\u0173", flag: "LT", emoji: "\u{1F1F1}\u{1F1F9}" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "PL", emoji: "\u{1F1F5}\u{1F1F1}" },
  { code: "uk", name: "Ukrainian", nativeName: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430", flag: "UA", emoji: "\u{1F1FA}\u{1F1E6}" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "IT", emoji: "\u{1F1EE}\u{1F1F9}" },
  { code: "ru", name: "Russian", nativeName: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", flag: "RU", emoji: "\u{1F1F7}\u{1F1FA}" },
  { code: "pt", name: "Portuguese", nativeName: "Portugu\u00eas", flag: "PT", emoji: "\u{1F1F5}\u{1F1F9}" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "NL", emoji: "\u{1F1F3}\u{1F1F1}" },
  { code: "cs", name: "Czech", nativeName: "\u010ce\u0161tina", flag: "CZ", emoji: "\u{1F1E8}\u{1F1FF}" },
  { code: "ro", name: "Romanian", nativeName: "Rom\u00e2n\u0103", flag: "RO", emoji: "\u{1F1F7}\u{1F1F4}" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "HU", emoji: "\u{1F1ED}\u{1F1FA}" },
  { code: "tr", name: "Turkish", nativeName: "T\u00fcrk\u00e7e", flag: "TR", emoji: "\u{1F1F9}\u{1F1F7}" },
  { code: "ja", name: "Japanese", nativeName: "\u65e5\u672c\u8a9e", flag: "JP", emoji: "\u{1F1EF}\u{1F1F5}" },
  { code: "ko", name: "Korean", nativeName: "\ud55c\uad6d\uc5b4", flag: "KR", emoji: "\u{1F1F0}\u{1F1F7}" },
  { code: "zh", name: "Chinese", nativeName: "\u4e2d\u6587", flag: "CN", emoji: "\u{1F1E8}\u{1F1F3}" },
  { code: "ar", name: "Arabic", nativeName: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", flag: "SA", emoji: "\u{1F1F8}\u{1F1E6}" },
]

export interface CountryOption {
  code: string
  name: string
  flag: string
  currency: string
  localeTag: string
  language: SupportedLocale
}

export const countryOptions: CountryOption[] = [
  { code: "US", name: "United States", flag: "US", currency: "$", localeTag: "en-US", language: "en" },
  { code: "EE", name: "Estonia", flag: "EE", currency: "EUR", localeTag: "et-EE", language: "et" },
  { code: "ES", name: "Spain", flag: "ES", currency: "EUR", localeTag: "es-ES", language: "es" },
  { code: "FR", name: "France", flag: "FR", currency: "EUR", localeTag: "fr-FR", language: "fr" },
  { code: "DE", name: "Germany", flag: "DE", currency: "EUR", localeTag: "de-DE", language: "de" },
  { code: "FI", name: "Finland", flag: "FI", currency: "EUR", localeTag: "fi-FI", language: "fi" },
  { code: "SE", name: "Sweden", flag: "SE", currency: "SEK", localeTag: "sv-SE", language: "sv" },
  { code: "NO", name: "Norway", flag: "NO", currency: "NOK", localeTag: "nb-NO", language: "no" },
  { code: "DK", name: "Denmark", flag: "DK", currency: "DKK", localeTag: "da-DK", language: "da" },
  { code: "LV", name: "Latvia", flag: "LV", currency: "EUR", localeTag: "lv-LV", language: "lv" },
  { code: "LT", name: "Lithuania", flag: "LT", currency: "EUR", localeTag: "lt-LT", language: "lt" },
  { code: "PL", name: "Poland", flag: "PL", currency: "PLN", localeTag: "pl-PL", language: "pl" },
  { code: "UA", name: "Ukraine", flag: "UA", currency: "UAH", localeTag: "uk-UA", language: "uk" },
  { code: "IT", name: "Italy", flag: "IT", currency: "EUR", localeTag: "it-IT", language: "it" },
  { code: "RU", name: "Russia", flag: "RU", currency: "RUB", localeTag: "ru-RU", language: "ru" },
  { code: "PT", name: "Portugal", flag: "PT", currency: "EUR", localeTag: "pt-PT", language: "pt" },
  { code: "NL", name: "Netherlands", flag: "NL", currency: "EUR", localeTag: "nl-NL", language: "nl" },
  { code: "CZ", name: "Czech Republic", flag: "CZ", currency: "CZK", localeTag: "cs-CZ", language: "cs" },
  { code: "RO", name: "Romania", flag: "RO", currency: "RON", localeTag: "ro-RO", language: "ro" },
  { code: "HU", name: "Hungary", flag: "HU", currency: "HUF", localeTag: "hu-HU", language: "hu" },
  { code: "TR", name: "Turkey", flag: "TR", currency: "TRY", localeTag: "tr-TR", language: "tr" },
  { code: "JP", name: "Japan", flag: "JP", currency: "JPY", localeTag: "ja-JP", language: "ja" },
  { code: "KR", name: "South Korea", flag: "KR", currency: "KRW", localeTag: "ko-KR", language: "ko" },
  { code: "CN", name: "China", flag: "CN", currency: "CNY", localeTag: "zh-CN", language: "zh" },
  { code: "SA", name: "Saudi Arabia", flag: "SA", currency: "SAR", localeTag: "ar-SA", language: "ar" },
]

export const defaultCountryCode = "US"

export const localeToCountryCode: Record<SupportedLocale, string> = {
  en: "US",
  et: "EE",
  es: "ES",
  fr: "FR",
  de: "DE",
  fi: "FI",
  sv: "SE",
  no: "NO",
  da: "DK",
  lv: "LV",
  lt: "LT",
  pl: "PL",
  uk: "UA",
  it: "IT",
  ru: "RU",
  pt: "PT",
  nl: "NL",
  cs: "CZ",
  ro: "RO",
  hu: "HU",
  tr: "TR",
  ja: "JP",
  ko: "KR",
  zh: "CN",
  ar: "SA",
}

export function getCountryByCode(countryCode: string | null | undefined): CountryOption | undefined {
  if (!countryCode) return undefined
  return countryOptions.find((country) => country.code === countryCode)
}

export function getCountryByLocale(locale: SupportedLocale): CountryOption {
  const code = localeToCountryCode[locale]
  return getCountryByCode(code) ?? countryOptions[0]
}

export const localeToIntlLocale: Record<SupportedLocale, string> = {
  en: "en-US",
  et: "et-EE",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  fi: "fi-FI",
  sv: "sv-SE",
  no: "nb-NO",
  da: "da-DK",
  lv: "lv-LV",
  lt: "lt-LT",
  pl: "pl-PL",
  uk: "uk-UA",
  it: "it-IT",
  ru: "ru-RU",
  pt: "pt-PT",
  nl: "nl-NL",
  cs: "cs-CZ",
  ro: "ro-RO",
  hu: "hu-HU",
  tr: "tr-TR",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  ar: "ar-SA",
}
