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
}

export const languageOptions: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "US" },
  { code: "et", name: "Estonian", nativeName: "Eesti", flag: "EE" },
  { code: "es", name: "Spanish", nativeName: "Espanol", flag: "ES" },
  { code: "fr", name: "French", nativeName: "Francais", flag: "FR" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "DE" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "FI" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "SE" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "NO" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "DK" },
  { code: "lv", name: "Latvian", nativeName: "Latviesu", flag: "LV" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuviu", flag: "LT" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "PL" },
  { code: "uk", name: "Ukrainian", nativeName: "Ukrainska", flag: "UA" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "IT" },
  { code: "ru", name: "Russian", nativeName: "Russkii", flag: "RU" },
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
}
