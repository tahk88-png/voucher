'use client';

import { createContext, useContext } from 'react';

export type MerchantSettings = {
  slug: string;
  /** Upper-case ISO 4217 code, e.g. "EUR". */
  defaultCurrency: string;
};

const MerchantSettingsContext = createContext<MerchantSettings | null>(null);

export function MerchantSettingsProvider({
  value,
  children,
}: {
  value: MerchantSettings;
  children: React.ReactNode;
}) {
  return <MerchantSettingsContext.Provider value={value}>{children}</MerchantSettingsContext.Provider>;
}

/** Merchant-wide settings for client pages under /merchant/[slug]. */
export function useMerchantSettings(): MerchantSettings {
  return useContext(MerchantSettingsContext) ?? { slug: '', defaultCurrency: 'EUR' };
}
