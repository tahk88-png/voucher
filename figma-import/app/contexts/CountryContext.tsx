import { createContext, useContext, useState, ReactNode } from 'react';

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  locale: string;
}

export const countries: Country[] = [
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', currency: '€', locale: 'et-EE' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', currency: '€', locale: 'lv-LV' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', currency: '€', locale: 'lt-LT' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', currency: '€', locale: 'fi-FI' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'kr', locale: 'sv-SE' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'kr', locale: 'nb-NO' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'kr', locale: 'da-DK' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', currency: 'zł', locale: 'pl-PL' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: '€', locale: 'de-DE' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: '€', locale: 'fr-FR' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: '€', locale: 'es-ES' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: '€', locale: 'it-IT' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: '€', locale: 'nl-NL' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', currency: '€', locale: 'nl-BE' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', currency: '₴', locale: 'uk-UA' },
];

interface CountryContextType {
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  availableCountries: Country[];
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

function normalizeCountryCode(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim().toUpperCase();
  }

  if (value && typeof value === 'object' && 'code' in value) {
    const code = (value as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim().length > 0) {
      return code.trim().toUpperCase();
    }
  }

  return null;
}

function parseStoredCountryCode(saved: string | null): string | null {
  if (!saved) {
    return null;
  }

  try {
    return normalizeCountryCode(JSON.parse(saved));
  } catch {
    return normalizeCountryCode(saved);
  }
}

export function CountryProvider({ children }: { children: ReactNode }) {
  // Load from localStorage or default to Estonia
  const [selectedCountry, setSelectedCountryState] = useState<Country>(() => {
    const saved = localStorage.getItem('selectedCountry');
    const countryCode = parseStoredCountryCode(saved);
    if (countryCode) {
      return countries.find(c => c.code === countryCode) || countries[0];
    }
    return countries[0]; // Default to Estonia
  });

  const setSelectedCountry = (country: Country) => {
    setSelectedCountryState(country);
    localStorage.setItem('selectedCountry', country.code);
  };

  return (
    <CountryContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        availableCountries: countries,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
