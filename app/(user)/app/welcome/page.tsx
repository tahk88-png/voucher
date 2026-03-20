'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import {
  Ticket,
  Gift,
  MapPin,
  Bell,
  Shield,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Voucher Platform!',
    subtitle: "Let's get you set up in 60 seconds",
    icon: Sparkles,
  },
  {
    id: 'discover',
    title: 'Discover Deals',
    subtitle: 'Browse vouchers, gift cards, and events from local merchants',
    icon: Ticket,
    features: [
      { icon: Ticket, label: 'Digital vouchers & coupons' },
      { icon: Gift, label: 'Gift cards for friends & family' },
      { icon: MapPin, label: 'Nearby offers based on your location' },
    ],
  },
  {
    id: 'wallet',
    title: 'Your Digital Wallet',
    subtitle: 'All your purchases in one place — add to Apple/Google Wallet for instant access',
    icon: Gift,
    features: [
      { icon: Gift, label: 'QR codes for instant redemption' },
      { icon: Shield, label: 'Secure & always available offline' },
      { icon: Bell, label: 'Expiry reminders so you never miss out' },
    ],
  },
  {
    id: 'rewards',
    title: 'Earn Rewards',
    subtitle: 'Level up from Bronze to Diamond with every purchase, review, and referral',
    icon: Sparkles,
    features: [
      { icon: Sparkles, label: 'Daily check-ins & streaks' },
      { icon: Shield, label: '10 badges to unlock' },
      { icon: Gift, label: 'Tier benefits — discounts, early access' },
    ],
  },
  {
    id: 'notifications',
    title: 'Stay in the Loop',
    subtitle: 'Get notified about deals, price drops, and expiring vouchers',
    icon: Bell,
    actions: ['enable_notifications'],
  },
  {
    id: 'security',
    title: 'Secure Your Account',
    subtitle: 'Enable passkey or 2FA for passwordless, secure access',
    icon: Shield,
    actions: ['setup_security'],
  },
];

export default function WelcomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

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

  function skip() {
    router.push('/app');
  }

  async function handleAction(action: string) {
    if (action === 'enable_notifications' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setCompletedActions((prev) => new Set([...prev, action]));
      }
    }
    if (action === 'setup_security') {
      router.push('/app/settings/security');
      return;
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === currentStep ? 24 : 8,
                backgroundColor:
                  i < currentStep
                    ? 'var(--primary)'
                    : i === currentStep
                      ? 'var(--primary)'
                      : 'var(--border)',
              }}
            />
          ))}
        </div>

        <WarmCard className="p-8 text-center">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--surface-dim)' }}
          >
            <Icon size={32} style={{ color: 'var(--primary)' }} />
          </div>

          {/* Greeting */}
          {currentStep === 0 && session?.user?.name && (
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
              Hi, {session.user.name}!
            </p>
          )}

          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            {step.title}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {step.subtitle}
          </p>

          {/* Features list */}
          {step.features && (
            <div className="space-y-3 mb-6 text-left">
              {step.features.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--surface-dim)' }}
                  >
                    <f.icon size={16} style={{ color: 'var(--primary)' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {step.actions && (
            <div className="space-y-2 mb-6">
              {step.actions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleAction(action)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    border: '1px solid var(--border)',
                    color: completedActions.has(action) ? 'var(--primary)' : 'var(--text)',
                    backgroundColor: 'var(--surface)',
                  }}
                >
                  <span>
                    {action === 'enable_notifications' ? 'Enable push notifications' : 'Set up 2FA / Passkey'}
                  </span>
                  {completedActions.has(action) ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />
                  ) : (
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={skip}
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Skip
            </button>
            <WarmButton onClick={next} className="flex-1">
              {isLast ? 'Get Started' : 'Next'}
            </WarmButton>
          </div>
        </WarmCard>
      </div>
    </main>
  );
}
