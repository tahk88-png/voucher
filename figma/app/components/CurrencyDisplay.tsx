import { Currency } from '@/figma/app/types';
import { currencySymbols } from '@/figma/app/data/mock-data';

interface CurrencyDisplayProps {
  amount: number;
  currency: Currency;
  showCode?: boolean;
}

export function CurrencyDisplay({ amount, currency, showCode = false }: CurrencyDisplayProps) {
  const symbol = currencySymbols[currency];
  const formatted = new Intl.NumberFormat('en-EU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <span>
      {symbol}{formatted}
      {showCode && <span className="text-muted-foreground ml-1">{currency}</span>}
    </span>
  );
}
