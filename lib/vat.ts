import { prisma } from '@/lib/prisma';

/**
 * EU VAT default standard rates (fallback when DB has no entry).
 * Source: EU Commission standard rates as of 2025.
 */
export const EU_VAT_DEFAULTS: Record<string, number> = {
  AT: 20.0,  // Austria
  BE: 21.0,  // Belgium
  BG: 20.0,  // Bulgaria
  HR: 25.0,  // Croatia
  CY: 19.0,  // Cyprus
  CZ: 21.0,  // Czech Republic
  DK: 25.0,  // Denmark
  EE: 22.0,  // Estonia
  FI: 25.5,  // Finland
  FR: 20.0,  // France
  DE: 19.0,  // Germany
  GR: 24.0,  // Greece
  HU: 27.0,  // Hungary
  IE: 23.0,  // Ireland
  IT: 22.0,  // Italy
  LV: 21.0,  // Latvia
  LT: 21.0,  // Lithuania
  LU: 17.0,  // Luxembourg
  MT: 18.0,  // Malta
  NL: 21.0,  // Netherlands
  PL: 23.0,  // Poland
  PT: 23.0,  // Portugal
  RO: 19.0,  // Romania
  SK: 23.0,  // Slovakia
  SI: 22.0,  // Slovenia
  ES: 21.0,  // Spain
  SE: 25.0,  // Sweden
};

/**
 * Look up the active VAT rate for a country and rate type from the database.
 * Falls back to EU_VAT_DEFAULTS for standard rates when no DB record exists.
 */
export async function getVatRate(
  countryCode: string,
  rateType: string = 'standard'
): Promise<number> {
  const now = new Date();
  const code = countryCode.toUpperCase();

  const dbRate = await prisma.vatRate.findFirst({
    where: {
      countryCode: code,
      rateType,
      isActive: true,
      effectiveFrom: { lte: now },
      OR: [
        { effectiveUntil: null },
        { effectiveUntil: { gte: now } },
      ],
    },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (dbRate) return dbRate.rate;

  // Fallback to EU defaults for standard rates only
  if (rateType === 'standard' && code in EU_VAT_DEFAULTS) {
    return EU_VAT_DEFAULTS[code];
  }

  return 0;
}

export type VatBreakdown = {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
  isExempt: boolean;
  exemptionType?: string;
};

/**
 * Calculate VAT for a given amount in cents.
 * Checks for merchant exemptions first, then applies the appropriate rate.
 * Amounts are returned in cents (integers).
 */
export async function calculateVat(
  amountCents: number,
  countryCode: string,
  merchantId?: string
): Promise<VatBreakdown> {
  const code = countryCode.toUpperCase();

  // Check merchant VAT exemptions
  if (merchantId) {
    const now = new Date();
    const exemption = await prisma.vatExemption.findFirst({
      where: {
        merchantId,
        countryCode: code,
        approvedAt: { not: null },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
    });

    if (exemption) {
      return {
        netAmount: amountCents,
        vatAmount: 0,
        grossAmount: amountCents,
        vatRate: 0,
        isExempt: true,
        exemptionType: exemption.exemptionType,
      };
    }
  }

  const rate = await getVatRate(code);

  // amountCents is treated as net; VAT is added on top
  const vatAmount = Math.round(amountCents * (rate / 100));
  const grossAmount = amountCents + vatAmount;

  return {
    netAmount: amountCents,
    vatAmount,
    grossAmount,
    vatRate: rate,
    isExempt: false,
  };
}

/**
 * Format a VAT breakdown into a human-readable string.
 */
export function formatVatBreakdown(result: VatBreakdown): string {
  const fmt = (cents: number) => (cents / 100).toFixed(2);

  if (result.isExempt) {
    return `Net: ${fmt(result.netAmount)} | VAT: exempt (${result.exemptionType}) | Total: ${fmt(result.grossAmount)}`;
  }

  return `Net: ${fmt(result.netAmount)} | VAT ${result.vatRate}%: ${fmt(result.vatAmount)} | Total: ${fmt(result.grossAmount)}`;
}
