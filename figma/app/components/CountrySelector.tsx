import { useState, useRef, useEffect } from 'react';
import { useCountry, type Country } from '@app/contexts/CountryContext';
import { ChevronDown, Check, Globe, Lightbulb } from 'lucide-react';
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

  const marketBadge = (value: string) => (
    <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-md border border-[#D9CBB4] bg-[#FAF7F2] px-2 text-xs font-bold text-[#2D2721]">
      {value}
    </span>
  );

  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex min-w-[152px] items-center justify-between gap-2 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-gradient-to-br from-white to-[#FFF9ED] px-4 py-2.5 transition-all hover:border-[#FFC857] hover:shadow-warm"
        >
          <div className="flex items-center gap-2">
            {marketBadge(selectedCountry.flag)}
            <span className="text-sm font-semibold text-[#2D2721]">{selectedCountry.code}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-[#8B7355] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 max-h-[420px] w-72 overflow-y-auto rounded-[14px] border border-[rgba(139,115,85,0.12)] bg-white py-2 shadow-warm">
            <div className="border-b border-[rgba(139,115,85,0.1)] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Select market</p>
            </div>
            {availableCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country)}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#FFF9ED] ${
                  selectedCountry.code === country.code ? 'bg-[#FFF9ED]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {marketBadge(country.flag)}
                    <div>
                      <div className="text-sm font-semibold text-[#2D2721]">{country.name}</div>
                      <div className="text-xs text-[#8B7355]">{country.code} | {country.currency}</div>
                    </div>
                  </div>
                  {selectedCountry.code === country.code && <Check className="h-4 w-4 text-[#FFC857]" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <WarmCard padding="lg">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] shadow-warm">
          <Globe className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#2D2721]">Select Market</h3>
          <p className="text-sm text-[#8B7355]">Choose your country to view local data.</p>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] bg-white px-4 py-3 transition-all hover:border-[#FFC857]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {marketBadge(selectedCountry.flag)}
              <div className="text-left">
                <div className="font-semibold text-[#2D2721]">{selectedCountry.name}</div>
                <div className="text-sm text-[#8B7355]">{selectedCountry.code} | {selectedCountry.currency}</div>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-[#8B7355] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[400px] overflow-y-auto rounded-[12px] border border-[rgba(139,115,85,0.12)] bg-white py-2 shadow-warm">
            {availableCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country)}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#FFF9ED] ${
                  selectedCountry.code === country.code ? 'bg-[#FFF9ED]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {marketBadge(country.flag)}
                    <div>
                      <div className="font-semibold text-[#2D2721]">{country.name}</div>
                      <div className="text-sm text-[#8B7355]">{country.code} | {country.currency}</div>
                    </div>
                  </div>
                  {selectedCountry.code === country.code && <Check className="h-5 w-5 text-[#FFC857]" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-[rgba(139,115,85,0.1)] bg-[#FFF9ED] p-3">
        <div className="flex items-start gap-2 text-xs text-[#8B7355]">
          <Lightbulb className="mt-0.5 h-4 w-4 text-[#FFC857]" />
          <span>
            <strong>Tip:</strong> All data, campaigns, and analytics are filtered by your selected market.
          </span>
        </div>
      </div>
    </WarmCard>
  );
}
