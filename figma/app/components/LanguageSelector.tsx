import { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '@app/contexts/LanguageContext';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { WarmCard } from '@app/components/WarmCard';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
}

export function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLang = availableLanguages.find(l => l.code === language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white hover:bg-[#FFFBF5] border border-[rgba(139,115,85,0.15)] transition-all"
        >
          <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-md border border-[#D9CBB4] bg-[#FAF7F2] px-2 text-xs font-bold text-[#2D2721]">
            {selectedLang?.flag}
          </span>
          <span className="text-sm font-medium text-[#2D2721] hidden sm:inline">
            {selectedLang?.code.toUpperCase()}
          </span>
          <ChevronDown className={`h-4 w-4 text-[#8B7355] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px]">
            <WarmCard padding="sm" className="shadow-warm-lg">
              <div className="space-y-1">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[10px] transition-all ${
                      language === lang.code
                        ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721]'
                        : 'hover:bg-[#FFFBF5] text-[#6B5744]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-md border border-[#D9CBB4] bg-[#FAF7F2] px-2 text-xs font-bold text-[#2D2721]">
                        {lang.flag}
                      </span>
                      <div className="text-left">
                        <div className="text-sm font-medium">{lang.nativeName}</div>
                        <div className="text-xs opacity-70">{lang.name}</div>
                      </div>
                    </div>
                    {language === lang.code && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </WarmCard>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-white hover:bg-[#FFFBF5] border border-[rgba(139,115,85,0.15)] transition-all w-full sm:w-auto"
      >
        <Globe className="h-5 w-5 text-[#FFC857]" />
        <div className="flex items-center gap-2 flex-1">
          <span className="inline-flex h-8 min-w-[2.25rem] items-center justify-center rounded-md border border-[#D9CBB4] bg-[#FAF7F2] px-2 text-xs font-bold text-[#2D2721]">
            {selectedLang?.flag}
          </span>
          <div className="text-left">
            <div className="text-sm font-semibold text-[#2D2721]">{selectedLang?.nativeName}</div>
            <div className="text-xs text-[#8B7355]">{selectedLang?.name}</div>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-[#8B7355] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 sm:left-0 sm:right-auto top-full mt-2 z-50 min-w-[280px]">
          <WarmCard padding="md" className="shadow-warm-lg">
            <div className="mb-3">
              <div className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide">
                Select Language
              </div>
            </div>
            <div className="space-y-2">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[12px] transition-all ${
                    language === lang.code
                      ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm'
                      : 'hover:bg-[#FFFBF5] text-[#6B5744]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 min-w-[2.25rem] items-center justify-center rounded-md border border-[#D9CBB4] bg-[#FAF7F2] px-2 text-xs font-bold text-[#2D2721]">
                      {lang.flag}
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-semibold">{lang.nativeName}</div>
                      <div className="text-xs opacity-70">{lang.name}</div>
                    </div>
                  </div>
                  {language === lang.code && (
                    <Check className="h-5 w-5" />
                  )}
                </button>
              ))}
            </div>
          </WarmCard>
        </div>
      )}
    </div>
  );
}
