'use client';

import { CountryProvider } from '@/figma/app/contexts/CountryContext';
import { LanguageProvider } from '@/figma/app/contexts/LanguageContext';
import { AdminSettingsProvider } from '@/figma/app/contexts/AdminSettings';
import { BonusTrackingProvider } from '@/figma/app/contexts/BonusTracking';
import { CartProvider } from '@/figma/app/contexts/CartContext';
import { AuthProvider } from '@/figma/app/contexts/AuthContext';
import { Toaster } from '@/figma/app/components/ui/sonner';
import { ChatWidget } from '@/figma/app/components/widgets/ChatWidget';
import { FeedbackWidget } from '@/figma/app/components/widgets/FeedbackWidget';

export function FigmaProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CountryProvider>
        <LanguageProvider>
          <AdminSettingsProvider>
            <BonusTrackingProvider>
              <CartProvider>
                {children}
                <Toaster />
                <ChatWidget />
                <FeedbackWidget />
              </CartProvider>
            </BonusTrackingProvider>
          </AdminSettingsProvider>
        </LanguageProvider>
      </CountryProvider>
    </AuthProvider>
  );
}
