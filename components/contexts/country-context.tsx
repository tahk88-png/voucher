"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export interface Country {
  code: string
  name: string
  flag: string
  currency: string
  locale: string
}

export const countries: Country[] = [
  { code: "EE", name: "Estonia", flag: "🇪🇪", currency: "€", locale: "et-EE" },
  { code: "LV", name: "Latvia", flag: "🇱🇻", currency: "€", locale: "lv-LV" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", currency: "€", locale: "lt-LT" },
  { code: "FI", name: "Finland", flag: "🇫🇮", currency: "€", locale: "fi-FI" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", currency: "kr", locale: "sv-SE" },
  { code: "NO", name: "Norway", flag: "🇳🇴", currency: "kr", locale: "nb-NO" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", currency: "kr", locale: "da-DK" },
  { code: "PL", name: "Poland", flag: "🇵🇱", currency: "zł", locale: "pl-PL" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "€", locale: "de-DE" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "€", locale: "fr-FR" },
  { code: "ES", name: "Spain", flag: "🇪🇸", currency: "€", locale: "es-ES" },
  { code: "IT", name: "Italy", flag: "🇮🇹", currency: "€", locale: "it-IT" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", currency: "€", locale: "nl-NL" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", currency: "€", locale: "nl-BE" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", currency: "₴", locale: "uk-UA" },
]

interface CountryContextType {
  selectedCountry: Country
  setSelectedCountry: (country: Country) => void
  availableCountries: Country[]
}

const CountryContext = createContext<CountryContextType | undefined>(undefined)

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [selectedCountry, setSelectedCountryState] = useState<Country>(countries[0])

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem("selectedCountry")
    if (!saved) return
    const match = countries.find((country) => country.code === saved)
    if (match) {
      setSelectedCountryState(match)
    }
  }, [])

  const setSelectedCountry = (country: Country) => {
    setSelectedCountryState(country)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("selectedCountry", country.code)
    }
  }

  const value = useMemo(
    () => ({
      selectedCountry,
      setSelectedCountry,
      availableCountries: countries,
    }),
    [selectedCountry]
  )

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
}

export function useCountry() {
  const context = useContext(CountryContext)
  if (!context) {
    throw new Error("useCountry must be used within a CountryProvider")
  }
  return context
}
