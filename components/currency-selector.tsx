'use client';

import { useEffect, useState } from 'react';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

const CURRENCY_LABELS: Record<string, string> = {
  EUR: '\u20AC EUR', USD: '$ USD', GBP: '\u00A3 GBP', SEK: 'kr SEK', NOK: 'kr NOK',
  DKK: 'kr DKK', PLN: 'z\u0142 PLN', CZK: 'K\u010D CZK', HUF: 'Ft HUF',
  RON: 'lei RON', TRY: '\u20BA TRY', JPY: '\u00A5 JPY',
};

const STORAGE_KEY = 'gifthub-currency';

export function useCurrency() {
  const [currency, setCurrencyState] = useState('EUR');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_CURRENCIES.includes(stored as any)) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  return { currency, setCurrency };
}

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="border border-[#e8e0d8] rounded-lg px-3 py-2 text-sm bg-white text-[#2D2721] focus:outline-none focus:ring-2 focus:ring-[#FFC857] cursor-pointer"
      aria-label="Select currency"
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {CURRENCY_LABELS[c] || c}
        </option>
      ))}
    </select>
  );
}
