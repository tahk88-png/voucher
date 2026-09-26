'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import PushSubscribeButton from '@/components/push-subscribe-button';
import {
  Ticket,
  Gift,
  MapPin,
  Bell,
  Shield,
  ChevronRight,
  Sparkles,
  QrCode,
  Mail,
  Users,
  Flame,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

interface Step {
  id: string;
  icon: LucideIcon;
  features?: Array<{ icon: LucideIcon; key: string }>;
}

// Only features that exist today. Offline access, price-drop alerts and
// loyalty-tier benefits were promised here before but are not available.
const allSteps: Step[] = [
  { id: 'welcome', icon: Sparkles },
  {
    id: 'discover',
    icon: Ticket,
    features: [
      { icon: Ticket, key: 'vouchers' },
      { icon: Gift, key: 'giftCards' },
      { icon: MapPin, key: 'nearby' },
    ],
  },
  {
    id: 'wallet',
    icon: Gift,
    features: [
      { icon: QrCode, key: 'qr' },
      { icon: Mail, key: 'expiry' },
    ],
  },
  {
    id: 'rewards',
    icon: Trophy,
    features: [
      { icon: Users, key: 'referralCredit' },
      { icon: Flame, key: 'checkIns' },
      { icon: Trophy, key: 'badges' },
    ],
  },
  { id: 'notifications', icon: Bell },
  { id: 'security', icon: Shield },
];

export default function WelcomeClient({ userName, pushAvailable }: { userName: string | null; pushAvailable: boolean }) {
  const router = useRouter();
  const t = useTranslations('welcome');
  const [currentStep, setCurrentStep] = useState(0);

  const steps = allSteps.filter((s) => s.id !== 'notifications' || pushAvailable);
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const Icon = step.icon;

  function next() {
    if (isLast) {
      router.push('/app');
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  return (
    <div className="flex items-center justify-center py-6">
      <div className="w-full max-w-md">
        <div
          className="flex justify-center gap-2 mb-8"
          role="progressbar"
          aria-label={t('progress')}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={currentStep + 1}
        >
          {steps.map((s, i) => (
            <div
              key={s.id}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === currentStep ? 24 : 8,
                backgroundColor: i <= currentStep ? 'var(--primary)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        <WarmCard className="p-6 sm:p-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--surface-dim)' }}
          >
            <Icon size={32} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          </div>

          {currentStep === 0 && userName && (
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
              {t('greeting', { name: userName })}
            </p>
          )}

          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            {t(`steps.${step.id}.title` as never)}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {t(`steps.${step.id}.subtitle` as never)}
          </p>

          {step.features && (
            <ul className="space-y-3 mb-6 text-left">
              {step.features.map((f) => (
                <li key={f.key} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--surface-dim)' }}
                  >
                    <f.icon size={16} style={{ color: 'var(--primary)' }} aria-hidden="true" />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    {t(`steps.${step.id}.features.${f.key}` as never)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {step.id === 'notifications' && (
            <div className="flex justify-center mb-6">
              <PushSubscribeButton />
            </div>
          )}

          {step.id === 'security' && (
            <button
              type="button"
              onClick={() => router.push('/app/settings/security')}
              className="w-full flex items-center justify-between px-4 py-3 mb-6 rounded-lg text-sm font-medium transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text)', backgroundColor: 'var(--surface)' }}
            >
              <span>{t('setUpSecurity')}</span>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            </button>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/app')}
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('skip')}
            </button>
            <WarmButton onClick={next} className="flex-1">
              {isLast ? t('getStarted') : t('next')}
            </WarmButton>
          </div>
        </WarmCard>
      </div>
    </div>
  );
}
