import { formatCurrency } from "@/lib/utils"

/**
 * formatCurrency without a ".00" tail for whole amounts: "€19", "€15.83".
 * Amount is in minor units, like formatCurrency.
 */
export function formatWholeCurrency(amountMinor: number, currency: string): string {
  const formatted = formatCurrency(amountMinor, currency)
  return amountMinor % 100 === 0 ? formatted.replace(/\.00(?=\D*$)/, "") : formatted
}
