import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import Link from 'next/link';
import { User, Bell, Lock, Trash2, Shield, Monitor } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import PushSubscribeButton from '@/components/push-subscribe-button';
import ChangePasswordForm from '@/components/change-password-form';
import DeleteAccountDialog from '@/components/delete-account-dialog';
import EditProfileForm from '@/components/edit-profile-form';
import { SignOutButton } from '@/components/sign-out-button';
import { isWebPushConfigured } from '../_components/push-config';

function SectionHeader({ icon: Icon, title, description, danger = false }: {
  icon: typeof User;
  title: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 mb-4">
      <div
        className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${danger ? 'bg-red-50' : 'bg-[#FFF9ED]'}`}
      >
        <Icon className={`h-5 w-5 ${danger ? 'text-red-500' : 'text-[#8B7355]'}`} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-[#2D2721]">{title}</h2>
        <p className="text-sm text-[#6B5744]">{description}</p>
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const locale = await getLocale();
  const tNav = await getTranslations('nav');
  const t = await getTranslations('settingsPage');
  const tProfile = await getTranslations('profile');
  const tNotifications = await getTranslations('notifications');
  const tAccount = await getTranslations('accountSecurity');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, createdAt: true, passwordHash: true },
  });
  const pushAvailable = isWebPushConfigured();

  const cardClass = 'bg-white border border-[rgba(139,115,85,0.15)]';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2721]">{tNav('settings')}</h1>
        <p className="text-sm text-[#6B5744]">{t('description')}</p>
      </div>

      <WarmCard padding="lg" className={cardClass}>
        <SectionHeader
          icon={User}
          title={tProfile('accountInformation')}
          description={
            user?.createdAt
              ? tAccount('settings.joinedOn', { date: user.createdAt.toLocaleDateString(locale) })
              : tAccount('settings.joinedRecently')
          }
        />
        <EditProfileForm initialName={user?.name || ''} email={user?.email || ''} />
      </WarmCard>

      <WarmCard padding="lg" className={cardClass}>
        <SectionHeader icon={Bell} title={tNav('notifications')} description={tNotifications('settingsDescription')} />
        <div className="space-y-4">
          <WarmButton asChild variant="outline" size="sm">
            <Link href="/app/notifications/settings">{tNotifications('settingsTitle')}</Link>
          </WarmButton>
          {pushAvailable && (
            <div className="border-t border-[#F0E2C9] pt-4 space-y-3">
              <p className="text-sm text-[#6B5744]">{t('pushDescription')}</p>
              <PushSubscribeButton />
            </div>
          )}
        </div>
      </WarmCard>

      <WarmCard padding="lg" className={cardClass}>
        <SectionHeader
          icon={Lock}
          title={user?.passwordHash ? t('changePasswordTitle') : t('setPasswordTitle')}
          description={user?.passwordHash ? t('changePasswordDescription') : t('setPasswordDescription')}
        />
        <ChangePasswordForm hasPassword={!!user?.passwordHash} />
      </WarmCard>

      <WarmCard padding="lg" className={cardClass}>
        <SectionHeader icon={Shield} title={t('twoFactorTitle')} description={t('twoFactorDescription')} />
        <WarmButton asChild variant="outline" size="sm">
          <Link href="/app/settings/security">{t('twoFactorManage')}</Link>
        </WarmButton>
      </WarmCard>

      <WarmCard padding="lg" className={cardClass}>
        <SectionHeader icon={Monitor} title={t('sessionsTitle')} description={t('sessionsDescription')} />
        <WarmButton asChild variant="outline" size="sm">
          <Link href="/app/settings/sessions">{t('sessionsView')}</Link>
        </WarmButton>
      </WarmCard>

      <WarmCard padding="lg" className={cardClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#2D2721]">{t('accountAccessTitle')}</h2>
            <p className="text-sm text-[#6B5744]">{t('accountAccessDescription')}</p>
          </div>
          <SignOutButton variant="outline" size="sm" />
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-red-100">
        <SectionHeader icon={Trash2} title={t('deleteTitle')} description={t('deleteDescription')} danger />
        <DeleteAccountDialog />
      </WarmCard>
    </div>
  );
}
