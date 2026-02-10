"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useLocale } from "next-intl"
import {
  defaultLocale,
  isSupportedLocale,
  languageCookieName,
  languageOptions,
  languageStorageKey,
  localeCookieName,
  type LanguageOption,
  type SupportedLocale,
} from "@/lib/locale-config"

export type Language = SupportedLocale
export const languages: LanguageOption[] = languageOptions

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  availableLanguages: LanguageOption[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null
  }

  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`))

  return match ? decodeURIComponent(match.split("=")[1]) : null
}

function normalizeStoredLanguage(value: unknown): Language | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return isSupportedLocale(normalized) ? normalized : null
}

function parseStoredLanguage(value: string | null): Language | null {
  if (!value) {
    return null
  }

  try {
    return normalizeStoredLanguage(JSON.parse(value))
  } catch {
    return normalizeStoredLanguage(value)
  }
}

function persistLanguage(language: Language) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(languageStorageKey, language)
  }

  if (typeof document !== "undefined") {
    const cookieAttributes = `path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`
    document.cookie = `${localeCookieName}=${encodeURIComponent(language)}; ${cookieAttributes}`
    document.cookie = `${languageCookieName}=${encodeURIComponent(language)}; ${cookieAttributes}`
  }
}

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null
  }

  const storageLanguage = parseStoredLanguage(window.localStorage.getItem(languageStorageKey))
  if (storageLanguage) {
    return storageLanguage
  }

  const cookieLanguage = parseStoredLanguage(getCookieValue(localeCookieName) ?? getCookieValue(languageCookieName))
  if (cookieLanguage) {
    return cookieLanguage
  }

  return null
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const currentLocale = useLocale()
  const localeFromProvider: Language =
    currentLocale && isSupportedLocale(currentLocale) ? currentLocale : defaultLocale

  const [language, setLanguageState] = useState<Language>(localeFromProvider)

  useEffect(() => {
    const storedLanguage = readStoredLanguage()
    const nextLanguage = storedLanguage ?? localeFromProvider
    setLanguageState(nextLanguage)

    if (storedLanguage !== nextLanguage) {
      persistLanguage(nextLanguage)
    }
  }, [localeFromProvider])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    persistLanguage(lang)
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      availableLanguages: languages,
    }),
    [language]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
