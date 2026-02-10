import * as React from 'react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { User, Mail, Settings, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function ProfilePage() {
  const t = await getTranslations('profile');
  const tNav = await getTranslations('nav');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2721]">{t('title')}</h1>
        <p className="text-sm text-[#6B5744]">{t('description')}</p>
      </div>

      <WarmCard padding="lg" className="bg-white">
        <h2 className="text-lg font-semibold text-[#2D2721] mb-4">{t('accountInformation')}</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#FFF9ED] flex items-center justify-center">
            <User className="h-8 w-8 text-[#E17B5C]" />
          </div>
          <div>
            <p className="font-medium text-[#2D2721]">John Doe</p>
            <p className="text-sm text-[#6B5744]">john@example.com</p>
          </div>
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white">
        <h2 className="text-lg font-semibold text-[#2D2721] mb-4">{tNav('settings')}</h2>
        <div className="space-y-2">
          <WarmButton asChild variant="ghost" className="w-full justify-start">
            <Link href="/app/notifications/settings">
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('emailPreferences')}
              </span>
            </Link>
          </WarmButton>
          <WarmButton asChild variant="ghost" className="w-full justify-start">
            <Link href="/app/notifications">
              <span className="inline-flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {tNav('notifications')}
              </span>
            </Link>
          </WarmButton>
          <WarmButton variant="ghost" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            {t('appSettings')}
          </WarmButton>
          <WarmButton variant="ghost" className="w-full justify-start text-[#E17B5C]">
            <LogOut className="h-4 w-4 mr-2" />
            {tNav('logout')}
          </WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
