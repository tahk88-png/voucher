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

// Set once the visitor picks a marketplace themselves. The app used to default
// to "US", so a stored "US" without this marker is that old default, not a choice.
export const countryExplicitChoiceKey = "selectedCountryExplicit"
const legacyDefaultCountryCode = "US"

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage unavailable (private mode, blocked site data): the choice lasts for this visit only.
  }
}

/**
 * Resolves the stored marketplace. Returns null (use the default) when nothing
 * valid is stored, or when the stored value is the legacy "US" default that
 * the visitor never chose explicitly.
 */
export function resolveStoredCountryCode(storedValue: string | null, explicitMarker: string | null): string | null {
  const parsedCountryCode = parseStoredCountryCode(storedValue)
  if (!parsedCountryCode) {
    return null
  }
  if (parsedCountryCode === legacyDefaultCountryCode && !explicitMarker) {
    return null
  }
  return getCountryByCode(parsedCountryCode) ? parsedCountryCode : null
}

function readStoredCountry(): Country | null {
  if (typeof window === "undefined") {
    return null
  }

  const code = resolveStoredCountryCode(safeGetItem(countryStorageKey), safeGetItem(countryExplicitChoiceKey))
  return code ? getCountryByCode(code) ?? null : null
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

    safeSetItem(countryStorageKey, selectedCountry.code)
  }, [selectedCountry.code])

  // Only called from user actions (the marketplace selector), so it marks the choice as explicit.
  const setSelectedCountry = useCallback(
    (country: Country) => {
      if (typeof window !== "undefined") {
        safeSetItem(countryExplicitChoiceKey, "1")
      }
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
