import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'My Profile', noIndex: true });

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { User, Mail, Settings, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import EditProfileForm from '@/components/edit-profile-form';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const t = await getTranslations('profile');
  const tNav = await getTranslations('nav');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2721]">{t('title')}</h1>
        <p className="text-sm text-[#6B5744]">{t('description')}</p>
      </div>

      <WarmCard padding="lg" className="bg-white">
        <h2 className="text-lg font-semibold text-[#2D2721] mb-4">{t('accountInformation')}</h2>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#FFF9ED] flex items-center justify-center shrink-0">
            <User className="h-8 w-8 text-[#E17B5C]" />
          </div>
          <div className="flex-1">
            <EditProfileForm
              initialName={user?.name || ''}
              email={user?.email || ''}
            />
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
          <WarmButton asChild variant="ghost" className="w-full justify-start">
            <Link href="/app/settings">
              <span className="inline-flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('appSettings')}
              </span>
            </Link>
          </WarmButton>
          <WarmButton asChild variant="ghost" className="w-full justify-start text-[#E17B5C]">
            <Link href="/api/auth/signout?callbackUrl=/">
              <span className="inline-flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                {tNav('logout')}
              </span>
            </Link>
          </WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
