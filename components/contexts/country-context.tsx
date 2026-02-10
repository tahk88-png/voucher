"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  countryOptions,
  countryStorageKey,
  defaultCountryCode,
  getCountryByCode,
  type CountryOption,
} from "@/lib/locale-config"

export type Country = CountryOption
export const countries: Country[] = countryOptions

interface CountryContextType {
  selectedCountry: Country
  setSelectedCountry: (country: Country) => void
  availableCountries: Country[]
}

const CountryContext = createContext<CountryContextType | undefined>(undefined)

function normalizeStoredCountryCode(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim().toUpperCase()
  }

  if (value && typeof value === "object" && "code" in value) {
    const nestedCode = (value as { code?: unknown }).code
    if (typeof nestedCode === "string" && nestedCode.trim().length > 0) {
      return nestedCode.trim().toUpperCase()
    }
  }

  return null
}

function parseStoredCountryCode(storedValue: string | null): string | null {
  if (!storedValue) {
    return null
  }

  try {
    return normalizeStoredCountryCode(JSON.parse(storedValue))
  } catch {
    return normalizeStoredCountryCode(storedValue)
  }
}

function readStoredCountry(): Country | null {
  if (typeof window === "undefined") {
    return null
  }

  const parsedCountryCode = parseStoredCountryCode(window.localStorage.getItem(countryStorageKey))
  if (!parsedCountryCode) {
    return null
  }

  return getCountryByCode(parsedCountryCode) ?? null
}

function getDefaultCountry(): Country {
  return getCountryByCode(defaultCountryCode) ?? countries[0]
}

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [selectedCountry, setSelectedCountryState] = useState<Country>(getDefaultCountry)

  useEffect(() => {
    const storedCountry = readStoredCountry()
    if (storedCountry) {
      setSelectedCountryState(storedCountry)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(countryStorageKey, selectedCountry.code)
  }, [selectedCountry.code])

  const setSelectedCountry = useCallback(
    (country: Country) => {
      setSelectedCountryState(country)
    },
    []
  )

  const value = useMemo(
    () => ({
      selectedCountry,
      setSelectedCountry,
      availableCountries: countries,
    }),
    [selectedCountry, setSelectedCountry]
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
