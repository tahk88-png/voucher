'use client';

import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/currency-constants';
import { cn } from '@/lib/utils';

/** Select limited to the ISO currencies we support. */
export function CurrencySelect({
  id,
  name,
  value,
  defaultValue,
  onChange,
  className,
  disabled,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (currency: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const current = (value ?? defaultValue ?? 'EUR').toUpperCase();
  const options = (SUPPORTED_CURRENCIES as readonly string[]).includes(current)
    ? SUPPORTED_CURRENCIES
    : [current, ...SUPPORTED_CURRENCIES];
  return (
    <select
      id={id}
      name={name}
      {...(value !== undefined ? { value: current } : { defaultValue: current })}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]',
        className,
      )}
    >
      {options.map((code) => (
        <option key={code} value={code}>
          {code} {CURRENCY_SYMBOLS[code] ? `(${CURRENCY_SYMBOLS[code]})` : ''}
        </option>
      ))}
    </select>
  );
}

/** Example amount in the given currency for input hints, e.g. "€5.00". */
export function exampleAmount(currency: string, major = 5): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency.toUpperCase() }).format(major);
  } catch {
    return `${major} ${currency.toUpperCase()}`;
  }
}
