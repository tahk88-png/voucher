import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import Link from 'next/link';
import { Settings, Bell, Lock, Trash2, Shield, Monitor } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import PushSubscribeButton from '@/components/push-subscribe-button';
import ChangePasswordForm from '@/components/change-password-form';
import DeleteAccountDialog from '@/components/delete-account-dialog';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const locale = await getLocale();
  const tNav = await getTranslations('nav');
  const t = await getTranslations('settingsPage');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2721]">{tNav('settings')}</h1>
        <p className="text-sm text-[#6B5744]">{t('description')}</p>
      </div>

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-[#FFF9ED] flex items-center justify-center">
            <Settings className="h-6 w-6 text-[#8B7355]" />
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold text-[#2D2721]">{user?.name || tNav('user')}</div>
            <div className="text-sm text-[#6B5744]">{user?.email}</div>
            <div className="text-xs text-[#8B7355]">
              {t('joined')} {user?.createdAt ? user.createdAt.toLocaleDateString(locale) : t('recently')}
            </div>
          </div>
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#FFF9ED] flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-[#8B7355]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#2D2721]">Push notifications</div>
            <div className="text-sm text-[#6B5744]">Get notified when your vouchers are redeemed or about to expire.</div>
          </div>
        </div>
        <PushSubscribeButton />
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#FFF9ED] flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-[#8B7355]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#2D2721]">{user?.passwordHash ? 'Change password' : 'Set password'}</div>
            <div className="text-sm text-[#6B5744]">
              {user?.passwordHash
                ? 'Update your account password'
                : 'Set a password to sign in with email and password'}
            </div>
          </div>
        </div>
        <ChangePasswordForm hasPassword={!!user?.passwordHash} />
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#FFF9ED] flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-[#8B7355]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#2D2721]">Two-factor authentication</div>
            <div className="text-sm text-[#6B5744]">Add an extra layer of security with an authenticator app</div>
          </div>
        </div>
        <WarmButton asChild variant="outline" size="sm">
          <Link href="/app/settings/security">Manage 2FA</Link>
        </WarmButton>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#FFF9ED] flex items-center justify-center shrink-0">
            <Monitor className="h-5 w-5 text-[#8B7355]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#2D2721]">Active sessions</div>
            <div className="text-sm text-[#6B5744]">View and manage your active sessions across devices</div>
          </div>
        </div>
        <WarmButton asChild variant="outline" size="sm">
          <Link href="/app/settings/sessions">View sessions</Link>
        </WarmButton>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-[#2D2721]">{t('accountAccessTitle')}</div>
            <div className="text-sm text-[#6B5744]">{t('accountAccessDescription')}</div>
          </div>
          <WarmButton asChild variant="outline" size="sm">
            <Link href="/api/auth/signout?callbackUrl=/">{tNav('logout')}</Link>
          </WarmButton>
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-red-100">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-red-50 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#2D2721]">Delete account</div>
            <div className="text-sm text-[#6B5744]">Permanently delete your account and anonymize your data. This action cannot be undone.</div>
          </div>
        </div>
        <DeleteAccountDialog />
      </WarmCard>
    </div>
  );
}
