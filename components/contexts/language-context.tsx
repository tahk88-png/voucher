"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type Language =
  | "et"
  | "ru"
  | "en"
  | "lv"
  | "lt"
  | "fi"
  | "sv"
  | "no"
  | "da"
  | "pl"
  | "de"
  | "nl"
  | "fr"
  | "cs"
  | "sk"

export interface LanguageOption {
  code: Language
  name: string
  nativeName: string
  flag: string
}

export const languages: LanguageOption[] = [
  { code: "et", name: "Estonian", nativeName: "Eesti", flag: "🇪🇪" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu", flag: "🇱🇻" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių", flag: "🇱🇹" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina", flag: "🇸🇰" },
]

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  availableLanguages: LanguageOption[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("et")

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem("selectedLanguage") as Language | null
    if (saved) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("selectedLanguage", lang)
    }
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
