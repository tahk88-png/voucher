/**
 * White-Label / Custom Domain — resolves merchant branding from hostname
 */

import { prisma } from '@/lib/prisma';

export interface WhiteLabelConfig {
  merchantId: string;
  merchantSlug: string;
  merchantName: string;
  logo: string | null;
  primaryColor: string;
  hidePlatformBranding: boolean;
  customDomain: string | null;
  verified: boolean;
}

const DEFAULT_PRIMARY_COLOR = '#8B7355';

/**
 * Look up DomainMapping for the given hostname and return the merchant's
 * custom branding configuration. Returns null if no mapping is found.
 */
export async function getWhiteLabelConfig(hostname: string): Promise<WhiteLabelConfig | null> {
  // Strip port if present
  const domain = hostname.split(':')[0].toLowerCase();

  // Skip platform domains
  const platformDomains = [
    'localhost',
    'vouchr.app',
    'www.vouchr.app',
    'staging.vouchr.app',
  ];
  if (platformDomains.includes(domain)) {
    return null;
  }

  const mapping = await prisma.domainMapping.findUnique({
    where: { domain },
    include: {
      merchant: {
        select: {
          id: true,
          slug: true,
          name: true,
          brandLogoUrl: true,
          brandColorsJson: true,
          featureFlags: true,
        },
      },
    },
  });

  if (!mapping) {
    return null;
  }

  const brandColors = (mapping.merchant.brandColorsJson as Record<string, string> | null) ?? {};
  const featureFlags = (mapping.merchant.featureFlags as Record<string, unknown> | null) ?? {};

  return {
    merchantId: mapping.merchant.id,
    merchantSlug: mapping.merchant.slug,
    merchantName: mapping.merchant.name,
    logo: mapping.merchant.brandLogoUrl ?? null,
    primaryColor: brandColors.primary || DEFAULT_PRIMARY_COLOR,
    hidePlatformBranding: featureFlags.hidePlatformBranding === true,
    customDomain: mapping.domain,
    verified: mapping.status === 'verified',
  };
}

/**
 * Get white-label config for a merchant by slug (for settings page).
 */
export async function getWhiteLabelConfigBySlug(merchantSlug: string): Promise<{
  domains: Array<{ id: string; domain: string; status: string; verifiedAt: Date | null }>;
  logo: string | null;
  primaryColor: string;
  hidePlatformBranding: boolean;
} | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { slug: merchantSlug },
    select: {
      id: true,
      brandLogoUrl: true,
      brandColorsJson: true,
      featureFlags: true,
      domainMappings: {
        select: {
          id: true,
          domain: true,
          status: true,
          verifiedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!merchant) return null;

  const brandColors = (merchant.brandColorsJson as Record<string, string> | null) ?? {};
  const featureFlags = (merchant.featureFlags as Record<string, unknown> | null) ?? {};

  return {
    domains: merchant.domainMappings,
    logo: merchant.brandLogoUrl ?? null,
    primaryColor: brandColors.primary || DEFAULT_PRIMARY_COLOR,
    hidePlatformBranding: featureFlags.hidePlatformBranding === true,
  };
}
