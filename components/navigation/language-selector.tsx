"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown, Globe } from "lucide-react"
import { useLanguage } from "@/components/contexts/language-context"
import { WarmCard } from "@/components/warm-card"

interface LanguageSelectorProps {
  variant?: "default" | "compact"
}

export function LanguageSelector({ variant = "default" }: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const selectedLang = availableLanguages.find((lang) => lang.code === language)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (variant === "compact") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white hover:bg-[#FFFBF5] border border-[rgba(139,115,85,0.15)] transition-all"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={`Select language (${selectedLang?.code?.toUpperCase() || "unknown"})`}
        >
          <span className="text-xl">{selectedLang?.flag}</span>
          <span className="text-sm font-medium text-[#2D2721] hidden sm:inline">
            {selectedLang?.code.toUpperCase()}
          </span>
          <ChevronDown className={`h-4 w-4 text-[#8B7355] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div id={menuId} className="absolute right-0 top-full mt-2 z-50 min-w-[200px]" role="listbox">
            <WarmCard padding="sm" className="shadow-warm-lg">
              <div className="space-y-1">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[10px] transition-all ${
                      language === lang.code
                        ? "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721]"
                        : "hover:bg-[#FFFBF5] text-[#6B5744]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <div className="text-left">
                        <div className="text-sm font-medium">{lang.nativeName}</div>
                        <div className="text-xs opacity-70">{lang.name}</div>
                      </div>
                    </div>
                    {language === lang.code && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </WarmCard>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-white hover:bg-[#FFFBF5] border border-[rgba(139,115,85,0.15)] transition-all w-full sm:w-auto"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Select language (${selectedLang?.nativeName || "unknown"})`}
      >
        <Globe className="h-5 w-5 text-[#FFC857]" />
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{selectedLang?.flag}</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-[#2D2721]">{selectedLang?.nativeName}</div>
            <div className="text-xs text-[#8B7355]">{selectedLang?.name}</div>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-[#8B7355] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          id={menuId}
          className="absolute left-0 right-0 sm:left-0 sm:right-auto top-full mt-2 z-50 min-w-[280px]"
          role="listbox"
        >
          <WarmCard padding="md" className="shadow-warm-lg">
            <div className="mb-3">
              <div className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide">Select Language</div>
            </div>
            <div className="space-y-2">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[12px] transition-all ${
                    language === lang.code
                      ? "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm"
                      : "hover:bg-[#FFFBF5] text-[#6B5744]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left">
                      <div className="text-sm font-semibold">{lang.nativeName}</div>
                      <div className="text-xs opacity-70">{lang.name}</div>
                    </div>
                  </div>
                  {language === lang.code && <Check className="h-5 w-5" />}
                </button>
              ))}
            </div>
          </WarmCard>
        </div>
      )}
    </div>
  )
}
