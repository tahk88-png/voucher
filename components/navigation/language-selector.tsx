"use client"

import { useEffect, useId, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Check, ChevronDown, Globe } from "lucide-react"
import { useLanguage } from "@/components/contexts/language-context"
import { WarmCard } from "@/components/warm-card"
import { defaultLocale, supportedLocales } from "@/lib/locale-config"

interface LanguageSelectorProps {
  variant?: "default" | "compact"
}

export function LanguageSelector({ variant = "default" }: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const tLanguage = useTranslations("language")
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const selectedLang = availableLanguages.find((lang) => lang.code === language)

  const handleLanguageSelect = (nextLanguage: typeof language) => {
    if (nextLanguage === language) {
      setIsOpen(false)
      return
    }

    setLanguage(nextLanguage)
    setIsOpen(false)

    const localePrefixPattern = new RegExp(`^/(${supportedLocales.join("|")})(/|$)`)
    const currentPath = pathname || "/"

    if (localePrefixPattern.test(currentPath)) {
      const pathWithoutLocale = currentPath.replace(localePrefixPattern, "/")
      const nextPath = nextLanguage === defaultLocale ? pathWithoutLocale : `/${nextLanguage}${pathWithoutLocale}`
      router.push(nextPath)
      return
    }

    router.refresh()
  }

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
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-sm)] bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--border)] transition-all duration-200 ease-smooth shadow-sm hover:shadow-md"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={`Select interface language (${selectedLang?.code?.toUpperCase() || "unknown"})`}
        >
          <span className="text-lg">{selectedLang?.emoji}</span>
          <span className="text-sm font-medium text-[var(--text)] hidden sm:inline">
            {selectedLang?.code.toUpperCase()}
          </span>
          <ChevronDown className={`h-4 w-4 text-[var(--text-faint)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div id={menuId} className="absolute right-0 top-full mt-2 z-50 min-w-[200px]" role="listbox">
            <WarmCard padding="sm" className="shadow-warm-lg">
              <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[10px] transition-all duration-150 ease-smooth ${
                      language === lang.code
                        ? "gradient-brand text-[var(--text)]"
                        : "hover:bg-[var(--bg)] text-[var(--text-muted)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{lang.emoji}</span>
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
        className="flex items-center gap-3 px-4 py-3 rounded-[var(--r-md)] bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--border)] transition-all duration-200 ease-smooth shadow-sm hover:shadow-md w-full sm:w-auto"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Select interface language (${selectedLang?.nativeName || "unknown"})`}
      >
        <Globe className="h-5 w-5 text-[var(--primary)]" />
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{selectedLang?.emoji}</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-[var(--text)]">{selectedLang?.nativeName}</div>
            <div className="text-xs text-[var(--text-faint)]">{selectedLang?.name} (UI)</div>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-[var(--text-faint)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          id={menuId}
          className="absolute left-0 right-0 sm:left-0 sm:right-auto top-full mt-2 z-50 min-w-[280px]"
          role="listbox"
        >
          <WarmCard padding="md" className="shadow-warm-lg">
            <div className="mb-3">
              <div className="text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wide">{tLanguage("select")}</div>
              <div className="text-xs text-[var(--text-faint)] mt-1">Changes interface text only</div>
            </div>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-[12px] transition-all duration-150 ease-smooth ${
                    language === lang.code
                      ? "gradient-brand text-[var(--text)] shadow-warm"
                      : "hover:bg-[var(--bg)] text-[var(--text-muted)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.emoji}</span>
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
