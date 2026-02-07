import { useState, useRef, useEffect } from 'react';
import { useCountry, Country } from '@app/contexts/CountryContext';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { WarmCard } from '@app/components/WarmCard';

interface CountrySelectorProps {
  variant?: 'default' | 'compact';
}

export function CountrySelector({ variant = 'default' }: CountrySelectorProps) {
  const { selectedCountry, setSelectedCountry, availableCountries } = useCountry();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-gradient-to-br from-white to-[#FFF9ED] border border-[rgba(139,115,85,0.2)] hover:border-[#FFC857] hover:shadow-warm transition-all min-w-[140px] justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedCountry.flag}</span>
            <span className="font-semibold text-[#2D2721] text-sm">{selectedCountry.code}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-[#8B7355] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-[14px] shadow-warm border border-[rgba(139,115,85,0.1)] py-2 z-50 max-h-[420px] overflow-y-auto">
            <div className="px-3 py-2 border-b border-[rgba(139,115,85,0.1)]">
              <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide">Select Market</p>
            </div>
            {availableCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#FFF9ED] transition-colors ${
                  selectedCountry.code === country.code ? 'bg-[#FFF9ED]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{country.flag}</span>
                  <div className="text-left">
                    <div className="font-semibold text-[#2D2721] text-sm">{country.name}</div>
                    <div className="text-xs text-[#8B7355]">{country.code} • {country.currency}</div>
                  </div>
                </div>
                {selectedCountry.code === country.code && (
                  <Check className="h-4 w-4 text-[#FFC857]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <WarmCard padding="lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
          <Globe className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#2D2721]">Select Market</h3>
          <p className="text-sm text-[#8B7355]">Choose your country to view local data</p>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] bg-white border-2 border-[rgba(139,115,85,0.2)] hover:border-[#FFC857] transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedCountry.flag}</span>
            <div className="text-left">
              <div className="font-semibold text-[#2D2721]">{selectedCountry.name}</div>
              <div className="text-sm text-[#8B7355]">{selectedCountry.code} • {selectedCountry.currency}</div>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-[#8B7355] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-[12px] shadow-warm border border-[rgba(139,115,85,0.1)] py-2 z-50 max-h-[400px] overflow-y-auto">
            {availableCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#FFF9ED] transition-colors ${
                  selectedCountry.code === country.code ? 'bg-[#FFF9ED]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div className="text-left">
                    <div className="font-semibold text-[#2D2721]">{country.name}</div>
                    <div className="text-sm text-[#8B7355]">{country.code} • {country.currency}</div>
                  </div>
                </div>
                {selectedCountry.code === country.code && (
                  <Check className="h-5 w-5 text-[#FFC857]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-[#FFF9ED] border border-[rgba(139,115,85,0.1)]">
        <div className="text-xs text-[#8B7355]">
          💡 <strong>Tip:</strong> All data, campaigns, and analytics are filtered by your selected market.
        </div>
      </div>
    </WarmCard>
  );
}