import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  locale: string;
}

export const countries: Country[] = [
  { code: 'EE', name: 'Estonia', flag: 'EE', currency: 'EUR', locale: 'et-EE' },
  { code: 'LV', name: 'Latvia', flag: 'LV', currency: 'EUR', locale: 'lv-LV' },
  { code: 'LT', name: 'Lithuania', flag: 'LT', currency: 'EUR', locale: 'lt-LT' },
  { code: 'FI', name: 'Finland', flag: 'FI', currency: 'EUR', locale: 'fi-FI' },
  { code: 'SE', name: 'Sweden', flag: 'SE', currency: 'SEK', locale: 'sv-SE' },
  { code: 'NO', name: 'Norway', flag: 'NO', currency: 'NOK', locale: 'nb-NO' },
  { code: 'DK', name: 'Denmark', flag: 'DK', currency: 'DKK', locale: 'da-DK' },
  { code: 'PL', name: 'Poland', flag: 'PL', currency: 'PLN', locale: 'pl-PL' },
  { code: 'DE', name: 'Germany', flag: 'DE', currency: 'EUR', locale: 'de-DE' },
  { code: 'FR', name: 'France', flag: 'FR', currency: 'EUR', locale: 'fr-FR' },
  { code: 'ES', name: 'Spain', flag: 'ES', currency: 'EUR', locale: 'es-ES' },
  { code: 'IT', name: 'Italy', flag: 'IT', currency: 'EUR', locale: 'it-IT' },
  { code: 'NL', name: 'Netherlands', flag: 'NL', currency: 'EUR', locale: 'nl-NL' },
  { code: 'BE', name: 'Belgium', flag: 'BE', currency: 'EUR', locale: 'nl-BE' },
  { code: 'UA', name: 'Ukraine', flag: 'UA', currency: 'UAH', locale: 'uk-UA' },
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
  const [selectedCountry, setSelectedCountryState] = useState<Country>(countries[0]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const saved = window.localStorage.getItem('selectedCountry');
    if (!saved) {
      return;
    }
    const countryCode = parseStoredCountryCode(saved);
    if (!countryCode) {
      return;
    }
    const nextCountry = countries.find((country) => country.code === countryCode);
    if (nextCountry) {
      setSelectedCountryState(nextCountry);
    }
  }, []);

  const setSelectedCountry = (country: Country) => {
    setSelectedCountryState(country);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('selectedCountry', country.code);
    }
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
