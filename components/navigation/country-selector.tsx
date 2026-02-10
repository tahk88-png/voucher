"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Globe } from "lucide-react"
import { useCountry, type Country } from "@/components/contexts/country-context"
import { WarmCard } from "@/components/warm-card"

interface CountrySelectorProps {
  variant?: "default" | "compact"
}

export function CountrySelector({ variant = "default" }: CountrySelectorProps) {
  const { selectedCountry, setSelectedCountry, availableCountries } = useCountry()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (country: Country) => {
    if (country.code === selectedCountry.code) {
      setIsOpen(false)
      return
    }

    setSelectedCountry(country)
    setIsOpen(false)
    router.refresh()
  }

  if (variant === "compact") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-gradient-to-br from-[var(--surface)] to-[var(--bg-2)] border border-[var(--border-strong)] hover:border-[var(--primary)] hover:shadow-warm transition-all min-w-[140px] justify-between"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={`Select marketplace (${selectedCountry.code})`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedCountry.flag}</span>
            <span className="font-semibold text-[var(--text)] text-sm">{selectedCountry.code}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-[var(--text-faint)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div
            id={menuId}
            className="absolute top-full mt-2 right-0 w-64 bg-[var(--surface)] rounded-[14px] shadow-warm border border-[var(--border)] py-2 z-50 max-h-[420px] overflow-y-auto"
            role="listbox"
          >
            <div className="px-3 py-2 border-b border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wide">Select Marketplace</p>
            </div>
            {availableCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-2)] transition-colors ${
                  selectedCountry.code === country.code ? "bg-[var(--bg-2)]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{country.flag}</span>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text)] text-sm">{country.name}</div>
                    <div className="text-xs text-[var(--text-faint)]">
                      {country.code} - {country.currency}
                    </div>
                  </div>
                </div>
                {selectedCountry.code === country.code && <Check className="h-4 w-4 text-[var(--primary)]" />}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <WarmCard padding="lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[var(--success)] to-[#7FA090] flex items-center justify-center shadow-warm">
          <Globe className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">Select Marketplace</h3>
          <p className="text-sm text-[var(--text-faint)]">Changes country, currency, and market data only</p>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] bg-[var(--surface)] border-2 border-[var(--border-strong)] hover:border-[var(--primary)] transition-all"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={`Select marketplace (${selectedCountry.name})`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedCountry.flag}</span>
            <div className="text-left">
              <div className="font-semibold text-[var(--text)]">{selectedCountry.name}</div>
              <div className="text-sm text-[var(--text-faint)]">
                {selectedCountry.code} - {selectedCountry.currency}
              </div>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-[var(--text-faint)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div
            id={menuId}
            className="absolute top-full mt-2 left-0 right-0 bg-[var(--surface)] rounded-[12px] shadow-warm border border-[var(--border)] py-2 z-50 max-h-[400px] overflow-y-auto"
            role="listbox"
          >
            {availableCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-2)] transition-colors ${
                  selectedCountry.code === country.code ? "bg-[var(--bg-2)]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text)]">{country.name}</div>
                    <div className="text-sm text-[var(--text-faint)]">
                      {country.code} - {country.currency}
                    </div>
                  </div>
                </div>
                {selectedCountry.code === country.code && <Check className="h-5 w-5 text-[var(--primary)]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-[var(--bg-2)] border border-[var(--border)]">
        <div className="text-xs text-[var(--text-faint)]">
          <strong>Tip:</strong> Marketplace filters data and currency. Interface language is configured separately.
        </div>
      </div>
    </WarmCard>
  )
}
